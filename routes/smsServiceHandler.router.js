import express from 'express';
import SentNotific from '../models/sentnotification.model.js';

const webhookRouter = express.Router();

// Twilio SMS Status Webhook
webhookRouter.post('/sms-status', async (req, res) => {
    try {
        const {
            MessageSid,
            MessageStatus,
            ErrorCode,
            ErrorMessage
        } = req.body;

        console.log('Twilio webhook received:', {
            MessageSid,
            MessageStatus,
            ErrorCode,
            ErrorMessage
        });

        // Find the notification by Twilio SID (carrierSID)
        const notification = await SentNotific.findByCarrierSID({ carrierSID: MessageSid });
        
        if (notification) {
            // Map Twilio status to our status
            let status = MessageStatus;
            if (MessageStatus === 'delivered') {
                status = 'delivered';
            } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
                status = 'failed';
            } else if (MessageStatus === 'sent') {
                status = 'sent';
            }

            // Update the notification status
            await SentNotific.UpdateStatus({
                sid: notification.sid,
                status: status,
                twilio_status: MessageStatus,
                error_code: ErrorCode,
                error_message: ErrorMessage,
                updated_at: new Date().toISOString()
            });

            console.log(`Updated notification ${notification.sid} to status: ${status}`);
        } else {
            console.warn(`Notification not found for Twilio SID: ${MessageSid}`);
        }

        // Respond to Twilio
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});

export default webhookRouter;