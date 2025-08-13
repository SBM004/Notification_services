// import { ReminderModel } from '../models/Reminder.js';
// import { ReminderService } from '../services/ReminderService.js';
// import {v4 as uuidv4} from 'uuid'
// export class ReminderController {
//     // Create a new reminder
//     static async createReminder(req, res) {
//         try {
//             // const {
//             //     from:req.currentUser,
//             //     to,
//             //     title,
//             //     message,
//             //     executeAt,
//             //     type = 'sms',
//             //     timezone = 'UTC'
//             // } = req.body;
//             const sent_to=req.body.to;
//             const message=req.body.message;
//             const title=req.body.title;
//             const type=req.body.type;
//             const carrier=req.body.carrier;
//             const user_id=req.currentUser;
//             const executeAt=req.body.executeAt;
//             const timezone='UTC';
//             const sid = uuidv4();


//             // Validate required fields
//             if (!to || !title || !message || !executeAt) {
//                 return res.status(400).json({
//                     error: 'Missing required fields: to, title, message, executeAt'
//                 });
//             }

//             // Validate execution time is in the future
//             const executeAtDate = new Date(executeAt);
//             if (executeAtDate <= new Date()) {
//                 return res.status(400).json({
//                     error: 'Reminder execution time must be in the future'
//                 });
//             }

//             // Create reminder using service
//             const result = await ReminderService.createReminder({
//                 to,
//                 title,
//                 message,
//                 executeAt,
//                 type,
//                 priority,
//                 timezone
//             });

//             res.status(201).json(result);

//         } catch (error) {
//             console.error('Error creating reminder:', error);
//             res.status(500).json({
//                 error: 'Failed to create reminder',
//                 details: error.message
//             });
//         }
//     }

//     // Get user's reminders
//     static async getUserReminders(req, res) {
//         try {
//             const { to } = req.params;
//             const { status } = req.query;

//             // Validate to
//             if (!to || isNaN(to)) {
//                 return res.status(400).json({
//                     error: 'Valid to is required'
//                 });
//             }

//             const reminders = await ReminderModel.findByUser(parseInt(to), status);

//             res.json({
//                 success: true,
//                 data: reminders,
//                 count: reminders.length
//             });

//         } catch (error) {
//             console.error('Error fetching user reminders:', error);
//             res.status(500).json({
//                 error: 'Failed to fetch reminders',
//                 details: error.message
//             });
//         }
//     }

//     // Get specific reminder
//     static async getReminder(req, res) {
//         try {
//             const { reminderId } = req.params;

//             const reminder = await ReminderModel.findById(reminderId);

//             if (!reminder) {
//                 return res.status(404).json({
//                     error: 'Reminder not found'
//                 });
//             }

//             res.json({
//                 success: true,
//                 data: reminder
//             });

//         } catch (error) {
//             console.error('Error fetching reminder:', error);
//             res.status(500).json({
//                 error: 'Failed to fetch reminder',
//                 details: error.message
//             });
//         }
//     }

//     // Update reminder
//     static async updateReminder(req, res) {
//         try {
//             const { reminderId } = req.params;
//             const updateData = req.body;

//             // Check if reminder exists
//             const existingReminder = await ReminderModel.findById(reminderId);
//             if (!existingReminder) {
//                 return res.status(404).json({
//                     error: 'Reminder not found'
//                 });
//             }

//             // Update using service (handles rescheduling)
//             const result = await ReminderService.updateReminder(reminderId, updateData);

//             res.json(result);

//         } catch (error) {
//             console.error('Error updating reminder:', error);
//             res.status(500).json({
//                 error: 'Failed to update reminder',
//                 details: error.message
//             });
//         }
//     }

//     // Cancel reminder
//     static async cancelReminder(req, res) {
//         try {
//             const { reminderId } = req.params;

//             // Check if reminder exists
//             const existingReminder = await ReminderModel.findById(reminderId);
//             if (!existingReminder) {
//                 return res.status(404).json({
//                     error: 'Reminder not found'
//                 });
//             }

//             // Cancel using service (handles job cleanup)
//             const result = await ReminderService.cancelReminder(reminderId);

//             res.json(result);

//         } catch (error) {
//             console.error('Error cancelling reminder:', error);
//             res.status(500).json({
//                 error: 'Failed to cancel reminder',
//                 details: error.message
//             });
//         }
//     }

//     // Get user statistics
//     static async getUserStats(req, res) {
//         try {
//             const { to } = req.params;

//             if (!to || isNaN(to)) {
//                 return res.status(400).json({
//                     error: 'Valid to is required'
//                 });
//             }

//             const stats = await ReminderModel.getUserStats(parseInt(to));

//             res.json({
//                 success: true,
//                 data: stats
//             });

//         } catch (error) {
//             console.error('Error fetching user stats:', error);
//             res.status(500).json({
//                 error: 'Failed to fetch statistics',
//                 details: error.message
//             });
//         }
//     }
// }


import  ReminderModel  from '../models/reminder.model.js';
import ReminderService from '../services/reminder.service.js';
import { v4 as uuidv4 } from 'uuid';

 class ReminderController {
    // Create a new reminder
     async createReminder(req, res) {
        try {
            const {
                to,
                title,
                message,
                carrier,
                executeAt,
                type = 'reminder', // Default type for reminders
                 // sms/email/push
                timezone = 'ITC'
            } = req.body;

            const user_id = req.currentUser.user_id;

            // Validate required fields
            if (!to || !title || !message || !executeAt || !carrier) {
                return res.status(400).json({
                    error: 'Missing required fields: to, title, message, executeAt, carrier'
                });
            }

            // Validate carrier
            const validCarriers = ['sms', 'email', 'push'];
            if (!validCarriers.includes(carrier.toLowerCase())) {
                return res.status(400).json({
                    error: 'Invalid carrier. Must be one of: sms, email, push'
                });
            }

            // Validate execution time is in the future
            const executeAtDate = executeAt;
            if (executeAtDate <= new Date()) {
                return res.status(400).json({
                    error: 'Reminder execution time must be in the future'
                });
            }

            // Handle multiple recipients
            let recipients = [];
            if (Array.isArray(to)) {
                recipients = to;
            } else {
                recipients = [to];
            }

            const results = [];
            const errors = [];

            // Create separate reminder for each recipient
            for (const recipient of recipients) {
                try {
                    const result = await ReminderService.createReminder({
                        userId: user_id,
                        sent_to: recipient,
                        title,
                        message,
                        executeAt: executeAtDate,
                        type,
                        carrier: carrier.toLowerCase(),
                        timezone
                    });

                    results.push({
                        recipient: recipient,
                        reminderId: result.reminderId,
                        scheduledFor: result.scheduledFor,
                        success: true
                    });
                } catch (error) {
                    console.error(`Error creating reminder for ${recipient}:`, error);
                    errors.push({
                        recipient: recipient,
                        error: error.message,
                        success: false
                    });
                }
            }

            // Return appropriate response
            if (recipients.length === 1) {
                // Single recipient
                if (results.length > 0) {
                    res.status(201).json(results[0]);
                } else {
                    res.status(500).json({
                        error: 'Failed to create reminder',
                        details: errors[0]?.error
                    });
                }
            } else {
                // Multiple recipients
                res.status(201).json({
                    message: `Bulk reminders processed: ${results.length} created, ${errors.length} failed`,
                    success: errors.length === 0,
                    total_created: results.length,
                    total_failed: errors.length,
                    results: results,
                    errors: errors
                });
            }

        } catch (error) {
            console.error('Error creating reminder:', error);
            res.status(500).json({
                error: 'Failed to create reminder',
                details: error.message
            });
        }
    }

    // Get user's reminders
     async getUserReminders(req, res) {
        try {
            const { userId } = req.params;
            const { status } = req.query;

            // Validate userId
            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    error: 'Valid userId is required'
                });
            }

            // Authorization check
            if (req.currentUser.role !== 'admin' && req.currentUser.user_id !== parseInt(userId)) {
                return res.status(403).json({
                    error: 'Access denied. You can only view your own reminders'
                });
            }

            const reminders = await ReminderModel.findByUser(parseInt(userId), status);

            res.json({
                success: true,
                data: reminders,
                count: reminders.length
            });

        } catch (error) {
            console.error('Error fetching user reminders:', error);
            res.status(500).json({
                error: 'Failed to fetch reminders',
                details: error.message
            });
        }
    }

    // Get specific reminder
    static async getReminder(req, res) {
        try {
            const { reminderId } = req.params;

            const reminder = await ReminderModel.findById(reminderId);

            if (!reminder) {
                return res.status(404).json({
                    error: 'Reminder not found'
                });
            }

            // Authorization check
            if (req.currentUser.role !== 'admin' && req.currentUser.user_id !== reminder.user_id) {
                return res.status(403).json({
                    error: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: reminder
            });

        } catch (error) {
            console.error('Error fetching reminder:', error);
            res.status(500).json({
                error: 'Failed to fetch reminder',
                details: error.message
            });
        }
    }

    // Update reminder
    static async updateReminder(req, res) {
        try {
            const { reminderId } = req.params;
            const updateData = req.body;

            // Check if reminder exists
            const existingReminder = await ReminderModel.findById(reminderId);
            if (!existingReminder) {
                return res.status(404).json({
                    error: 'Reminder not found'
                });
            }

            // Authorization check
            if (req.currentUser.role !== 'admin' && req.currentUser.user_id !== existingReminder.user_id) {
                return res.status(403).json({
                    error: 'Access denied'
                });
            }

            // Validate execution time if provided
            if (updateData.executeAt) {
                const executeAtDate = new Date(updateData.executeAt);
                if (executeAtDate <= new Date()) {
                    return res.status(400).json({
                        error: 'Reminder execution time must be in the future'
                    });
                }
            }

            // Update using service (handles rescheduling)
            const result = await ReminderService.updateReminder(reminderId, updateData);

            res.json(result);

        } catch (error) {
            console.error('Error updating reminder:', error);
            res.status(500).json({
                error: 'Failed to update reminder',
                details: error.message
            });
        }
    }

    // Cancel reminder
    static async cancelReminder(req, res) {
        try {
            const { reminderId } = req.params;

            // Check if reminder exists
            const existingReminder = await ReminderModel.findById(reminderId);
            if (!existingReminder) {
                return res.status(404).json({
                    error: 'Reminder not found'
                });
            }

            // Authorization check
            if (req.currentUser.role !== 'admin' && req.currentUser.user_id !== existingReminder.user_id) {
                return res.status(403).json({
                    error: 'Access denied'
                });
            }

            // Cancel using service (handles job cleanup)
            const result = await ReminderService.cancelReminder(reminderId);

            res.json(result);

        } catch (error) {
            console.error('Error cancelling reminder:', error);
            res.status(500).json({
                error: 'Failed to cancel reminder',
                details: error.message
            });
        }
    }

    // Get user statistics
    static async getUserStats(req, res) {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    error: 'Valid userId is required'
                });
            }

            // Authorization check
            if (req.currentUser.role !== 'admin' && req.currentUser.user_id !== parseInt(userId)) {
                return res.status(403).json({
                    error: 'Access denied'
                });
            }

            const stats = await ReminderModel.getUserStats(parseInt(userId));

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({
                error: 'Failed to fetch statistics',
                details: error.message
            });
        }
    }
}


export default new ReminderController()