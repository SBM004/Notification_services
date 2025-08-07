import transporter from '../services/emailTransporter.js'
import dotenv from 'dotenv';
dotenv.config();
//implemented using nodemailer so that different third party can be used with this template
import { HttpException } from '../utils/HttpException.utils.js';
import SentNotific from '../models/sentnotification.model.js'

//This email goes in spam as domain is not verified

export const EmailService = async ( payload ) => {
    try {
        // Validate payload
        //here title is subject
        if (!payload.message || !payload.title || !payload.sent_to) {
            throw new HttpException(400, "Missing subject, message, or sent_to in payload");
        }

        // Validate sender email
        if (!process.env.FROM_EMAIL) {
            throw new HttpException(500, "Missing FROM_EMAIL configuration");
        }

         const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: payload.sent_to,
            subject:payload.type,
            text: payload.message,
            //  html: '<h1>Hello World!</h1>'
            });

        console.log("Sending Email to:", info.rejected>0?'failed':'sent');
            return info;
        

    } catch (error) {
        if (error) {
            console.error("SendGrid Error Response:", error.response);
            throw new HttpException(400, `SendGrid Error: ${error.response}`);
        }

        if (error instanceof HttpException) {
            throw error;
        }

        throw new HttpException(500, `Email sending failed: ${error.response}`);
    }
};


