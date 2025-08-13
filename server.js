import express from 'express'
// import bodyParser from 'body-parser'
import { initProducer } from './kafkaqueue/producer.js';
import { startConsumer } from './kafkaqueue/consumer.js';
import cookieParser from 'cookie-parser'
import errorMiddleware from './middleware/error.middleware.js';
import webHookRouter from './routes/smsServiceHandler.router.js';
import cors from 'cors'
import dotenv from 'dotenv'
import userRouter from './routes/user.routes.js';
import Notificationtype_router from './routes/notification_type.routes.js';
import SentRouter from './routes/sentnotification.routes.js';
import NotificationRouter from './routes/notification.routes.js';
import ReportRouter from './routes/report.routes.js';
import ReminderRouter from './routes/reminder.routes.js';
const app=express();
dotenv.config();
app.use(cookieParser())
// Init Kafka Producer and Consumer
await initProducer();
await startConsumer();
const port=process.env.PORT;
app.use(express.json({ 
    strict: false,  // Less strict JSON parsing
    limit: '10mb'
}));

app.use(cors());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in request body',
            error: 'Malformed JSON'
        });
    }
    next(err);
});
app.use('/user',userRouter);
app.use('/type',Notificationtype_router);
app.use('/send',SentRouter)
app.use('/webhook',webHookRouter)
app.use('/notifications',NotificationRouter)
app.use('/report',ReportRouter);
app.use('/reminder',ReminderRouter);
app.use(errorMiddleware);

//http://localhost:3001/user/login


app.listen(port,()=>{console.log(`listeining to ${port}`)});
