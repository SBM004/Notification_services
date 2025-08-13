


//3rd code
import SentNotific from '../models/sentnotification.model.js';
import {HttpException} from '../utils/HttpException.utils.js';
import { sendToKafka } from '../kafkaqueue/producer.js';
import {v4 as uuidv4} from 'uuid'


class SentController{
    
    // Helper to extract pagination params
    getPaginationParams(req) {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        return { limit, offset, page };
    }

    async createSentNotification(req, res) {
    const body = req.body;
    try {
        const carrier = req.body.carrier.toLowerCase();
        
        if (carrier === 'sms' || carrier==='email') {
            console.log("sent_controller");
            
            // Check if it's bulk sending (array of recipients)
            if (Array.isArray(body.to)) {
                // Handle multiple users
                const results = [];
                const errors = [];
                
                for (const recipient of body.to) {
                    const sid = uuidv4();
                    const payload = {
                        sent_to: recipient, // Individual phone number
                        message: req.body.message,
                        title: req.body.title,
                        type: req.body.type,
                        carrier,
                        user_id: req.currentUser.user_id,
                        sent_at: new Date().toISOString(),
                        sid: sid,
                        
                    };
                    
                    try {
                        await sendToKafka(payload);
                        results.push({
                            recipient: recipient,
                            sid: sid,
                            status: "queued",
                            success: true
                        });
                    } catch (kafkaError) {
                        console.error(`Kafka error for ${recipient}:`, kafkaError);
                        errors.push({
                            recipient: recipient,
                            error: kafkaError.message,
                            success: false
                        });
                    }
                }
                
                // Return bulk response
                res.status(200).json({
                    message: `Bulk notifications processed: ${results.length} queued, ${errors.length} failed`,
                    success: errors.length === 0, // Only true if all succeeded
                    total_sent: results.length,
                    total_failed: errors.length,
                    results: results,
                    errors: errors
                });
                
            } else {
                // Handle single user (your existing code)
                const sid = uuidv4();
                const payload = {
                    sent_to: req.body.to,
                    message: req.body.message,
                    title: req.body.title,
                    type: req.body.type,
                    carrier,
                    user_id: req.currentUser.user_id,
                    sent_at: new Date().toISOString(),
                    sid: sid
                };
                
                try {
                    await sendToKafka(payload);
                    res.status(200).json({
                        message: "Notification queued successfully",
                        success: true,
                        sid: sid,
                        status: "queued"
                    });
                } catch (kafkaError) {
                    console.error("Kafka error:", kafkaError);
                    res.status(500).json({
                        message: "Failed to queue notification",
                        success: false,
                        error: kafkaError.message
                    });
                }
            }
           
            
        } else {
            throw new HttpException(400, "Unsupported carrier");
        }
        
    } catch(err) {
        console.log(err);
        if (!res.headersSent) {
            res.status(err.status || 500).json({
                message: err.message || "Internal server error",
                success: false
            });
        }
    }
}

     async getNotificationStatus(req, res) {
        try {
            const { sid } = req.params;
            
            if (!sid) {
                throw new HttpException(400, "SID is required");
            }
            
            const result = await SentNotific.findBySID({ sid });
            
            if (!result) {
                throw new HttpException(404, "Notification not found");
            }
            
            res.status(200).json({
                message: "Status retrieved successfully",
                success: true,
                data: result
            });
            
        } catch (err) {
            console.error("Error getting notification status:", err);
            res.status(err.status || 500).json({
                message: err.message || "Internal server error",
                success: false
            });
        }
    }

    // Add these methods to your SentController class

// Get all notifications for a specific user (admin can access any user, users only their own)
async getNotificationsByUserId(req, res) {
    try {
        const { user_id } = req.params;
        const {limit,offset,page}=this.getPaginationParams(req); //added for pagination
        const currentUser = req.currentUser;
        
        // Authorization check
        if (currentUser.role !== 'admin' && currentUser.user_id !== user_id) {
            throw new HttpException(403, "Access denied. You can only view your own notifications");
        }
        
        const result = await SentNotific.findByUserId({ user_id, limit,offset }); //updated for pagination
        
        res.status(200).json({
            message: "Notifications retrieved successfully",
            success: true,
            page,
            limit,
            count: result.length,
            data: result
        });
        
    } catch (err) {
        console.error("Error getting notifications:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            success: false
        });
    }
}

// Get notifications by date range for specific user
async getNotificationsByDateRange(req, res) {
    try {
        const { user_id } = req.params;
        const { start_date, end_date } = req.query;
        const {limit,offset,page}=this.getPaginationParams(req); //added for pagination
        const currentUser = req.currentUser;
        
        // Authorization check
        if (currentUser.role !== 'admin' && currentUser.user_id !== user_id) {
            throw new HttpException(403, "Access denied. You can only view your own notifications");
        }
        
        if (!start_date || !end_date) {
            throw new HttpException(400, "start_date and end_date are required");
        }
        
        const result = await SentNotific.findByDateRange({ //updated for pagination
            user_id, 
            start_date, 
            end_date,
            limit,
            offset
        });
        
        res.status(200).json({
            message: "Notifications retrieved successfully",
            success: true,
            page,
            limit,
            count: result.length,
            data: result
        });
        
    } catch (err) {
        console.error("Error getting notifications by date range:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            success: false
        });
    }
}

// Get notifications by specific date for specific user
async getNotificationsByDate(req, res) {
    try {
        const { user_id } = req.params;
        const { date } = req.query;
        const { limit, offset, page } = this.getPaginationParams(req);
        const currentUser = req.currentUser;
        
        // Authorization check
        if (currentUser.role !== 'admin' && currentUser.user_id !== user_id) {
            throw new HttpException(403, "Access denied. You can only view your own notifications");
        }
        
        if (!date) {
            throw new HttpException(400, "date parameter is required (format: YYYY-MM-DD)");
        }
        
        const result = await SentNotific.findByDate({ user_id, date, limit, offset });
        
        res.status(200).json({
            message: "Notifications retrieved successfully",
            success: true,
            page,
            limit,
            count: result.length,
            data: result
        });
        
    } catch (err) {
        console.error("Error getting notifications by date:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            success: false
        });
    }
}

// Get notifications by time range for specific user
async getNotificationsByTimeRange(req, res) {
    try {
        const { user_id } = req.params;
        const { start_time, end_time, date } = req.query;
        const { limit, offset, page } = this.getPaginationParams(req);
        const currentUser = req.currentUser;
        
        // Authorization check
        if (currentUser.role !== 'admin' && currentUser.user_id !== user_id) {
            throw new HttpException(403, "Access denied. You can only view your own notifications");
        }
        
        if (!start_time || !end_time) {
            throw new HttpException(400, "start_time and end_time are required (format: HH:MM)");
        }
        
        // Use provided date or default to today
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const result = await SentNotific.findByTimeRange({ 
            user_id, 
            date: targetDate, 
            start_time, 
            end_time, 
            limit,
            offset
        });
        
        res.status(200).json({
            message: "Notifications retrieved successfully",
            success: true,
            page,
            limit,
            count: result.length,
            data: result
        });
        
    } catch (err) {
        console.error("Error getting notifications by time range:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            success: false
        });
    }
}

// Get recent notifications for specific user
async getRecentNotifications(req, res) {
    try {
        const { user_id } = req.params;
        const { hours, days } = req.query;
        const { limit, offset, page } = this.getPaginationParams(req);
        const currentUser = req.currentUser;
        
        // Authorization check
        if (currentUser.role !== 'admin' && currentUser.user_id !== user_id) {
            throw new HttpException(403, "Access denied. You can only view your own notifications");
        }
        
        if (!hours && !days) {
            throw new HttpException(400, "Either 'hours' or 'days' parameter is required");
        }
        
        const result = await SentNotific.findRecent({ 
            user_id, 
            hours: hours ? parseInt(hours) : null,
            days: days ? parseInt(days) : null,
            limit,
            offset
        });
        
        res.status(200).json({
            message: "Recent notifications retrieved successfully",
            success: true,
            page,
            limit,
            count: result.length,
            data: result
        });
        
    } catch (err) {
        console.error("Error getting recent notifications:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            success: false
        });
    }
}

// Admin: Get all notifications across all users with optional filters
async getAllNotifications(req, res) {
    try {
        const currentUser = req.currentUser;
        
        // Only admins can see all notifications
        if (currentUser.role !== 'admin') {
            throw new HttpException(403, "Access denied. Admin privileges required");
        }
        
        const { 
            carrier, 
            delivery_status, 
            date 
        } = req.query;
        
        const {limit,offset,page}=this.getPaginationParams(req); //added pagination

        const result = await SentNotific.findAllWithFilters({
            carrier,
            delivery_status,
            date,
            limit,
            offset
        });
        
        res.status(200).json({
            message: "All notifications retrieved successfully",
            success: true,
            page,
            limit,
            count: result.length,
            data: result
        });
        
    } catch (err) {
        console.error("Error getting all notifications:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
            success: false
        });
    }
}



    // ... rest of your methods
}

export default new SentController();















//1st code
// // controllers/sent.controller.js
// import { sendToKafka } from '../kafka/producer.js';
// import { HttpException } from '../utils/HttpException.utils.js';

// class SentController {
//   async createSentNotification(req, res) {
//     try {
//       const carrier = req.body.carrier.toLowerCase();
//       if (carrier === 'sms') {
//         const payload = {
//           to: req.body.to,
//           message: req.body.message,
//           title: req.body.title,
//           type: req.body.type,
//           carrier,
//           user_id: req.currentUser.user_id,
//           sent_at: new Date().toISOString()
//         };

//         await sendToKafka(payload);

//         res.status(200).json({
//           message: "Notification queued successfully",
//           success: true
//         });
//       } else {
//         throw new HttpException(400, "Unsupported carrier");
//       }
//     } catch (err) {
//       console.error(err);
//       throw new HttpException(500, err.message);
//     }
//   }
// }

// export default new SentController();
