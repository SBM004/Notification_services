//2nd code
// import SentNotific from '../models/sentnotification.model.js';
// import {HttpException} from '../utils/HttpException.utils.js';
// // import NotificationController from '../controllers/notification.js';
// // import NotificationModel from '../models/notification.models.js';
// import { sendToKafka } from '../kafkaqueue/producer.js';
// // import {SMSservice} from '../service/sms.service.js';

// class SentController{
    
//     async createSentNotification(req,res){
//         // const {message,type,carrier,to}=req.body;
//         try{
//             const carrier=req.body.carrier.toLowerCase();
//            if (carrier === 'sms') {
//             console.log("sent_controller")
//         const payload = {
//           sent_to: req.body.to,
//           message: req.body.message,
//           title: req.body.title,
//           type: req.body.type,
//           carrier,
//           user_id: req.currentUser.user_id,
//           sent_at: new Date().toISOString()
//         };
//         try{

//             await sendToKafka(payload);
//         }catch(err){
//             res.status(500).json({message:"cannot send",success:false})
//         }

//         res.status(200).json({
//           message: "Notification queued successfully",
//           success: true
//         });
//       } else {
//         throw new HttpException(400, "Unsupported carrier");
//       }
//     } 
//         catch(err){
//             console.log(err)
//             throw new HttpException(500,"err");
//         }

//     }


//     async DeleteSentNotification(req,res){
       
//         try{
//              const sid=req.params.sid;
//              const result=SentNotific.findBySID({sid});
//              if(result.length>0){
//                 const id=result.notification_id
//                 const result2=NotificationModel.deleteById({id});
//                 const result3=SentNotific.deleteById({sid});
//              }

//         }
//         catch(err){
//             throw new HttpException(500,err);
//         }
//     }

//     async find(req,res){
       
//         try{
//              const user_id=req.currentUser.user_id;
//              const result=await SentNotific.findByUserId({user_id});
//              if(result.length>0){
//                 res.status(200).json({message:"success",result:result});
//              }
//              else{
//                  res.status(200).json({message:"no notification found "});
//                 // throw new HttpException(500,"internal error");
//              }


//         }
//         catch(err){
//             throw new HttpException(500,err);
//         }
//     }



    
// }  

//  export default new SentController();



//3rd code
import SentNotific from '../models/sentnotification.model.js';
import {HttpException} from '../utils/HttpException.utils.js';
import { sendToKafka } from '../kafkaqueue/producer.js';
import {v4 as uuidv4} from 'uuid'

class SentController{
    
    async createSentNotification(req,res){
        try{
            const carrier = req.body.carrier.toLowerCase();
            
            if (carrier === 'sms') {
                console.log("sent_controller");
                const sid=uuidv4();
                const payload = {
                    sent_to: req.body.to,
                    message: req.body.message,
                    title: req.body.title,
                    type: req.body.type,
                    carrier,
                    user_id: req.currentUser.user_id,
                    sent_at: new Date().toISOString(),
                    sid:sid
                };
                
                try {
                    // Send to Kafka
                    await sendToKafka(payload);
                    
                    // // Only respond with success if Kafka send was successful
                    // const result=SentNotific.findBySID({sid});
                    // if(result.status=='failed'){
                    //     res.status(500).json({
                    //      message:"notification not sent",
                    //      success:false
                    // });
                    // }
                    // else if(result.status==='sent'){
                    //      res.status(200).json({
                    //      message:"notification not sent",
                    //      success:true})
                    // }

                    // res.status(200).json({
                    //     // SentNotific
                    // });
                     res.status(200).json({
                        message: "Notification queued successfully",
                        success: true,
                        sid: sid,
                        status: "queued"
                    });
                } catch (kafkaError) {
                    console.error("Kafka error:", kafkaError);
                    // Return error if Kafka fails
                    res.status(500).json({
                        message: "Failed to queue notification",
                        success: false,
                        error: kafkaError.message
                    });
                }
               
                
            } else {
                throw new HttpException(400, "Unsupported carrier");
            }
            
        } catch(err) {
            console.log(err);
            // Make sure we haven't already sent a response
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
