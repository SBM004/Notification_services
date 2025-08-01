import express from 'express'
import router from 'express.Router()'
import UserModel from '../models/user.model.js';

router.get('/users',UserModel.find());
router.get('/user?email={email}')