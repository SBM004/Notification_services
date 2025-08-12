import path from 'path';
import fs from 'fs';
import db from '../db/db.connection.js';
import ReminderReportModel from '../models/report.model.js';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePDF,
  generateExcel,
  generateMonthlyPDF,
  generateMonthlyExcel
} from '../utils/reportGenerate.utils.js';

class ReportController {
  // Generate reports for all users for a given month
  async generateMonthlyReports(req, res, next) {
    try {
      const { month, type } = req.body;

      if (!month) return res.status(400).json({ message: 'Month is required' });
      if (!['pdf', 'excel'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Use "pdf" or "excel".' });
      }

      const userResult = await db.query(`
        SELECT DISTINCT user_id FROM sent_notification
        WHERE sent_at >= $1::DATE AND sent_at < ($1::DATE + INTERVAL '1 month')
      `, [month]);

      const users = userResult.rows;
      if (users.length === 0) {
        return res.status(200).json({ message: `No notifications sent in month: ${month}` });
      }

      const publicDir = path.join(process.cwd(), 'public', 'reports');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

      let generatedLinks = [];

      for (const { user_id } of users) {
        const report_id = uuidv4();
        const report_date = month;

        const statsResult = await db.query(`
          SELECT
            COUNT(*) AS total_sent,
            COUNT(*) FILTER (WHERE is_read = true) AS total_read,
            COUNT(*) FILTER (WHERE delivery_status = 'delivered') AS total_delivered
          FROM sent_notification
          WHERE user_id = $1
            AND sent_at >= $2::DATE
            AND sent_at < ($2::DATE + INTERVAL '1 month')
        `, [user_id, report_date]);

        const stats = statsResult.rows[0];
        const total_sent = parseInt(stats.total_sent, 10);
        const total_read = parseInt(stats.total_read, 10);
        const total_delivered = parseInt(stats.total_delivered, 10);

        const exists = await ReminderReportModel.reportExists({ user_id, report_date });

        if (exists) {
          await ReminderReportModel.update({ user_id, report_date, total_sent, total_read, total_delivered });
        } else {
          await ReminderReportModel.create({ report_id, user_id, report_date, total_sent, total_read, total_delivered });
        }

        const fileName = `report_${user_id}_${month}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
        const filePath = path.join(publicDir, fileName);

        if (type === 'pdf') {
          await generatePDF(user_id, [{ report_date, total_sent, total_read, total_delivered }], filePath);
        } else {
          await generateExcel(user_id, [{ report_date, total_sent, total_read, total_delivered }], filePath);
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/reports/${fileName}`;
        generatedLinks.push({ user_id, link: fileUrl });
      }

      return res.status(200).json({
        message: `Monthly ${type.toUpperCase()} reports generated for ${month}`,
        reports: generatedLinks
      });

    } catch (err) {
      next(err);
    }
  }

  // Generate a monthly summary report across all users
  async generateMonthlySummaryReport(req, res, next) {
    try {
      const { month, type } = req.body;

      if (!month) return res.status(400).json({ message: 'Month is required' });
      if (!['pdf', 'excel'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Use "pdf" or "excel".' });
      }

      const statsResult = await db.query(`
        SELECT
          COUNT(*) AS total_sent,
          COUNT(*) FILTER (WHERE is_read = true) AS total_read,
          COUNT(*) FILTER (WHERE delivery_status = 'delivered') AS total_delivered
        FROM sent_notification
        WHERE sent_at >= $1::DATE AND sent_at < ($1::DATE + INTERVAL '1 month')
      `, [month]);

      const stats = statsResult.rows[0];
      const summary = {
        report_date: month,
        total_sent: parseInt(stats.total_sent, 10),
        total_read: parseInt(stats.total_read, 10),
        total_delivered: parseInt(stats.total_delivered, 10)
      };

      const publicDir = path.join(process.cwd(), 'public', 'reports');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

      const fileName = `monthly_summary_${month}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      const filePath = path.join(publicDir, fileName);

      if (type === 'pdf') {
        await generateMonthlyPDF(new Date(month), summary, filePath);
      } else {
        await generateMonthlyExcel(new Date(month), summary, filePath);
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/reports/${fileName}`;
      return res.status(200).json({
        message: `Monthly ${type.toUpperCase()} summary report generated for ${month}`,
        report: fileUrl
      });

    } catch (err) {
      next(err);
    }
  }

  // Download a report file
  async downloadReport(req, res, next) {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(process.cwd(), 'public', 'reports', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      return res.download(filePath);
    } catch (err) {
      next(err);
    }
  }
}

export default new ReportController();