import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../db';
import UserModel from '../models/user.model.js';
import HttpException from '../utils/HttpException.utils.js'
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

            const result = await pool.query('SELECT * FROM users WHERE user_id=$1',[user_id]);
            const user = result.rows[0];

            if (!user) {
                throw new HttpException(401, 'Authentication failed! User Not Found');
            }

            const normalizedUserRole = user.role.toLowerCase();
            const normalizedRoles = roles.map(role => role.toLowerCase());
            // check if the current user is the owner user
            const ownerAuthorized = req.params.userId && req.params.userId === user.user_id;

            
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