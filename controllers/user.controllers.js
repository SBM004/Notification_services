
// import UserModel from '../models/user.model.js';
// import bcrypt from 'bcrypt'
// import jwt from 'jsonwebtoken';
// import {v4 as uuidv4} from 'uuid'; 
// import {validationResult} from 'express-validator'
// import {multipleColumnSet} from '../utils/common.utils.js';
// import {HttpException} from '../utils/HttpException.utils.js';
// class UserController{
    
//      async loginUser(req,res){
//         this.checkValidation(req);
//         const {email,password}=req.body;
//         try{
//           const result=await UserModel.findUserByEmail({email});
//         //   console.log("in loginUser")
//           if(result.length>0){
//             const isMatched=await bcrypt.compare(password,result[0].password)
//             if(isMatched){
//                 const id=result[0].user_id
//                 const token=jwt.sign({"user_id":id,"email":email},process.env.SECRET_KEY,{expiresIn:'1h'});
//                 res.cookie('token', token, {
//                 httpOnly: true,
//                 secure: true,
//                 sameSite: 'Strict',
//                 maxAge: 3600000
//                 });
//                 res.status(200).json({message:'Login successful',user:result});
//             }
//             else{
//                 res.status(401).json({message:'Invalid password'});
//             }
//           }
//           else{
//             res.status(404).json({message:'User not found'});
//           }

//         }catch(err){
//             console.log(err);
//             res.status(500).json({message:'Internal server error'});
//         }
        
        

//     }
    
//      registerUser=async(req,res)=>{
//         // this.checkValidation(req);
//         const {name,email,role,password,confirmPassword}=req.body;

//         try{
            
//             const hashedPassword=await bcrypt.hash(password,10);
//             console.log(hashedPassword);
//             const userId=uuidv4();
//             const result1=await UserModel.findUserByEmail({email});
//             if(result1.length>0){
//                 res.status(300).json({message:'The email alreaddy used'});
//             }else{

//                 const result=await UserModel.create({'userId':userId,'name':name,'email':email,'role':role,'password':hashedPassword});
                
//                 res.status(201).json({message:'User registered successfully', user: result.rows[0]});
//                 console.log('in user controller');
//             }
//         }
//         catch(err){
//             console.log(err);
//             res.status(500).json({message:err});
//         }
//     }

//     async find(req,res){
//         try{
//             const result=await UserModel.find();
//             console.log(result);
//             if(result.length >0){
                
//                 const userDetail=result.map((item,index)=>{
//                     return( {
//                         "user_id":item.user_id,
//                         "name":item.name,
//                         "email":item.email,
//                         "role":item.role
//                     })
//                 })
//                 return res.status(200).json({"userDetail":userDetail});
//             }
//             else{
//                  res.status(200).send({message:"no users registered"});
//             }
//         }
//         catch(err){
//             res.status(505).send({message:err});
//         }
//     }

//     async updateUser(req,res){
//         this.checkValidation(req);
//         //here we are using uuid as userId so won't  be able to gind user by using userID 
//         //using email to find the user
//         // const email=req.email;
//         try{
//                  const result=await UserModel.findUserByEmail({'email':request.email})
//                  if(result.length>0){
//                     const {...columns}=req.body;
//                     const result1=await UserModel.update(columns,req.params.id);
                            
//                     if (!result1) {
//                         throw new HttpException(404, 'Something went wrong');
//                     }

//                     const { affectedRows, changedRows, info } = result1;

//                     const message = !affectedRows ? 'User not found' :
//                     affectedRows && changedRows ? 'User updated successfully' : 'Updated faild';

//                     res.send({ message, info });
//                 }
//                 res.status(200).json({message:'user not found'});

//         }catch(err){
//             throw new HttpException(404, 'something went wrong faild', err);
//         }
       
//     }

//     checkValidation=(req)=>{
//         const error=validationResult(req);
//         if(!error.isEmpty()){
//              throw new HttpException(400, 'Validation faild', error);
//         }
//     }

    
    
// }  

// export default new UserController();


import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid'; 
import {validationResult} from 'express-validator'
import {multipleColumnSet} from '../utils/common.utils.js';
import {HttpException} from '../utils/HttpException.utils.js';
import isEqual from 'lodash.isequal';
class UserController{
    
    //  Changed to arrow function
    loginUser = async (req,res) => {
        this.checkValidation(req);
        const {email,password}=req.body;
        try{
          const result=await UserModel.findUserByEmail({email});
          console.log("in loginUser")
          if(result){
            const isMatched=await bcrypt.compare(password,result.password)
            if(isMatched){
                const id=result.user_id
                const token=jwt.sign({"user_id":id,"email":email},process.env.SECRET_KEY,{expiresIn:'1h'});
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
    
    registerUser = async (req,res) => {
        this.checkValidation(req); // Now you can use validation here too
        const name=req.body.name;
        const email=req.body.email;
        const role=req.body.role;
        const password=req.body.password;
        const confirm_password=req.body.confirm_password;
        // const {name,email,role,password,confirmPassword}=req.body;
        
        try{
            if(password===confirm_password){
                 const hashedPassword=await bcrypt.hash(password,10);
            console.log(hashedPassword);
            const userId=uuidv4();
            const result1=await UserModel.findUserByEmail({email});
            if(result1){
                res.status(300).json({message:'The email already used'});
            }else{

                const result=await UserModel.create({'user_id':userId,'name':name,'email':email,'role':role,'password':hashedPassword});
                
                res.status(201).json({message:'User registered successfully', user: result.rows});
                console.log('in user controller');
            }
            }else{
                res.status(200).json({message:"confirm password doesnot"})
            }
           
        }
        catch(err){
            console.log(err);
            res.status(500).json({message:err});
        }
    }
    // Changed to arrow function
    find = async (req,res) => {
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
                return res.status(200).json({
                    "userDetail":userDetail
                });
            }
            else{
                 res.status(200).send({message:"no users registered"});
            }
        }
        catch(err){
            res.status(505).send({message:err});
        }
    }

    //  Changed to arrow function and fixed other issues
    updateUser = async (req,res) => {
        this.checkValidation(req);
        //here we are using uuid as userId so won't be able to find user by using userID 
        //using email to find the user
        // const email=req.email;
        try{
                 // Fixed: was 'request.email', should be 'req.email'
                 if(req.params.email){


                     const result=await UserModel.findUserByEmail({'email':req.params.email})
                     if(result){
                        if(req.body.password){
                            req.body.password=await bcrypt.hash(req.body.password,10)
                        }
                        const columns=req.body;
     
                        const result1=await UserModel.updateByEmail(columns,req.params.email);      
                        if (!result1) {
                            throw new HttpException(404, 'Something went wrong');
                        }
                        console.log(result,'hii',result1);
                        const message = isEqual(result,result1) ? 'Updated failed' :'User updated successfully' ;
     
                        res.send({ message });
                    } else {
                        // Fixed: moved this inside else block
                        res.status(404).json({message:'user not found'});
                    }
                }

       }catch(err){
           throw new HttpException(404, 'something went wrong failed', err);
       }
    }

    checkValidation = (req) => {
        const error=validationResult(req);
        if(!error.isEmpty()){
             throw new HttpException(400, 'Validation failed', error);
        }
    }
}  

export default new UserController();