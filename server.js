import express from 'express'
// import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import errorMiddleware from './middleware/error.middleware.js';
import cors from 'cors'
import dotenv from 'dotenv'
import userRouter from './routes/user.routes.js';
import Notificationtype_router from './routes/notification_type.routes.js';
import SentRouter from './routes/sentnotification.routes.js';
const app=express();
dotenv.config();
app.use(cookieParser())
const port=process.env.PORT;
app.use(express.json());

app.use(cors());
app.use('/user',userRouter);
app.use('/type',Notificationtype_router);
app.use('/send',SentRouter)

app.use(errorMiddleware);
//http://localhost:3001/user/login


app.listen(port,()=>{console.log(`listeining to ${port}`)});
