
import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid'; 
class UserController{
    
     async loginUser(req,res){
        const {email,password}=req.body;
        try{
          const result=await UserModel.findUserByEmail({email});
        //   console.log("in loginUser")
          if(result.length>0){
            const isMatched=await bcrypt.compare(password,result[0].password)
            if(isMatched){
                const token=jwt.sign({"userId":result.id,"email":email},process.env.SECRET_KEY,{expiresIn:'1h'});
                res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 3600000
                });
                res.status(200).json({message:'Login successful',user:result});
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
    
     registerUser=async(req,res)=>{
        const {name,email,password,role}=req.body;
        try{
            
            const hashedPassword=await bcrypt.hash(password,10);
            console.log(hashedPassword);
            const userId=uuidv4();
            const result1=await UserModel.findUserByEmail({email});
            if(result1.length>0){
                res.status(300).json({message:'The email alreaddy used'});
            }else{

                const result=await UserModel.create({'userId':userId,'name':name,'email':email,'role':role,'password':hashedPassword});
                
                res.status(201).json({message:'User registered successfully', user: result.rows[0]});
                console.log('in user controller');
            }
        }
        catch(err){
            console.log(err);
            res.status(500).json({message:err});
        }
    }

    async find(req,res){
        try{
            const result=await UserModel.find();
            console.log(result);
            if(result.length >0){
                
                const userDetail=result.map((item,index)=>{
                    return( {
                        "user_id":item.user_id,
                        "name":item.name,
                        "email":item.email,
                        "role":item.role
                    })
                })
                return res.status(200).json({"userDetail":userDetail});
            }
            else{
                 res.status(200).send({message:"no users registered"});
            }
        }
        catch(err){
            res.status(505).send({message:err});
        }
    }

    
    
}  

export default new UserController();