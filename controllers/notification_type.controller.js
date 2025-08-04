import NotificationTypeModel from '../models/notification_type.model.js';
import {v4 as uuidv4} from 'uuid';
// All done
class NotificationTypeController{
    async createType(req,res){
        var {type,carrier}=req.body;
        type=await type.toLowerCase();
        carrier=await carrier.toLowerCase();
        const type_id=uuidv4();
        try{
            const result1=await NotificationTypeModel.findByTypeCarrier({type,carrier});
            if(result1.length>0){
                res.status(200).json({message:"already saved"});
            }
            const result=await NotificationTypeModel.create({type_id,type,carrier});
            console.log(result);
            res.status(200).json({message:"successfully added"});

        }
        catch(err){
            res.status(500).send("error").json({message:err});
        }
    }

    async findType(req,res){
        const {type,carrier}=req.body;
        const type_id=uuidv4();
        try{
            const result=await NotificationTypeModel.findByTypeCarrier({type,carrier});
            console.log(result);
            res.status(200).json({result:result});

        }
        catch(err){
            res.status(500).send("error").json({message:err});
        }
    }

    async find(req,res){
        // const {type,carrier}=req.body;
        // const type_id=uuidv4();
        try{
            const result=await NotificationTypeModel.find();
            console.log(result);
            res.status(200).json({result:result});

        }
        catch(err){
            res.status(500).send("error").json({message:err});
        }
    }
}

export default new NotificationTypeController();