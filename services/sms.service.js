// import twilio from 'twilio'
// import NotificationTypeModel from '../models/notification_type.model.js';
// import SentNotific from '../models/sentnotification.model.js';
// import {HttpException} from '../utils/HttpException.utils.js';
// import NotificationModel from '../models/notification.models.js';
// import dotenv from 'dotenv';
// dotenv.config(); //  Load environment variables

// import {v4 as uuidv4} from 'uuid'; 
// export const SMSservice=async ({payload}) => {
// //   const { phone, message } = req.body;
  
//   try {
//     //  const message=req.body.message;
//     //         const type=req.body.type;
//     //         const title=req.body.title;
//     //         const carrier=req.body.carrier;
//     //         const sent_to=req.body.to;
//     //          const user_id=req.currentUser.user_id;
//     //        // const token=req.cookie.token;
//     //        console.log("user_id:"+user_id)
//     //        const sent_at= new Date().toISOString();
//     //        const typee=await NotificationTypeModel.findByTypeCarrier({type,carrier});
//     //        const type_id=typee[0].type_id;
//     //        console.log("typeid:"+type_id);
//     //     //    const notification_id=uuidv4();


//            // Send SMS with webhook URL
//            if (!payload.message || !payload.sent_to) {
//                 throw new HttpException(400, "Missing message or sent_to in payload");
//             }
             
//            const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
//             console.log("hii")
//             const twilioMessage = await twilioClient.messages.create({
//             body: payload.message,
//             from: process.env.TWILIO_NUMBER,
//             to: payload.sent_to,
//             statusCallback: `${process.env.APP_URL}/webhooks/sms-status` // Your webhook
//             });
           
//             console.log(twilioMessage.sid)
//             return twilioMessage.sid;
    
//   } catch (error) {
//     // res.status(500).json({ error: error.message });
// // return error;
//     throw new HttpException(500,error.message);
    
//   }
// };





//3rd code
import twilio from 'twilio';
import NotificationTypeModel from '../models/notification_type.model.js';
import SentNotific from '../models/sentnotification.model.js';
import {HttpException} from '../utils/HttpException.utils.js';
import NotificationModel from '../models/notification.models.js';
import dotenv from 'dotenv';
dotenv.config();

import {v4 as uuidv4} from 'uuid'; 

export const SMSservice = async ({payload}) => {
    try {
        // Validate payload
        if (!payload.message || !payload.sent_to) {
            throw new HttpException(400, "Missing message or sent_to in payload");
        }
        
        // Validate environment variables
        if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_NUMBER) {
            throw new HttpException(500, "Missing Twilio configuration");
        }
        
        console.log("Sending SMS to:", payload.sent_to);
        console.log("Message:", payload.message);
        
        const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const twilioMessage = await twilioClient.messages.create({
            body: payload.message,
            from: process.env.TWILIO_NUMBER,
            to: payload.sent_to,
           
           //cannot add statusCallback because using local server once it is deployed webhook can be deployed
            // statusCallback: `${process.env.APP_URL}/webhooks/sms-status`
        });
        
        console.log(" SMS sent successfully, SID:", twilioMessage.sid);
        return twilioMessage.sid;
        
    } catch (error) {
        // console.error(" SMS Service Error:", error);
        
        // Check if it's a Twilio-specific error
        if (error.code) {
            console.error("Twilio Error Code:", error.code);
            console.error("Twilio Error Message:", error.message);
            throw new HttpException(400, `Twilio Error: ${error.message}`);
        }
        
        // Re-throw HttpExceptions as-is
        if (error instanceof HttpException) {
            throw error;
        }
        
        // Generic error
        throw new HttpException(500, `SMS sending failed: ${error.message}`);
    }
};





//1st code
// import { sendToKafkaQueue } from '../kafka/producer.js';

// export const SMSservice = async (req, res) => {
//   try {
//     const message = req.body.message;
//     const type = req.body.type;
//     const title = req.body.title;
//     const carrier = req.body.carrier;
//     const sent_to = req.body.to;
//     const user_id = req.currentUser.user_id;

//     const payload = {
//       message,
//       type,
//       title,
//       carrier,
//       sent_to,
//       user_id,
//     };

//     await sendToKafkaQueue('twilio-sms-topic', payload);

//     res.status(200).json({ message: "SMS request queued successfully", success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

