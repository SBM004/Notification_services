import express from 'express';
import awaitHandlerFactory from '../middleware/awaitHandlerFactory.middleware.js';
import NotificationTypeController from '../controllers/notification_type.controller.js';
const router=express.Router();

//All done
//to see all the type
router.get('/types',awaitHandlerFactory(NotificationTypeController.find));
//to create the type
router.post('/types',awaitHandlerFactory(NotificationTypeController.createType));

export default router;