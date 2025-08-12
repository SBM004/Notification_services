import ExcelJS from 'exceljs';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import 'pdfkit-table'; // Extends PDFDocument with .table()

// Generate Excel report for a user
export async function generateExcel(userId, reports, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`User ${userId}`);

  worksheet.columns = [
    { header: 'Date', key: 'report_date', width: 20 },
    { header: 'Total Sent', key: 'total_sent', width: 15 },
    { header: 'Total Read', key: 'total_read', width: 15 },
    { header: 'Total Delivered', key: 'total_delivered', width: 18 }
  ];

  reports.forEach(report => {
    worksheet.addRow({
      report_date: formatDate(report.report_date),
      total_sent: report.total_sent,
      total_read: report.total_read,
      total_delivered: report.total_delivered
    });
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

// Generate PDF report for a user
export async function generatePDF(userId, reports, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text(`Notification Report for User: ${userId}`, { align: 'center' });
      doc.moveDown();

      const table = {
        headers: ['Date', 'Sent', 'Read', 'Delivered'],
        rows: reports.map(r => [
          formatDate(r.report_date),
          r.total_sent,
          r.total_read,
          r.total_delivered
        ])
      };

      doc.table(table);
      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Generate monthly summary Excel
export async function generateMonthlyExcel(monthDate, summary, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Summary');

  worksheet.columns = [
    { header: 'Month', key: 'report_date', width: 20 },
    { header: 'Total Sent', key: 'total_sent', width: 15 },
    { header: 'Total Read', key: 'total_read', width: 15 },
    { header: 'Total Delivered', key: 'total_delivered', width: 18 }
  ];

  worksheet.addRow({
    report_date: formatDate(summary.report_date),
    total_sent: summary.total_sent,
    total_read: summary.total_read,
    total_delivered: summary.total_delivered
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

// Generate monthly summary PDF
export async function generateMonthlyPDF(monthDate, summary, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text(`Monthly Notification Summary: ${formatDate(summary.report_date)}`, { align: 'center' });
      doc.moveDown();

      const table = {
        headers: ['Month', 'Sent', 'Read', 'Delivered'],
        rows: [[
          formatDate(summary.report_date),
          summary.total_sent,
          summary.total_read,
          summary.total_delivered
        ]]
      };

      doc.table(table);
      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Helper to format date
function formatDate(date) {
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return String(date).slice(0, 10);
}