// src/routes/emailServiceHandler.js
import express from 'express';
import SentNotific from '../models/sentnotification.model.js';

const emailWebhookRouter = express.Router();

// SendGrid Event Webhook
emailWebhookRouter.post('/email-status', async (req, res) => {
  try {
    const events = req.body; // Array of event objects

    for (const event of events) {
    
       const sg_message_id=event.sg_message_id
       const email=event.email
       const event=event.event
       const timestamp=event.timestamp
       const smtp_id=event.smtp_id
       const reason=event.reason
      console.log('SendGrid webhook event:', event);

      // Find using carrierSID or email or any custom arg you passed in message
      const notification = await SentNotific.findByCarrierSID({ carrierSID: sg_message_id });

      if (notification) {
        // Map SendGrid event to internal status
        let status = 'sent';
        if (event === 'delivered') status = 'delivered';
        else if (event === 'bounce' || event === 'dropped') status = 'failed';
        else if (event === 'open') status = 'opened';

        await SentNotific.UpdateStatus({
          sid: notification.sid,
          status: status,
          carrier_status: sg_message_id,
          carrier:'email',
          is_read: event==='open'?new Date(timestamp * 1000).toISOString() : null
        });

        console.log(`Email status updated for ${notification.sid}`);
      } else {
        console.warn(`Email notification not found for smtp_id: ${smtp_id}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

export default emailWebhookRouter;
