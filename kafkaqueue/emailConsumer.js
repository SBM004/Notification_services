// src/kafkaqueue/emailConsumer.js

import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

import { EmailService } from '../services/email.service.js';
import NotificationModel from '../models/notification.models.js';
import SentNotific from '../models/sentnotification.model.js';
import NotificationTypeModel from '../models/notification_type.model.js';
import { v4 as uuidv4 } from 'uuid';

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER] // e.g., 'kafka:9092' or 'localhost:9092'
});

const emailConsumer = kafka.consumer({ groupId: 'sendgrid-email-group' });

export const startEmailConsumer = async () => {
    await emailConsumer.connect();
    await emailConsumer.subscribe({ topic: 'sendgrid-email-notifications', fromBeginning: false });

    await emailConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            let payload = null;

            try {
                payload = JSON.parse(message.value.toString());
                console.log("Received email payload from Kafka:", JSON.stringify(payload, null, 2));

                if (!payload.sid) {
                    console.error("Missing 'sid' in payload");
                    return;
                }

                const existing = await SentNotific.findBySID({ sid: payload.sid });

                if (existing && existing.length > 0) {
                    const status = existing[0].status;
                    console.log(`Email Notification ${payload.sid} already has status: ${status}`);

                    if (status === 'sent' || status === 'delivered') return;
                    if (status === 'failed' || status === 'queued') {
                        console.log(`Retrying failed/queued email: ${payload.sid}`);
                    }

                    await processEmailNotification(payload);
                } else {
                    await createEmailNotificationRecords(payload);
                }

            } catch (err) {
                console.error("Error processing email message:", err);
                await handleEmailProcessingError(payload, err);
            }
        },
    });
};

async function createEmailNotificationRecords(payload) {
    try {
        const typeRecord = await NotificationTypeModel.findByTypeCarrier({
            type: payload.type,
            carrier: payload.carrier,
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
            status: 'queued',
        });

        await processEmailNotification(payload);
        console.log("Email DB records created successfully");

    } catch (err) {
        if (err.code === '23505' || err.message.includes('duplicate key')) {
            console.log("Email record already exists, skipping DB insert");
            return;
        }
        throw err;
    }
}

async function processEmailNotification(payload) {
    try {
        console.log("Sending email via SendGrid...");
        await EmailService({
            to: payload.sent_to,
            subject: payload.subject || payload.title,
            text: payload.message,
            html: payload.html || `<p>${payload.message}</p>`,
        });

        await SentNotific.UpdateStatusAndId({
            sid: payload.sid,
            status: 'sent',
        });

        console.log(`Email sent successfully. SID: ${payload.sid}`);
    } catch (emailError) {
        console.error("Failed to send email:", emailError);

        await SentNotific.UpdateStatus({
            sid: payload.sid,
            status: 'failed',
        });

        throw emailError;
    }
}

async function handleEmailProcessingError(payload, error) {
    try {
        if (payload?.sid) {
            await SentNotific.UpdateStatus({
                sid: payload.sid,
                status: 'failed',
            });
            console.log(`Updated email notification ${payload.sid} status to 'failed'`);
        }

        console.error("Email Error Details:", {
            message: error.message,
            code: error.code,
            sid: payload?.sid,
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        console.error("Error while handling email error:", err);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down Kafka email consumer...');
    try {
        await emailConsumer.disconnect();
        console.log(' Kafka email consumer disconnected');
    } catch (error) {
        console.error('Error disconnecting email consumer:', error);
    }
    process.exit(0);
});
