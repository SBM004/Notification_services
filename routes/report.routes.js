import express from 'express';
import auth from '../middleware/auth.middleware.js';
import ReportController from '../controllers/report.controller.js';
import awaitHandler from '../middleware/awaitHandlerFactory.middleware.js';

const router = express.Router();

// Generate monthly reports for all users
// POST /report
// Body: { month: '2025-08-01', type: 'pdf' | 'excel' }
router.post('/report', auth('admin', 'editor'), awaitHandler(ReportController.generateMonthlyReports));

// Generate monthly summary report
// POST /report/summary
// Body: { month: '2025-08-01', type: 'pdf' | 'excel' }
router.post('/report/summary', auth('admin', 'editor'), awaitHandler(ReportController.generateMonthlySummaryReport));

// Download a report file
// GET /report/:fileName
router.get('/report/:fileName', auth('admin', 'editor', 'viewer'), awaitHandler(ReportController.downloadReport));

export default router;