import NotificationTypeModel from '../models/notification_type.model.js'
import {v4 as uuidv4} from 'uuid';

class NotificationTypeController {

    async createType(req,res){
        var {type, carrier}=req.body;
        type=type.toLowerCase();
        carrier= carrier.toLowerCase();
        const type_id=uuidv4();

        if(!type || !type_id || !carrier) {
            return res.status(400).json({message: 'fields not specified'});
        }

    try{
        const result1=await NotificationTypeModel.findByTypeCarrier({type,carrier});
            if(result1.length>0){
                return res.status(200).json({message:"already saved"});
            }

        const result=await NotificationTypeModel.create({type_id,type,carrier});
        res.status(201).json({message:'Notification Type added successfully', data: result[0]});

    } catch(err){
        console.error(err);
        res.status(500).json({message:'Internal server error'});
    }
    }

    async findType(req,res){
        try{
            const {type,carrier}=req.body;
            const result=await NotificationTypeModel.findByTypeCarrier({type,carrier});

            if(result.length>0){   
                res.status(200).json({data: result});
            } else{
                res.status(200).json({message: 'Notification types not found.'});
            }

        } catch(err){
            console.error(err);
            res.status(500).json({message:'Internal server error'});
        }

    }



  async find(req,res){
        // const {type,carrier}=req.body;
        // const type_id=uuidv4();
        try{
            const result=await NotificationTypeModel.find();
            console.log(result);
            res.status(200).json({data:result});

        }
        catch(err){
            console.error(err);
            res.status(500).json({message:'Internal server error'});
        }
}
}
export default new NotificationTypeController();