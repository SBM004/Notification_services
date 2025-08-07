


//3rd code
import SentNotific from '../models/sentnotification.model.js';
import {HttpException} from '../utils/HttpException.utils.js';
import { sendToKafka } from '../kafkaqueue/producer.js';
import {v4 as uuidv4} from 'uuid'


class SentController{
    
  

    async createSentNotification(req, res) {
    const body = req.body;
    try {
        const carrier = req.body.carrier.toLowerCase();
        
        if (carrier === 'sms' || carrier==='email') {
            console.log("sent_controller");
            
            // Check if it's bulk sending (array of recipients)
            if (Array.isArray(body.to)) {
                // Handle multiple users
                const results = [];
                const errors = [];
                
                for (const recipient of body.to) {
                    const sid = uuidv4();
                    const payload = {
                        sent_to: recipient, // Individual phone number
                        message: req.body.message,
                        title: req.body.title,
                        type: req.body.type,
                        carrier,
                        user_id: req.currentUser.user_id,
                        sent_at: new Date().toISOString(),
                        sid: sid
                    };
                    
                    try {
                        await sendToKafka(payload);
                        results.push({
                            recipient: recipient,
                            sid: sid,
                            status: "queued",
                            success: true
                        });
                    } catch (kafkaError) {
                        console.error(`Kafka error for ${recipient}:`, kafkaError);
                        errors.push({
                            recipient: recipient,
                            error: kafkaError.message,
                            success: false
                        });
                    }
                }
                
                // Return bulk response
                res.status(200).json({
                    message: `Bulk notifications processed: ${results.length} queued, ${errors.length} failed`,
                    success: errors.length === 0, // Only true if all succeeded
                    total_sent: results.length,
                    total_failed: errors.length,
                    results: results,
                    errors: errors
                });
                
            } else {
                // Handle single user (your existing code)
                const sid = uuidv4();
                const payload = {
                    sent_to: req.body.to,
                    message: req.body.message,
                    title: req.body.title,
                    type: req.body.type,
                    carrier,
                    user_id: req.currentUser.user_id,
                    sent_at: new Date().toISOString(),
                    sid: sid
                };
                
                try {
                    await sendToKafka(payload);
                    res.status(200).json({
                        message: "Notification queued successfully",
                        success: true,
                        sid: sid,
                        status: "queued"
                    });
                } catch (kafkaError) {
                    console.error("Kafka error:", kafkaError);
                    res.status(500).json({
                        message: "Failed to queue notification",
                        success: false,
                        error: kafkaError.message
                    });
                }
            }
           
            
        } else {
            throw new HttpException(400, "Unsupported carrier");
        }
        
    } catch(err) {
        console.log(err);
        if (!res.headersSent) {
            res.status(err.status || 500).json({
                message: err.message || "Internal server error",
                success: false
            });
        }
    }
}

     async getNotificationStatus(req, res) {
        try {
            const { sid } = req.params;
            
            if (!sid) {
                throw new HttpException(400, "SID is required");
            }
            
            const result = await SentNotific.findBySID({ sid });
            
            if (!result) {
                throw new HttpException(404, "Notification not found");
            }
            
            res.status(200).json({
                message: "Status retrieved successfully",
                success: true,
                data: result
            });
            
        } catch (err) {
            console.error("Error getting notification status:", err);
            res.status(err.status || 500).json({
                message: err.message || "Internal server error",
                success: false
            });
        }
    }



    // ... rest of your methods
}

export default new SentController();















//1st code
// // controllers/sent.controller.js
// import { sendToKafka } from '../kafka/producer.js';
// import { HttpException } from '../utils/HttpException.utils.js';

// class SentController {
//   async createSentNotification(req, res) {
//     try {
//       const carrier = req.body.carrier.toLowerCase();
//       if (carrier === 'sms') {
//         const payload = {
//           to: req.body.to,
//           message: req.body.message,
//           title: req.body.title,
//           type: req.body.type,
//           carrier,
//           user_id: req.currentUser.user_id,
//           sent_at: new Date().toISOString()
//         };

//         await sendToKafka(payload);

//         res.status(200).json({
//           message: "Notification queued successfully",
//           success: true
//         });
//       } else {
//         throw new HttpException(400, "Unsupported carrier");
//       }
//     } catch (err) {
//       console.error(err);
//       throw new HttpException(500, err.message);
//     }
//   }
// }

// export default new SentController();
