import transporter from '../services/emailTransporter.js'
import dotenv from 'dotenv';
dotenv.config();

import { HttpException } from '../utils/HttpException.utils.js';

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

         const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: payload.sent_to,
            subject: payload.message,
            // html: '<h1>Hello World!</h1>'
            });

        console.log("Sending Email to:", info.rejected>0?'failed':'sent');
            return info;
        

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


