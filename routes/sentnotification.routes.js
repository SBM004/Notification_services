import express from 'express';
import auth from '../middleware/auth.middleware.js';
import Sc from '../controllers/sentnotificationcontroller.js';
import requestValidator from '../middleware/validators/requestValidator.middleware.js'
import awaitHandler from '../middleware/awaitHandlerFactory.middleware.js';
const router=express.Router();



router.post('/send',auth('admin','editor'),requestValidator,awaitHandler(Sc.createSentNotification));

router.get('/send',auth('admin','editor','viewer'),awaitHandler(Sc.find));

export default router;