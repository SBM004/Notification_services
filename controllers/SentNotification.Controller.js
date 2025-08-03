
import SentNotific from '../models/user.model.js';
import NotificationController from '../controllers/notification.js';
import NotifictionModel from '../models.notification.model.js';
import {v4 as uuidv4} from 'uuid'; 

class UserController{
    
    async createSentNotification(req,res){
        const {message,type,carrier,to}=req.body;
        const typee=NotificationTypeModel.findByTypeCarrier({});
        const type_id=typee.type_id;
        const notification_id=uuidv4();
        const notification=NotificationModel.create({notification_id,type_id,message,title});





    }
    
}  