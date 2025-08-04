
import SentNotific from '../models/sentnotification.model.js';
// import NotificationController from '../controllers/notification.js';
import NotificationModel from '../models/notification.models.js';
import NotificationTypeModel from '../models/notification_type.model.js';
import {HttpException} from '../utils/HttpException.utils.js';

import {v4 as uuidv4} from 'uuid'; 

class SentController{
    
    async createSentNotification(req,res){
        // const {message,type,carrier,to}=req.body;
        try{

            const message=req.body.message;
            const type=req.body.type;
            const title=req.body.title;
            const carrier=req.body.carrier;
            const sent_to=req.body.to;
             const user_id=req.currentUser.user_id;
           // const token=req.cookie.token;
           console.log("user_id:"+user_id)
           const sent_at= new Date().toISOString();
           const typee=await NotificationTypeModel.findByTypeCarrier({type,carrier});
           const type_id=typee[0].type_id;
           console.log("typeid:"+type_id);
           const notification_id=uuidv4();

           const notification=await NotificationModel.create({notification_id,type_id,message,title});
           const sid=uuidv4();
           const result=await SentNotific.create({sid,user_id,notification_id,sent_at,sent_to});
           res.status(200).json({message:"the notification is sent "});
        }
        catch(err){
            console.log(err)
            throw new HttpException(500,err);
        }

    }


    async DeleteSentNotification(req,res){
       
        try{
             const sid=req.params.sid;
             const result=SentNotific.findBySID({sid});
             if(result.length>0){
                const id=result.notification_id
                const result2=NotificationModel.deleteById({id});
                const result3=SentNotific.deleteById({sid});
             }

        }
        catch(err){
            throw new HttpException(500,err);
        }
    }

    
}  


export default new SentController();