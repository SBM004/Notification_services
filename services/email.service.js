import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

import { HttpException } from '../utils/HttpException.utils.js';

// Initialize SendGrid API key
if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not found in environment');
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const EmailService = async ( payload ) => {
    try {
        // Validate payload
        if (!payload.message || !payload.subject || !payload.sent_to) {
            throw new HttpException(400, "Missing subject, message, or sent_to in payload");
        }

        // Validate sender email
        if (!process.env.FROM_EMAIL) {
            throw new HttpException(500, "Missing FROM_EMAIL configuration");
        }

        const msg = {
            to: payload.sent_to,                // Receiver
            from: process.env.FROM_EMAIL,       // Verified Sender
            subject: payload.subject,
            text: payload.message
        };

        console.log("Sending Email to:", payload.sent_to);

        const response = await sgMail.send(msg);

        console.log("Email sent successfully. Response code:", response[0].statusCode);

        return response[0].headers['x-message-id'] || 'SendGrid-Email-Sent';

    } catch (error) {
        if (error.response) {
            console.error("SendGrid Error Response:", error.response.body);
            throw new HttpException(400, `SendGrid Error: ${error.response.body.errors[0].message}`);
        }

        if (error instanceof HttpException) {
            throw error;
        }

        throw new HttpException(500, `Email sending failed: ${error.message}`);
    }
};
