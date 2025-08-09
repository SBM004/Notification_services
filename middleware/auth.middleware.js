import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// import pool from '../db';
import userModel from '../models/user.model.js';
import {HttpException} from '../utils/HttpException.utils.js'
dotenv.config();

const auth = (...roles) => {
    return async function (req, res, next) {
        try {
           const token =req.cookies.token;

            if (!token) {
                throw new HttpException(401, 'Access denied. No token found in cookies!');
            }

            
            const secretKey = process.env.SECRET_KEY;

            // Verify Token
            const decoded = jwt.verify(token, secretKey);
            const {user_id}= decoded;
            console.log(decoded);
            const result = await userModel.findUserById({user_id})
            

            if (!result) {
                throw new HttpException(401, 'Authentication failed! User Not Found');
            }

            const normalizedUserRole = result.role.toLowerCase();
            console.log("role:",normalizedUserRole)
            const normalizedRoles = roles.map(role => role.toLowerCase());
            // check if the current user is the owner user
            // const ownerAuthorized = req.params.userId && req.params.userId === user.user_id;
            const ownerAuthorized =
            (req.params.userId && req.params.userId === result.user_id) ||
            (req.params.email && req.params.email === result.email);
            console.log(ownerAuthorized)
            console.log(normalizedRoles.includes(normalizedUserRole))
            console.log(normalizedUserRole === 'admin')
            const isAuthorized = ownerAuthorized || normalizedRoles.includes(normalizedUserRole) || normalizedUserRole === 'admin';

            if(!isAuthorized){
                throw new HttpException(403,'Forbidden: You do not have access');
            }
            // if the user has permissions
            req.currentUser = user;
            next();

        } catch (e) {
            if(e.name === 'TokenExpiredError'){
                return next(new HttpException(401,'Token has expired'));
            }
            next(new HttpException(401, e.message ||'Unauthorized'));
        }
    };
};

export default auth;