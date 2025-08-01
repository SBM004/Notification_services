
import UserModel from '../models/user.model.js';

import {v4 as uuidv4} from 'uuid'; 
class UserController{
    
     async loginUser(req,res){
        const {email,password}=req.body;
        try{
          const result=await UserModel.findUserByEmail({email});
          if(result>0){
            isMatched=await bcrypt.compare(password,result.password)
            if(isMatched){
                const token=jwt.sign({userId:result.id,email:email},process.env.SECRET_KEY,{expiresIn:'1h'});
                res.status(200).json({message:'Login successful',token:token,user:result});
            }
            else{
                res.status(401).json({message:'Invalid password'});
            }
          }
          else{
            res.status(404).json({message:'User not found'});
          }

        }catch(err){
            console.log(err);
            res.status(500).json({message:'Internal server error'});
        }
        
        

    }
    
    async registerUser(req,res){
        const {email,password,role}=req.body;
        try{
            const hashedPassword=await bcyrpt.hash(password,10);
            const userId=uuidv4();
            const result=await UserModel.create({'id':userId,'email':email,'password':hashedPassword,'role':role});
            res.status(201).json({message:'User registered successfully', user: result.rows[0]});
        }
        catch(err){
            console.log(err);
            res.status(500).json({message:'Internal server error'});
        }
    }
}  