

import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

import {SMSservice} from '../services/sms.service.js'
import NotificationModel from '../models/notification.models.js';
import SentNotific from '../models/sentnotification.model.js';
import NotificationTypeModel from '../models/notification_type.model.js';
import { v4 as uuidv4 } from 'uuid';
import {EmailService} from '../services/email.service.js'

const kafka = new Kafka({
    clientId: 'notification-app',
    brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

export const startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'notifications', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            let payload = null;
            
            try {
                payload = JSON.parse(message.value.toString());
                console.log("Received payload from Kafka:", JSON.stringify(payload, null, 2));

                // Validate payload has required fields
                if (!payload.sid) {
                    console.error(" Missing 'sid' in payload");
                    return; // Acknowledge message and skip processing
                }

                // Check if this notification already exists and is processed
                const existingNotification = await SentNotific.findBySID({ sid: payload.sid });
                
                if (existingNotification && existingNotification.length > 0) {
                    const status = existingNotification[0].status;
                    console.log(` Notification ${payload.sid} already exists with status: ${status}`);
                    
                    // If it's already sent or delivered, skip processing
                    if (status === 'sent' || status === 'delivered') {
                        console.log(` Skipping already processed notification: ${payload.sid}`);
                        return; // Acknowledge and skip
                    }
                    
                    // If it's failed or queued, we can retry processing
                    if (status === 'failed' || status === 'queued') {
                        console.log(` Retrying failed/queued notification: ${payload.sid}`);
                        // Continue with processing
                    }
                     await processNotification(payload);
                } else {
                    // New notification - create database records first
                    await createNotificationRecords(payload);
                    
                }

                // Process the SMS sending
               

            } catch (err) {
                console.error(" Error processing message:", err);
                
                // Handle the error gracefully
                await handleProcessingError(payload, err);
                
                // DON'T throw the error - this allows Kafka to acknowledge the message
                // and prevents infinite retry loops
            }
        },
    });
};

async function createNotificationRecords(payload) {
    try {
        // Find notification type
       
       
        const typeRecord = await NotificationTypeModel.findByTypeCarrier({
            type: payload.type,
            carrier: payload.carrier
        });
        
        if (!typeRecord || typeRecord.length === 0) {
            throw new Error(`Notification type not found: ${payload.type}/${payload.carrier}`);
        }
        
        const type_id = typeRecord[0]?.type_id;
        const notification_id = uuidv4();
        
        // Create notification record
        await NotificationModel.create({
            notification_id,
            type_id,
            message: payload.message,
            title: payload.title,
        });
        
        // Create sent notification record with 'queued' status
        await SentNotific.create({
            sid: payload.sid,
            user_id: payload.user_id,
            notification_id,
            sent_at: payload.sent_at,
            sent_to: payload.sent_to,
            status: 'queued'
        });
         await processNotification(payload);
        console.log("Database records created with 'queued' status");
        
    } catch (createError) {
        // Check if it's a duplicate key error
        if (createError.code === '23505' || createError.message.includes('duplicate key')) {
            console.log("Record already exists, continuing with processing...");
            return; // Not a fatal error, continue processing
        }
        throw createError; // Re-throw other errors
    }
}

async function processNotification(payload) {
    try {
        console.log(" Sending message...");
        if(payload.carrier==='sms'){

            const twilioSid = await SMSservice({ payload });
            
            // Update status to 'sent' with Twilio SID
    
            await SentNotific.UpdateStatusAndId({
                sid: payload.sid, 
                status: 'sent',
                carriersid: twilioSid,
                read_at:null
            });
    
            console.log(` SMS sent and stored successfully. SID: ${payload.sid}, Twilio SID: ${twilioSid}`);
        }
        else{

            const info=await EmailService(payload);
           
            await SentNotific.UpdateStatusAndId({
                sid: payload.sid, 
                status: 'sent',
                carriersid: info.messageId,
                read_at:null
            });
    
            console.log(` email sent and stored. SID: ${payload.sid}, email message SID: ${info.messageId} status: ${info.accepted} ${info.response}`);

            

        }
        
        
    } catch (messageError) {
        console.error(" Error sending SMS:", messageError);
        
        // Update status to 'failed'
        await SentNotific.UpdateStatus({
            sid: payload.sid, 
            status: 'failed',
        });
        
        throw messageError; // Re-throw to be handled by main error handler
    }
}

async function handleProcessingError(payload, error) {
    try {
        console.error(" Handling processing error for payload:", payload?.sid || 'unknown');
        
        // Only try to update status if we have a valid payload with sid
        if (payload && payload.sid) {
            try {
                await SentNotific.UpdateStatus({
                    sid: payload.sid, 
                    status: 'failed',
                });
                console.log(` Updated notification ${payload.sid} status to 'failed'`);
            } catch (updateError) {
                console.error(" Error updating failed status:", updateError);
                // Don't throw - we want to acknowledge the message anyway
            }
        }
        
        // Log the error for monitoring
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            sid: payload?.sid,
            timestamp: new Date().toISOString()
        });
        
    } catch (handlerError) {
        console.error("Error in error handler:", handlerError);
        // Swallow this error to prevent infinite loops
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(' Shutting down Kafka consumer...');
    try {
        await consumer.disconnect();
        console.log(' Kafka consumer disconnected successfully');
    } catch (error) {
        console.error(' Error disconnecting consumer:', error);
    }
    process.exit(0);
});