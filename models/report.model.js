import pool from '../db/db.connection.js';

class ReminderReportModel {
  table = 'notification_report';

  // Create a new report
  async create({ report_id, user_id, report_date, total_sent, total_read, total_delivered }) {
    const q = `
      INSERT INTO ${this.table} (report_id, user_id, report_date, total_sent, total_read, total_delivered)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    try {
      const result = await pool.query(q, [
        report_id,
        user_id,
        report_date,
        total_sent,
        total_read,
        total_delivered
      ]);
      return result.rows;
    } catch (err) {
      console.error('Error creating report:', err);
      throw err;
    }
  }

  // Check if a report already exists for the user and month
  async reportExists({ user_id, report_date }) {
    const q = `
      SELECT 1 FROM ${this.table}
      WHERE user_id = $1 AND report_date = $2
    `;
    try {
      const result = await pool.query(q, [user_id, report_date]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error checking report existence:', err);
      throw err;
    }
  }

  // Update an existing report
  async update({ total_sent, total_read, total_delivered, user_id, report_date }) {
    const q = `
      UPDATE ${this.table}
      SET total_sent = $1,
          total_read = $2,
          total_delivered = $3
      WHERE user_id = $4 AND report_date = $5
      RETURNING *
    `;
    try {
      const result = await pool.query(q, [
        total_sent,
        total_read,
        total_delivered,
        user_id,
        report_date
      ]);
      return result.rows;
    } catch (err) {
      console.error('Error updating report:', err);
      throw err;
    }
  }

}

export default new ReminderReportModel();