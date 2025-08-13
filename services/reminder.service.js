import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import  ReminderModel  from '../models/reminder.model.js';
import { sendToKafka } from '../kafkaqueue/producer.js';

 class ReminderService {
     reminderJobs = new Map(); // Store scheduled jobs
     isProcessing = false;

    // Initialize the service
     init() {
        this.startReminderProcessor();
        console.log('🚀 ReminderService initialized');
    }

    // Create a new reminder
     async createReminder(reminderData) {
        console.log("createReminder",reminderData.sent_to)
        
        const  userId=reminderData.userId;

          const  to=reminderData.sent_to
           const title=reminderData.title;
           const message=reminderData.message;
           const executeAt=reminderData.executeAt;
           const type = 'reminder';
           const carrier=reminderData.carrier;
           const timezone = 'UTC';
        

        const reminderId = uuidv4();
        // const executeAtDate = new Date(executeAt);

        // Save to database
        const reminder = await ReminderModel.create({
            reminder_id: reminderId,
            user_id: userId,
            sent_to: to, // Store the recipient
            title,
            message,
            execute_at: executeAt,
            timezone,
            type,
            carrier,
            status: 'scheduled'
        });

        console.log(`📅 Reminder scheduled: ${reminderId} for ${executeAt} via ${carrier}`);

        // Schedule the job
        await this.scheduleJob(reminder);

        return {
            success: true,
            reminderId,
            scheduledFor: executeAt,
            message: 'Reminder scheduled successfully'
        };
    }

    // Schedule a job
     async scheduleJob(reminder) {
        const executeAt = reminder.execute_at;
        const now = new Date();

        if (executeAt <= now) {
            await this.executeReminder(reminder);
            return;
        }

        const delay = executeAt.getTime() - now.getTime();
        console.log(now.getTime());
        console.log(executeAt.getTime());
        const timeoutId = setTimeout(async () => {
            await this.executeReminder(reminder);
            this.reminderJobs.delete(reminder.reminder_id);
        }, delay);

        this.reminderJobs.set(reminder.reminder_id, timeoutId);
        console.log(`⏰ Scheduled reminder: ${reminder.reminder_id} in ${delay}ms`);
    }

    // Execute a reminder - Send to Kafka for processing
     async executeReminder(reminder) {
        try {
            console.log(`🔔 Executing reminder: ${reminder.reminder_id}`);

            // Create payload for Kafka
            const sid = uuidv4();
            const payload = {
                sid: sid,
                sent_to: reminder.sent_to,
                message: reminder.message,
                title: reminder.title,
                type: reminder.type || 'reminder',
                carrier: reminder.carrier,
                user_id: reminder.user_id,
                sent_at: new Date().toISOString(),
                // Additional reminder-specific metadata
                reminder_id: reminder.reminder_id,
                original_scheduled_time: reminder.execute_at
            };

            // Determine which Kafka topic to use based on type and priority
            const topic = this.getKafkaTopicForReminder(reminder.type, reminder.carrier);
            
            try {
                // Send to Kafka
                await sendToKafka(payload, topic);
                
                // Update reminder status to 'sent_to_queue'
                await ReminderModel.updateStatus(reminder.reminder_id, 'sent_to_queue', {
                    kafka_sid: sid,
                    queued_at: new Date()
                });

                console.log(`✅ Reminder sent to Kafka: ${reminder.reminder_id}, SID: ${sid}, Topic: ${topic}`);

            } catch (kafkaError) {
                console.error(`❌ Failed to send reminder to Kafka: ${reminder.reminder_id}`, kafkaError);
                
                // Update status to failed
                await ReminderModel.updateStatus(reminder.reminder_id, 'failed', {
                    failed_reason: `Kafka error: ${kafkaError.message}`,
                    failed_at: new Date()
                });
            }

        } catch (error) {
            console.error(`❌ Error executing reminder ${reminder.reminder_id}:`, error);
            
            try {
                await ReminderModel.updateStatus(reminder.reminder_id, 'failed', {
                    failed_reason: error.message,
                    failed_at: new Date()
                });
            } catch (updateError) {
                console.error(`❌ Failed to update reminder status: ${updateError.message}`);
            }
        }
    }

    // Determine Kafka topic based on reminder priority
     getKafkaTopicForReminder(type, carrier) {
        // You can customize this logic based on your requirements
        // For now, all reminders go to the reminder priority topic
        
        if (type === 'critical_reminder' || type === 'urgent_reminder') {
            return 'notifications-warning'; // High priority
        } else if (type === 'important_reminder') {
            return 'notifications-info'; // Normal priority
        } else {
            return 'notifications-reminder'; // Low priority (default for reminders)
        }
    }

    // Cancel a reminder
     async cancelReminder(reminderId) {
        const timeoutId = this.reminderJobs.get(reminderId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.reminderJobs.delete(reminderId);
            console.log(`⏰ Cancelled scheduled job for reminder: ${reminderId}`);
        }

        await ReminderModel.updateStatus(reminderId, 'cancelled', {
            cancelled_at: new Date()
        });

        return {
            success: true,
            message: 'Reminder cancelled successfully'
        };
    }

    // Update a reminder
     async updateReminder(reminderId, updateData) {
        const updates = { updated_at: new Date() };
        
        if (updateData.title) updates.title = updateData.title;
        if (updateData.message) updates.message = updateData.message;
        if (updateData.type) updates.type = updateData.type;
        if (updateData.carrier) updates.carrier = updateData.carrier;
        if (updateData.executeAt) updates.execute_at = updateData.executeAt;

        await ReminderModel.update(reminderId, updates);

        // Reschedule if execution time changed
        if (updateData.executeAt) {
            const timeoutId = this.reminderJobs.get(reminderId);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.reminderJobs.delete(reminderId);
            }

            const updatedReminder = await ReminderModel.findById(reminderId);
            if (updatedReminder && updatedReminder.status === 'scheduled') {
                await this.scheduleJob(updatedReminder);
                console.log(`🔄 Rescheduled reminder: ${reminderId}`);
            }
        }

        return {
            success: true,
            message: 'Reminder updated successfully'
        };
    }

    // Background processor for missed reminders
     startReminderProcessor() {
        cron.schedule('* * * * *', async () => {
            if (this.isProcessing) return;

            try {
                this.isProcessing = true;
                await this.processMissedReminders();
            } catch (error) {
                console.error('❌ Error in reminder processor:', error);
            } finally {
                this.isProcessing = false;
            }
        });

        console.log('⏰ Reminder processor started (runs every minute)');
    }

    // Process missed reminders (fallback mechanism)
     async processMissedReminders() {
        const now = new Date();
        const missedReminders = await ReminderModel.findDueReminders(now);

        if (missedReminders.length > 0) {
            console.log(`📋 Processing ${missedReminders.length} missed reminders`);

            for (const reminder of missedReminders) {
                // Check if this reminder is already in our scheduled jobs
                if (!this.reminderJobs.has(reminder.reminder_id)) {
                    console.log(`🔄 Processing missed reminder: ${reminder.reminder_id}`);
                    await this.executeReminder(reminder);
                }
            }
        }
    }

    // Load existing scheduled reminders on service startup
     async loadScheduledReminders() {
        try {
            const scheduledReminders = await ReminderModel.findByStatus('scheduled');
            
            for (const reminder of scheduledReminders) {
                const executeAt = reminder.execute_at;
                const now = new Date();
                
                if (executeAt > now) {
                    // Reschedule future reminders
                    await this.scheduleJob(reminder);
                } else {
                    // Execute overdue reminders
                    await this.executeReminder(reminder);
                }
            }
            
            console.log(`📅 Loaded ${scheduledReminders.length} existing scheduled reminders`);
        } catch (error) {
            console.error('❌ Error loading scheduled reminders:', error);
        }
    }

    // Initialize service with existing reminders
     async initializeWithExistingReminders() {
        this.init();
        await this.loadScheduledReminders();
        console.log('🚀 ReminderService fully initialized with existing reminders');
    }
}


export default new ReminderService();