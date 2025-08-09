import pool from '../db/db.connection.js';
import express from 'express';
import auth from '../middleware/auth.middleware.js';
import SentNotificationController from '../controllers/sentnotificationcontroller.js';
const router= express.Router();

// Routes with user_id in params - works for both regular users and admins
router.get('/user/:user_id', auth(), SentNotificationController.getNotificationsByUserId);
router.get('/user/:user_id/date-range', auth(), SentNotificationController.getNotificationsByDateRange);
router.get('/user/:user_id/by-date', auth(), SentNotificationController.getNotificationsByDate);
router.get('/user/:user_id/time-range', auth(), SentNotificationController.getNotificationsByTimeRange);
router.get('/user/:user_id/recent', auth(), SentNotificationController.getRecentNotifications);

// Admin-only route to get ALL notifications across users
router.get('/all', auth(), SentNotificationController.getAllNotifications);


export default router;



// # User 123 accessing their own notifications
// GET /api/notifications/user/123
// GET /api/notifications/user/123/date-range?start_date=2025-01-01&end_date=2025-01-31
// GET /api/notifications/user/123/recent?hours=24

// # User 123 trying to access user 456's notifications - gets 403 error
// GET /api/notifications/user/456  # DENIED