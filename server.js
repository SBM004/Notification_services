import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

app=express();
dotenv.config();
const port=process.env.PORT;
app.use(express.json());
app.use(cors());




