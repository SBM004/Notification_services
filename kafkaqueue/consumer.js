

// import { Kafka } from 'kafkajs';
// import dotenv from 'dotenv';
// dotenv.config();

// import {SMSservice} from '../services/sms.service.js'
// import NotificationModel from '../models/notification.models.js';
// import SentNotific from '../models/sentnotification.model.js';
// import NotificationTypeModel from '../models/notification_type.model.js';
// import { v4 as uuidv4 } from 'uuid';
// import {EmailService} from '../services/email.service.js'

// const kafka = new Kafka({
//     clientId: 'notification-app',
//     brokers: [process.env.KAFKA_BROKER]
// });

// const consumer = kafka.consumer({ groupId: 'notification-group' });

// export const startConsumer = async () => {
//     await consumer.connect();
//     await consumer.subscribe({ topic: 'notifications', fromBeginning: false });

//     await consumer.run({
//         eachMessage: async ({ topic, partition, message }) => {
//             let payload = null;
            
//             try {
//                 payload = JSON.parse(message.value.toString());
//                 console.log("Received payload from Kafka:", JSON.stringify(payload, null, 2));

//                 // Validate payload has required fields
//                 if (!payload.sid) {
//                     console.error(" Missing 'sid' in payload");
//                     return; // Acknowledge message and skip processing
//                 }

//                 // Check if this notification already exists and is processed
//                 const existingNotification = await SentNotific.findBySID({ sid: payload.sid });
                
//                 if (existingNotification && existingNotification.length > 0) {
//                     const status = existingNotification[0].status;
//                     console.log(` Notification ${payload.sid} already exists with status: ${status}`);
                    
//                     // If it's already sent or delivered, skip processing
//                     if (status === 'sent' || status === 'delivered') {
//                         console.log(` Skipping already processed notification: ${payload.sid}`);
//                         return; // Acknowledge and skip
//                     }
                    
//                     // If it's failed or queued, we can retry processing
//                     if (status === 'failed' || status === 'queued') {
//                         console.log(` Retrying failed/queued notification: ${payload.sid}`);
//                         // Continue with processing
//                     }
//                      await processNotification(payload);
//                 } else {
//                     // New notification - create database records first
//                     await createNotificationRecords(payload);
                    
//                 }

//                 // Process the SMS sending
               

//             } catch (err) {
//                 console.error(" Error processing message:", err);
                
//                 // Handle the error gracefully
//                 await handleProcessingError(payload, err);
                
//                 // DON'T throw the error - this allows Kafka to acknowledge the message
//                 // and prevents infinite retry loops
//             }
//         },
//     });
// };

// async function createNotificationRecords(payload) {
//     try {
//         // Find notification type
       
       
//         const typeRecord = await NotificationTypeModel.findByTypeCarrier({
//             type: payload.type,
//             carrier: payload.carrier
//         });
        
//         if (!typeRecord || typeRecord.length === 0) {
//             throw new Error(`Notification type not found: ${payload.type}/${payload.carrier}`);
//         }
        
//         const type_id = typeRecord[0]?.type_id;
//         const notification_id = uuidv4();
        
//         // Create notification record
//         await NotificationModel.create({
//             notification_id,
//             type_id,
//             message: payload.message,
//             title: payload.title,
//         });
        
//         // Create sent notification record with 'queued' status
//         await SentNotific.create({
//             sid: payload.sid,
//             user_id: payload.user_id,
//             notification_id,
//             sent_at: payload.sent_at,
//             sent_to: payload.sent_to,
//             status: 'queued'
//         });
//          await processNotification(payload);
//         console.log("Database records created with 'queued' status");
        
//     } catch (createError) {
//         // Check if it's a duplicate key error
//         if (createError.code === '23505' || createError.message.includes('duplicate key')) {
//             console.log("Record already exists, continuing with processing...");
//             return; // Not a fatal error, continue processing
//         }
//         throw createError; // Re-throw other errors
//     }
// }

// async function processNotification(payload) {
//     try {
//         console.log(" Sending message...");
//         if(payload.carrier==='sms'){

//             const twilioSid = await SMSservice({ payload });
            
//             // Update status to 'sent' with Twilio SID
    
//             await SentNotific.UpdateStatusAndId({
//                 sid: payload.sid, 
//                 status: 'sent',
//                 carriersid: twilioSid,
//                 read_at:null
//             });
    
//             console.log(` SMS sent and stored successfully. SID: ${payload.sid}, Twilio SID: ${twilioSid}`);
//         }
//         else{

//             const info=await EmailService(payload);
           
//             await SentNotific.UpdateStatusAndId({
//                 sid: payload.sid, 
//                 status: 'sent',
//                 carriersid: info.messageId,
//                 read_at:null
//             });
    
//             console.log(` email sent and stored. SID: ${payload.sid}, email message SID: ${info.messageId} status: ${info.accepted} ${info.response}`);

            

//         }
        
        
//     } catch (messageError) {
//         console.error(" Error sending SMS:", messageError);
        
//         // Update status to 'failed'
//         await SentNotific.UpdateStatus({
//             sid: payload.sid, 
//             status: 'failed',
//         });
        
//         throw messageError; // Re-throw to be handled by main error handler
//     }
// }

// async function handleProcessingError(payload, error) {
//     try {
//         console.error(" Handling processing error for payload:", payload?.sid || 'unknown');
        
//         // Only try to update status if we have a valid payload with sid
//         if (payload && payload.sid) {
//             try {
//                 await SentNotific.UpdateStatus({
//                     sid: payload.sid, 
//                     status: 'failed',
//                 });
//                 console.log(` Updated notification ${payload.sid} status to 'failed'`);
//             } catch (updateError) {
//                 console.error(" Error updating failed status:", updateError);
//                 // Don't throw - we want to acknowledge the message anyway
//             }
//         }
        
//         // Log the error for monitoring
//         console.error("Error details:", {
//             message: error.message,
//             code: error.code,
//             sid: payload?.sid,
//             timestamp: new Date().toISOString()
//         });
        
//     } catch (handlerError) {
//         console.error("Error in error handler:", handlerError);
//         // Swallow this error to prevent infinite loops
//     }
// }

// // Graceful shutdown
// process.on('SIGINT', async () => {
//     console.log(' Shutting down Kafka consumer...');
//     try {
//         await consumer.disconnect();
//         console.log(' Kafka consumer disconnected successfully');
//     } catch (error) {
//         console.error(' Error disconnecting consumer:', error);
//     }
//     process.exit(0);
// });
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

import {SMSservice} from '../services/sms.service.js'
import NotificationModel from '../models/notification.models.js';
import SentNotific from '../models/sentnotification.model.js';
import NotificationTypeModel from '../models/notification_type.model.js';
import { v4 as uuidv4 } from 'uuid';
import {EmailService} from '../services/email.service.js'
import UserModel from '../models/user.model.js';
const kafka = new Kafka({
    clientId: 'notification-app',
    brokers: [process.env.KAFKA_BROKER]
});

// Create different consumer pools for different priorities
const consumers = {
    // ERROR consumers - 5 instances, fastest processing
     error: createConsumerPool('error-processors', 4, {
        sessionTimeout: 15000,      // Increased from 5000
        heartbeatInterval: 3000,    // Increased from 800
        maxWaitTimeInMs: 1000,      // Increased from 100ms to 1s
        maxBytesPerPartition: 1024 * 1024,
        // Add these for better stability:
        allowAutoTopicCreation: false,
        maxBytes: 1024 * 1024 * 10,  // 10MB max per fetch
        retry: {
            initialRetryTime: 100,
            retries: 3
        }
    }),
    
    // WARNING consumers - 3 instances, fast processing  
    warning: createConsumerPool('warning-processors', 3, {
        sessionTimeout: 6000,
        heartbeatInterval: 1000,
        maxWaitTimeInMs: 200,       // Poll every 200ms
        maxBytesPerPartition: 1024 * 1024
    }),
    
    // INFO consumers - 2 instances, normal processing
    info: createConsumerPool('info-processors', 2, {
        sessionTimeout: 15000,
        heartbeatInterval: 2000,
        maxWaitTimeInMs: 1000,      // Poll every 1s
        maxBytesPerPartition: 1024 * 1024 * 2
    }),
    
    // REMINDER consumers - 1 instance, batch processing
    reminder: createConsumerPool('reminder-processors', 1, {
        sessionTimeout: 30000,
        heartbeatInterval: 5000,
        maxWaitTimeInMs: 5000,      // Poll every 5s
        maxBytesPerPartition: 1024 * 1024 * 5 // Can handle larger batches
    })
};

// Helper function to create consumer pool
function createConsumerPool(groupId, count, config) {
    const pool = [];
    for (let i = 0; i < count; i++) {
        pool.push(kafka.consumer({
            groupId,
            consumerId: `${groupId}-${i}`,
            ...config
        }));
    }
    return pool;
}

// Topic mapping
const PRIORITY_TOPICS = {
    error: 'notifications-error',
    warning: 'notifications-warning',
    info: 'notifications-info', 
    reminder: 'notifications-reminder'
};

// Start all consumer groups
export const startConsumer = async () => {
    // Start ERROR consumers (highest priority)
    await startConsumerGroup('error', consumers.error, PRIORITY_TOPICS.error);
    
    // Start WARNING consumers
    await startConsumerGroup('warning', consumers.warning, PRIORITY_TOPICS.warning);
    
    // Start INFO consumers
    await startConsumerGroup('info', consumers.info, PRIORITY_TOPICS.info);
    
    // Start REMINDER consumers (lowest priority)
    await startConsumerGroup('reminder', consumers.reminder, PRIORITY_TOPICS.reminder);
    
    console.log(' All priority-based consumers started successfully');
};

// ...existing code...

async function startConsumerGroup(priority, consumerPool, topic) {
    for (let i = 0; i < consumerPool.length; i++) {
        const consumer = consumerPool[i];
        
        await consumer.connect();
        await consumer.subscribe({ 
            topic: topic, 
            fromBeginning: false 
        });
        
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const startTime = Date.now();
                let payload = null;
                
                try {
                    payload = JSON.parse(message.value.toString());
                    console.log(`${priority.toUpperCase()} Consumer-${i} processing:`, payload.sid);
                    
                    // Process with priority-specific logic
                    await processNotificationWithPriority(payload, priority);
                    
                    const processingTime = Date.now() - startTime;
                    console.log(`${priority.toUpperCase()} processed in ${processingTime}ms`);
                    
                } catch (err) {
                    console.error(`${priority.toUpperCase()} Consumer error:`, err);
                    await handleProcessingError(payload, err);
                }
            }
        });
    }
    
    console.log(`Started ${consumerPool.length} ${priority.toUpperCase()} consumers on ${topic}`);
}

async function processNotificationWithPriority(payload, priority) {
    // Validate payload
    if (!payload.sid) {
        console.error(`Missing 'sid' in ${priority} payload`);
        return;
    }
    
    try {
        const existingNotification = await withTimeout(
            SentNotific.findBySID({ sid: payload.sid }),
            5000,
            "Database query"
        );
        
        if (existingNotification && existingNotification.length > 0) {
            const status = existingNotification[0].status;
            console.log(`${priority.toUpperCase()} notification ${payload.sid} exists with status: ${status}`);
            
            if (status === 'sent' || status === 'delivered') {
                console.log(`Skipping already processed ${priority} notification: ${payload.sid}`);
                return;
            }
            
            if (status === 'failed' || status === 'queued') {
                console.log(`Retrying ${priority} notification: ${payload.sid}`);
            }
            
            await processNotificationByPriority(payload, priority);
        } else {
            await createNotificationRecords(payload, priority);
        }
    } catch (error) {
        console.error(`Error in ${priority} processing for ${payload.sid}:`, error.message);
        
        try {
            await withTimeout(
                SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }),
                5000,
                "Database update failed status"
            );
        } catch (updateError) {
            console.error(`Failed to update failed status for ${payload.sid}:`, updateError.message);
        }
        
        throw error;
    }
}

async function processNotificationByPriority(payload, priority) {
    try {
        console.log(`Processing ${priority.toUpperCase()} message...`);
        
        switch(priority) {
            case 'error':
                await processCriticalNotification(payload);
                break;
            case 'warning':
                await processHighPriorityNotification(payload);
                break;
            case 'info':
                await processNormalNotification(payload);
                break;
            case 'reminder':
                await processLowPriorityNotification(payload);
                break;
        }
        
    } catch (messageError) {
        console.error(`Error processing ${priority} notification:`, messageError);
        
        await SentNotific.UpdateStatus({
            sid: payload.sid,
            status: 'failed',
        });
        
        throw messageError;
    }
}

async function withTimeout(promise, timeoutMs = 10000, operation = "operation") {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
}

async function processCriticalNotification(payload) {
    console.log(`CRITICAL processing for ${payload.sid}`);
    
    try {
        if (payload.carrier === 'sms') {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.phone_number;
            const twilioSid = await withTimeout(
                SMSservice({ payload }), 
                10000, 
                "SMS service"
            );
            await withTimeout(
                updateNotificationStatus(payload.sid, 'sent', twilioSid),
                5000,
                "Database update"
            );
            console.log(`CRITICAL SMS sent: ${payload.sid}`);
        } else {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.email;
            const info = await withTimeout(
                EmailService(payload), 
                15000, 
                "Email service"
            );
            await withTimeout(
                updateNotificationStatus(payload.sid, 'sent', info.messageId),
                5000,
                "Database update"
            );
            console.log(`CRITICAL Email sent: ${payload.sid}`);
        }
    } catch (error) {
        console.error(`CRITICAL processing failed for ${payload.sid}:`, error.message);
        
        try {
            await withTimeout(
                SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }),
                5000,
                "Database update failed status"
            );
        } catch (updateError) {
            console.error(`Failed to update status for ${payload.sid}:`, updateError.message);
        }
        
        throw error;
    }
}

async function processHighPriorityNotification(payload) {
    console.log(`HIGH PRIORITY processing for ${payload.sid}`);
    
    try {
        if (payload.carrier === 'sms') {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.phone_number;
            const twilioSid = await withTimeout(SMSservice({ payload }), 10000, "SMS service");
            await withTimeout(updateNotificationStatus(payload.sid, 'sent', twilioSid), 5000, "Database update");
        } else {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.email;
            const info = await withTimeout(EmailService(payload), 15000, "Email service");
            await withTimeout(updateNotificationStatus(payload.sid, 'sent', info.messageId), 5000, "Database update");
        }
    } catch (error) {
        console.error(`WARNING processing failed for ${payload.sid}:`, error.message);
        await withTimeout(SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }), 5000, "Database update");
        throw error;
    }
}

async function processNormalNotification(payload) {
    console.log(`INFO processing for ${payload.sid}`);
    
    try {
        if (payload.carrier === 'sms') {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.phone_number;
            const twilioSid = await withTimeout(SMSservice({ payload }), 10000, "SMS service");
            await withTimeout(updateNotificationStatus(payload.sid, 'sent', twilioSid), 5000, "Database update");
        } else {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.email;
            const info = await withTimeout(EmailService(payload), 15000, "Email service");
            await withTimeout(updateNotificationStatus(payload.sid, 'sent', info.messageId), 5000, "Database update");
        }
    } catch (error) {
        console.error(`INFO processing failed for ${payload.sid}:`, error.message);
        await withTimeout(SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }), 5000, "Database update");
        throw error;
    }
}

async function processLowPriorityNotification(payload) {
    console.log(`REMINDER processing for ${payload.sid}`);
    
    try {
        if (payload.carrier === 'sms') {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.phone_number;
            const twilioSid = await withTimeout(SMSservice({ payload }), 10000, "SMS service");
            await withTimeout(updateNotificationStatus(payload.sid, 'sent', twilioSid), 5000, "Database update");
        } else {
            const u=await UserModel. findUserById({user_id:payload.user_id});
            payload.from=u.email;
            const info = await withTimeout(EmailService(payload), 15000, "Email service");
            await withTimeout(updateNotificationStatus(payload.sid, 'sent', info.messageId), 5000, "Database update");
        }
    } catch (error) {
        console.error(`REMINDER processing failed for ${payload.sid}:`, error.message);
        await withTimeout(SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }), 5000, "Database update");
        throw error;
    }
}

async function updateNotificationStatus(sid, status, carriersid) {
    await SentNotific.UpdateStatusAndId({
        sid: sid,
        status: status,
        carriersid: carriersid,
        read_at: null
    });
}

async function createNotificationRecords(payload, priority) {
    try {
        const typeRecord = await NotificationTypeModel.findByTypeCarrier({
            type: payload.type,
            carrier: payload.carrier
        });
        
        if (!typeRecord || typeRecord.length === 0) {
            throw new Error(`Notification type not found: ${payload.type}/${payload.carrier}`);
        }
        
        const type_id = typeRecord[0]?.type_id;
        const notification_id = uuidv4();
        
        await NotificationModel.create({
            notification_id,
            type_id,
            message: payload.message,
            title: payload.title,
        });
        
        await SentNotific.create({
            sid: payload.sid,
            user_id: payload.user_id,
            notification_id,
            sent_at: payload.sent_at,
            sent_to: payload.sent_to,
            status: 'queued'
        });
        
        console.log(`${priority.toUpperCase()} database records created`);
        await processNotificationByPriority(payload, priority);
        
    } catch (createError) {
        if (createError.code === '23505' || createError.message.includes('duplicate key')) {
            console.log(`${priority.toUpperCase()} record already exists`);
            return;
        }
        throw createError;
    }
}

async function handleProcessingError(payload, error) {
    try {
        if (payload && payload.sid) {
            try {
                await SentNotific.UpdateStatus({
                    sid: payload.sid,
                    status: 'failed',
                });
                console.log(`Updated notification ${payload.sid} to failed`);
            } catch (updateError) {
                console.error("Error updating failed status:", updateError);
            }
        }
        
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            sid: payload?.sid,
            timestamp: new Date().toISOString()
        });
        
    } catch (handlerError) {
        console.error("Error in error handler:", handlerError);
    }
}

process.on('SIGINT', async () => {
    console.log('Shutting down all priority consumers...');
    try {
        for (const [priority, consumerPool] of Object.entries(consumers)) {
            for (const consumer of consumerPool) {
                await consumer.disconnect();
            }
            console.log(`${priority.toUpperCase()} consumers disconnected`);
        }
        
        console.log('All consumers disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting consumers:', error);
    }
    process.exit(0);
});





// import { Kafka } from 'kafkajs';
// import dotenv from 'dotenv';
// dotenv.config();

// import {SMSservice} from '../services/sms.service.js'
// import NotificationModel from '../models/notification.models.js';
// import SentNotific from '../models/sentnotification.model.js';
// import NotificationTypeModel from '../models/notification_type.model.js';
// import { v4 as uuidv4 } from 'uuid';
// import {EmailService} from '../services/email.service.js'
// import UserModel from '../models/user.model.js';

// const kafka = new Kafka({
//     clientId: 'notification-app',
//     brokers: [process.env.KAFKA_BROKER],
//     // Global Kafka optimizations
//     connectionTimeout: 3000,
//     requestTimeout: 25000,
//     retry: {
//         initialRetryTime: 100,
//         retries: 8
//     }
// });

// // Optimized consumer configurations for different priorities
// const consumers = {
//     // ERROR consumers - Ultra fast processing (4 instances)
//     error: createConsumerPool('error-processors', 4, {
//         sessionTimeout: 10000,
//         heartbeatInterval: 1000,
//         maxWaitTimeInMs: 100,        // Poll every 100ms - FASTEST
//         maxBytesPerPartition: 1024 * 512,  // Smaller batches for speed
//         maxBytes: 1024 * 1024 * 5,   // 5MB max
//         allowAutoTopicCreation: false,
//         partitionAssignmentStrategy: ['RoundRobinAssigner'], // Better distribution
//         retry: {
//             initialRetryTime: 50,
//             retries: 3
//         }
//     }),
    
//     // WARNING consumers - Fast processing (3 instances)
//     warning: createConsumerPool('warning-processors', 3, {
//         sessionTimeout: 12000,
//         heartbeatInterval: 1500,
//         maxWaitTimeInMs: 200,        // Poll every 200ms - FAST
//         maxBytesPerPartition: 1024 * 1024,
//         maxBytes: 1024 * 1024 * 8,   // 8MB max
//         allowAutoTopicCreation: false,
//         partitionAssignmentStrategy: ['RoundRobinAssigner'],
//         retry: {
//             initialRetryTime: 100,
//             retries: 3
//         }
//     }),
    
//     // INFO consumers - Normal processing (2 instances) - FIXED CONFIG
//     info: createConsumerPool('info-processors', 2, {
//         sessionTimeout: 15000,
//         heartbeatInterval: 2000,
//         maxWaitTimeInMs: 500,        // FIXED: Was 1000ms, now 500ms
//         maxBytesPerPartition: 1024 * 1024 * 2,
//         maxBytes: 1024 * 1024 * 10,  // 10MB max
//         allowAutoTopicCreation: false,
//         partitionAssignmentStrategy: ['RoundRobinAssigner'],
//         retry: {
//             initialRetryTime: 100,
//             retries: 5
//         }
//     }),
    
//     // REMINDER consumers - Batch processing (2 instances) - FIXED CONFIG
//     reminder: createConsumerPool('reminder-processors', 2, {  // INCREASED from 1 to 2
//         sessionTimeout: 20000,       // REDUCED from 30000
//         heartbeatInterval: 3000,     // REDUCED from 5000
//         maxWaitTimeInMs: 1000,       // REDUCED from 5000ms to 1000ms
//         maxBytesPerPartition: 1024 * 1024 * 3,  // REDUCED batch size
//         maxBytes: 1024 * 1024 * 15,  // 15MB max
//         allowAutoTopicCreation: false,
//         partitionAssignmentStrategy: ['RoundRobinAssigner'],
//         retry: {
//             initialRetryTime: 100,
//             retries: 5
//         }
//     })
// };

// // Helper function to create consumer pool with optimized settings
// function createConsumerPool(groupId, count, config) {
//     const pool = [];
//     for (let i = 0; i < count; i++) {
//         pool.push(kafka.consumer({
//             groupId: `${groupId}`,
//             consumerId: `${groupId}-${i}-${Date.now()}`, // Unique consumer ID
//             ...config
//         }));
//     }
//     return pool;
// }

// // Topic mapping
// const PRIORITY_TOPICS = {
//     error: 'notifications-error',
//     warning: 'notifications-warning',
//     info: 'notifications-info', 
//     reminder: 'notifications-reminder'
// };

// // Start all consumer groups with parallel initialization
// export const startConsumer = async () => {
//     console.log('🚀 Starting all priority-based consumers...');
    
//     // Start all consumers in parallel for faster startup
//     const consumerPromises = [
//         startConsumerGroup('error', consumers.error, PRIORITY_TOPICS.error),
//         startConsumerGroup('warning', consumers.warning, PRIORITY_TOPICS.warning),
//         startConsumerGroup('info', consumers.info, PRIORITY_TOPICS.info),
//         startConsumerGroup('reminder', consumers.reminder, PRIORITY_TOPICS.reminder)
//     ];
    
//     await Promise.all(consumerPromises);
    
//     console.log('✅ All priority-based consumers started successfully');
    
//     // Log consumer status
//     logConsumerStatus();
// };

// // Enhanced consumer group startup with better error handling
// async function startConsumerGroup(priority, consumerPool, topic) {
//     const consumerPromises = consumerPool.map(async (consumer, index) => {
//         try {
//             await consumer.connect();
//             console.log(`🔌 ${priority.toUpperCase()} Consumer-${index} connected`);
            
//             await consumer.subscribe({ 
//                 topic: topic, 
//                 fromBeginning: false 
//             });
//             console.log(`📡 ${priority.toUpperCase()} Consumer-${index} subscribed to ${topic}`);
            
//             await consumer.run({
//                 // Process multiple messages concurrently per consumer
//                 partitionsConsumedConcurrently: 2, // NEW: Process 2 partitions at once
//                 eachBatchAutoResolve: true,        // NEW: Auto-resolve batches
//                 eachMessage: async ({ topic, partition, message }) => {
//                     const startTime = Date.now();
//                     let payload = null;
                    
//                     try {
//                         payload = JSON.parse(message.value.toString());
//                         console.log(`⚡ ${priority.toUpperCase()}-${index} processing: ${payload.sid}`);
                        
//                         // Process with priority-specific logic
//                         await processNotificationWithPriority(payload, priority);
                        
//                         const processingTime = Date.now() - startTime;
//                         console.log(`✅ ${priority.toUpperCase()}-${index} completed in ${processingTime}ms`);
                        
//                     } catch (err) {
//                         const processingTime = Date.now() - startTime;
//                         console.error(`❌ ${priority.toUpperCase()}-${index} error after ${processingTime}ms:`, err.message);
//                         await handleProcessingError(payload, err, priority);
//                     }
//                 }
//             });
            
//             console.log(`✅ ${priority.toUpperCase()} Consumer-${index} running`);
            
//         } catch (error) {
//             console.error(`❌ Failed to start ${priority.toUpperCase()} Consumer-${index}:`, error);
//             throw error;
//         }
//     });
    
//     await Promise.all(consumerPromises);
//     console.log(`🎯 Started ${consumerPool.length} ${priority.toUpperCase()} consumers on ${topic}`);
// }

// // Enhanced processing with better timeout handling
// async function processNotificationWithPriority(payload, priority) {
//     if (!payload.sid) {
//         console.error(`❌ Missing 'sid' in ${priority} payload`);
//         return;
//     }
    
//     const timeoutConfig = {
//         error: { db: 3000, processing: 8000 },      // Ultra fast
//         warning: { db: 4000, processing: 10000 },    // Fast
//         info: { db: 5000, processing: 12000 },       // Normal
//         reminder: { db: 6000, processing: 15000 }    // Batch
//     };
    
//     const timeouts = timeoutConfig[priority];
    
//     try {
//         const existingNotification = await withTimeout(
//             SentNotific.findBySID({ sid: payload.sid }),
//             timeouts.db,
//             `${priority} database query`
//         );
        
//         if (existingNotification && existingNotification.length > 0) {
//             const status = existingNotification[0].status;
            
//             if (status === 'sent' || status === 'delivered') {
//                 console.log(`⏭️  Skipping processed ${priority}: ${payload.sid}`);
//                 return;
//             }
            
//             if (status === 'failed' || status === 'queued') {
//                 console.log(`🔄 Retrying ${priority}: ${payload.sid}`);
//             }
            
//             await processNotificationByPriority(payload, priority, timeouts);
//         } else {
//             await createNotificationRecords(payload, priority, timeouts);
//         }
//     } catch (error) {
//         console.error(`💥 Error in ${priority} processing for ${payload.sid}:`, error.message);
        
//         try {
//             await withTimeout(
//                 SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }),
//                 timeouts.db,
//                 `${priority} database update failed status`
//             );
//         } catch (updateError) {
//             console.error(`💥 Failed to update failed status for ${payload.sid}:`, updateError.message);
//         }
        
//         throw error;
//     }
// }

// // Unified processing function with priority-specific timeouts
// async function processNotificationByPriority(payload, priority, timeouts) {
//     try {
//         console.log(`⚡ Processing ${priority.toUpperCase()}: ${payload.sid}`);
        
//         // Get user info with timeout
//         const user = await withTimeout(
//             UserModel.findUserById({user_id: payload.user_id}),
//             timeouts.db,
//             `${priority} user lookup`
//         );
        
//         if (payload.carrier === 'sms') {
//             payload.from = user.phone_number;
//             const twilioSid = await withTimeout(
//                 SMSservice({ payload }), 
//                 timeouts.processing, 
//                 `${priority} SMS service`
//             );
            
//             await withTimeout(
//                 updateNotificationStatus(payload.sid, 'sent', twilioSid),
//                 timeouts.db,
//                 `${priority} SMS status update`
//             );
            
//             console.log(`📱 ${priority.toUpperCase()} SMS sent: ${payload.sid}`);
//         } else {
//             payload.from = user.email;
//             const info = await withTimeout(
//                 EmailService(payload), 
//                 timeouts.processing, 
//                 `${priority} Email service`
//             );
            
//             await withTimeout(
//                 updateNotificationStatus(payload.sid, 'sent', info.messageId),
//                 timeouts.db,
//                 `${priority} Email status update`
//             );
            
//             console.log(`📧 ${priority.toUpperCase()} Email sent: ${payload.sid}`);
//         }
        
//     } catch (messageError) {
//         console.error(`💥 ${priority.toUpperCase()} processing failed for ${payload.sid}:`, messageError.message);
        
//         await withTimeout(
//             SentNotific.UpdateStatus({ sid: payload.sid, status: 'failed' }),
//             timeouts.db,
//             `${priority} failed status update`
//         );
        
//         throw messageError;
//     }
// }

// // Enhanced timeout function with better error messages
// async function withTimeout(promise, timeoutMs = 10000, operation = "operation") {
//     const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => reject(new Error(`⏱️  ${operation} timeout after ${timeoutMs}ms`)), timeoutMs);
//     });
    
//     return Promise.race([promise, timeoutPromise]);
// }

// async function updateNotificationStatus(sid, status, carriersid) {
//     await SentNotific.UpdateStatusAndId({
//         sid: sid,
//         status: status,
//         carriersid: carriersid,
//         read_at: null
//     });
// }

// async function createNotificationRecords(payload, priority, timeouts) {
//     try {
//         const typeRecord = await withTimeout(
//             NotificationTypeModel.findByTypeCarrier({
//                 type: payload.type,
//                 carrier: payload.carrier
//             }),
//             timeouts.db,
//             `${priority} type lookup`
//         );
        
//         if (!typeRecord || typeRecord.length === 0) {
//             throw new Error(`Notification type not found: ${payload.type}/${payload.carrier}`);
//         }
        
//         const type_id = typeRecord[0]?.type_id;
//         const notification_id = uuidv4();
        
//         await withTimeout(
//             NotificationModel.create({
//                 notification_id,
//                 type_id,
//                 message: payload.message,
//                 title: payload.title,
//             }),
//             timeouts.db,
//             `${priority} notification create`
//         );
        
//         await withTimeout(
//             SentNotific.create({
//                 sid: payload.sid,
//                 user_id: payload.user_id,
//                 notification_id,
//                 sent_at: payload.sent_at,
//                 sent_to: payload.sent_to,
//                 status: 'queued'
//             }),
//             timeouts.db,
//             `${priority} sent notification create`
//         );
        
//         console.log(`📝 ${priority.toUpperCase()} database records created for ${payload.sid}`);
//         await processNotificationByPriority(payload, priority, timeouts);
        
//     } catch (createError) {
//         if (createError.code === '23505' || createError.message.includes('duplicate key')) {
//             console.log(`⚠️  ${priority.toUpperCase()} record already exists for ${payload.sid}`);
//             return;
//         }
//         throw createError;
//     }
// }

// async function handleProcessingError(payload, error, priority) {
//     try {
//         if (payload && payload.sid) {
//             try {
//                 await withTimeout(
//                     SentNotific.UpdateStatus({
//                         sid: payload.sid,
//                         status: 'failed',
//                     }),
//                     5000,
//                     `${priority} error status update`
//                 );
//                 console.log(`💾 Updated ${priority} notification ${payload.sid} to failed`);
//             } catch (updateError) {
//                 console.error(`💥 Error updating failed status for ${payload.sid}:`, updateError);
//             }
//         }
        
//         console.error(`📊 ${priority.toUpperCase()} Error details:`, {
//             message: error.message,
//             code: error.code,
//             sid: payload?.sid,
//             priority: priority,
//             timestamp: new Date().toISOString()
//         });
        
//     } catch (handlerError) {
//         console.error(`💥 Error in ${priority} error handler:`, handlerError);
//     }
// }

// function logConsumerStatus() {
//     console.log('\n📈 CONSUMER STATUS:');
//     console.log('==================');
//     Object.entries(consumers).forEach(([priority, pool]) => {
//         console.log(`${priority.toUpperCase()}: ${pool.length} consumers`);
//     });
//     console.log('==================\n');
// }

// // Graceful shutdown with better logging
// process.on('SIGINT', async () => {
//     console.log('🛑 Shutting down all priority consumers...');
//     try {
//         const shutdownPromises = [];
        
//         for (const [priority, consumerPool] of Object.entries(consumers)) {
//             const poolShutdown = consumerPool.map(async (consumer, index) => {
//                 try {
//                     await consumer.disconnect();
//                     console.log(`✅ ${priority.toUpperCase()}-${index} disconnected`);
//                 } catch (error) {
//                     console.error(`❌ Error disconnecting ${priority.toUpperCase()}-${index}:`, error);
//                 }
//             });
//             shutdownPromises.push(...poolShutdown);
//         }
        
//         await Promise.all(shutdownPromises);
//         console.log('✅ All consumers disconnected successfully');
//     } catch (error) {
//         console.error('💥 Error during shutdown:', error);
//     }
//     process.exit(0);
// });
