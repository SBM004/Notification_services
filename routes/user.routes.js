import express from 'express'

// import UserModel from '../models/user.model.js';
import UserController from '../controllers/user.controllers.js';
import awaitHandlerFactory from '../middleware/awaitHandlerFactory.middleware.js';
const router=express.Router();
router.post('/login',awaitHandlerFactory(UserController.loginUser));
router.get('/users',awaitHandlerFactory(UserController.find));
// router.get('/user')
router.post('/users',awaitHandlerFactory(UserController.registerUser));


export default router;