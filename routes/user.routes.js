import express from 'express'

// import UserModel from '../models/user.model.js';
import UserController from '../controllers/user.controllers.js';
import awaitHandlerFactory from '../middleware/awaitHandlerFactory.middleware.js';
import auth from '../middleware/auth.middleware.js';
import {createUserSchema,updateUserSchema,validateLogin} from '../middleware/validators/userValidator.middleware.js';
const router=express.Router();
router.post('/login',validateLogin,awaitHandlerFactory(UserController.loginUser));
router.get('/users',awaitHandlerFactory(UserController.find));
// router.get('/user')
router.post('/users',createUserSchema,awaitHandlerFactory(UserController.registerUser));

router.patch('/update/:email',updateUserSchema,auth(),awaitHandlerFactory(UserController.updateUser));
router.patch('/update/:user_id',updateUserSchema,auth(),awaitHandlerFactory(UserController.updateUser));


export default router;