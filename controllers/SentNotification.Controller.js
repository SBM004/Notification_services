
import SentNotific from '../models/user.model.js';
import NotificationController from '../controllers/notification.js';
import NotificationModel from '../models/notification.model.js';
import NotificationTypeModel from '../models/notification_type.model.js';

import {v4 as uuidv4} from 'uuid'; 

class SentController{
    
    async createSentNotification(req,res){
        const {message,type,carrier,to}=req.body;
        const token=req.cookie.token;
        const typee=NotificationTypeModel.findByTypeCarrier({type,carrier});
        const type_id=typee.type_id;
        const notification_id=uuidv4();
        const notification=NotificationModel.create({notification_id,type_id,message,title});
        const sid=uuidv4();
        const result=SentNotific.create({sid,})
    }

    
}  