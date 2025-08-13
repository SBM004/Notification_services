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


webhookRouter.post('/email-status', async (req, res) => {
  try {
    const events = req.body; // Array of event objects
    console.log("webhook of email",events);
    for (const eventt of events) {
        const sg_message_id=eventt.sg_message_id
        const email=eventt.email
        const event=eventt.event
        const timestamp=eventt.timestamp
        const smtp_id=eventt["smtp-id"]
        const reason=eventt.reason
        console.log('SendGrid webhook event outer check: ', eventt);
        if(event==='delivered'||event==='bounces'){

            
           console.log('SendGrid webhook event:', eventt);
     
           // Find using carrierSID or email or any custom arg you passed in message
           const notification = await SentNotific.findByCarrierSID({ carrierSID: smtp_id });
     
           if (notification) {
             // Map SendGrid event to internal status
             let status = 'sent';
             if (event === 'delivered') status = 'delivered';
             else if (event === 'bounce' || event === 'dropped') status = 'failed';
             else if (event === 'open') status = 'opened';
     
             await SentNotific.UpdateStatusAndId({
               sid: notification.sid,
               status: status,
               carriersid: smtp_id,
               read_at: null,
               message_id:sg_message_id
             });
     
             console.log(`Email status updated for ${notification.sid}`);
           } else {
             console.warn(`Email notification not found for smtp_id: ${smtp_id}`);
           }
        }
        else if(event==='open'){
             console.log('SendGrid webhook event:', eventt);
     
           // Find using carrierSID or email or any custom arg you passed in message
           const notification = await SentNotific.findByMessageId({ message_id: sg_message_id });
     
           if (notification) {
             // Map SendGrid event to internal status
             let status = 'sent';
             if (event === 'delivered') status = 'delivered';
             else if (event === 'bounce' || event === 'dropped') status = 'failed';
             else if (event === 'open') status = 'opened';
     
             await SentNotific.UpdateStatus({
                message_id:sg_message_id,
                status: status,
               read_at: event==='open'?new Date(timestamp * 1000).toISOString() : null,
               is_read:true
              
             });
     
             console.log(`Email status updated for ${notification.sid}`);
           } else {
             console.warn(`Email notification not found for smtp_id: ${smtp_id}`);
           }
        }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

export default webhookRouter;