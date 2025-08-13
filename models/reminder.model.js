import { v4 as uuidv4 } from 'uuid';
// import db from '../config/database.js'; // Your database connection
import db from '../db/db.connection.js';

class ReminderModel {
    // Insert new reminder into database
     async create(reminderData) {
        const query = `
            INSERT INTO reminders (
                reminder_id, user_id, sent_to, title, message, execute_at, 
                timezone, type, carrier, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
        `;
        
        const values = [
            reminderData.reminder_id,
            reminderData.user_id,
            reminderData.sent_to,
            reminderData.title,
            reminderData.message,
            reminderData.execute_at,
            reminderData.timezone || 'UTC',
            reminderData.type || 'reminder',
            reminderData.carrier,
            reminderData.status || 'scheduled'
        ];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Find reminder by ID
     async findById(reminderId) {
        const query = `
            SELECT * FROM reminders 
            WHERE reminder_id = $1
        `;
        const result = await db.query(query, [reminderId]);
        return result.rows[0];
    }

    // Find all reminders for a user
     async findByUser(userId, status = null) {
        let query = `
            SELECT * FROM reminders 
            WHERE user_id = $1
        `;
        const params = [userId];

        if (status) {
            query += ` AND status = $2`;
            params.push(status);
        }

        query += ` ORDER BY execute_at ASC`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    // Find reminders by status
     async findByStatus(status) {
        const query = `
            SELECT * FROM reminders 
            WHERE status = $1
            ORDER BY execute_at ASC
        `;
        const result = await db.query(query, [status]);
        return result.rows;
    }

    // Find due reminders (for background processing)
     async findDueReminders(currentTime) {
        const query = `
            SELECT * FROM reminders 
            WHERE status = 'scheduled' 
            AND execute_at <= $1
            ORDER BY execute_at ASC
            LIMIT 100
        `;
        const result = await db.query(query, [currentTime]);
        return result.rows;
    }

    // Update reminder status with additional data
     async updateStatus(reminderId, status, additionalData = {}) {
        let query = `
            UPDATE reminders 
            SET status = $1, updated_at = NOW()
        `;
        const params = [status];
        let paramIndex = 2;

        // Add additional fields to update
        if (additionalData.kafka_sid) {
            query += `, kafka_sid = $${paramIndex}`;
            params.push(additionalData.kafka_sid);
            paramIndex++;
        }

        if (additionalData.queued_at) {
            query += `, queued_at = $${paramIndex}`;
            params.push(additionalData.queued_at);
            paramIndex++;
        }

        if (additionalData.sent_at) {
            query += `, sent_at = $${paramIndex}`;
            params.push(additionalData.sent_at);
            paramIndex++;
        }

        if (additionalData.failed_reason) {
            query += `, failed_reason = $${paramIndex}`;
            params.push(additionalData.failed_reason);
            paramIndex++;
        }

        if (additionalData.failed_at) {
            query += `, failed_at = $${paramIndex}`;
            params.push(additionalData.failed_at);
            paramIndex++;
        }

        if (additionalData.cancelled_at) {
            query += `, cancelled_at = $${paramIndex}`;
            params.push(additionalData.cancelled_at);
            paramIndex++;
        }

        query += ` WHERE reminder_id = $${paramIndex} RETURNING *`;
        params.push(reminderId);

        const result = await db.query(query, params);
        return result.rows[0];
    }

    // Update reminder data
     async update(reminderId, updateData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        // Build dynamic update query
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && key !== 'reminder_id') {
                fields.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `
            UPDATE reminders 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE reminder_id = $${paramIndex}
            RETURNING *
        `;
        params.push(reminderId);

        const result = await db.query(query, params);
        return result.rows[0];
    }

    // Delete reminder
     async delete(reminderId) {
        const query = `
            DELETE FROM reminders 
            WHERE reminder_id = $1
            RETURNING *
        `;
        const result = await db.query(query, [reminderId]);
        return result.rows[0];
    }

    // Get reminder statistics for a user
     async getUserStats(userId) {
        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM reminders 
            WHERE user_id = $1
            GROUP BY status
        `;
        const result = await db.query(query, [userId]);
        
        // Convert to object format
        const stats = {
            scheduled: 0,
            sent_to_queue: 0,
            sent: 0,
            delivered: 0,
            failed: 0,
            cancelled: 0
        };

        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });

        return stats;
    }

    // Get reminders by date range
     async findByDateRange(userId, startDate, endDate) {
        const query = `
            SELECT * FROM reminders 
            WHERE user_id = $1 
            AND execute_at >= $2 
            AND execute_at <= $3
            ORDER BY execute_at ASC
        `;
        const result = await db.query(query, [userId, startDate, endDate]);
        return result.rows;
    }

    // Get upcoming reminders (next N days)
     async getUpcomingReminders(userId, days = 7) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const query = `
            SELECT * FROM reminders 
            WHERE user_id = $1 
            AND status = 'scheduled'
            AND execute_at >= $2 
            AND execute_at <= $3
            ORDER BY execute_at ASC
        `;
        const result = await db.query(query, [userId, startDate, endDate]);
        return result.rows;
    }

    // Get reminders by carrier type
     async findByCarrier(userId, carrier, status = null) {
        let query = `
            SELECT * FROM reminders 
            WHERE user_id = $1 AND carrier = $2
        `;
        const params = [userId, carrier];

        if (status) {
            query += ` AND status = $3`;
            params.push(status);
        }

        query += ` ORDER BY execute_at DESC`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    // Get system-wide reminder statistics (admin only)
     async getSystemStats() {
        const query = `
            SELECT 
                carrier,
                status,
                COUNT(*) as count
            FROM reminders 
            GROUP BY carrier, status
            ORDER BY carrier, status
        `;
        const result = await db.query(query);
        
        const stats = {};
        result.rows.forEach(row => {
            if (!stats[row.carrier]) {
                stats[row.carrier] = {};
            }
            stats[row.carrier][row.status] = parseInt(row.count);
        });

        return stats;
    }
}


export default new ReminderModel();