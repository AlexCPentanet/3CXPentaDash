/**
 * Report Generator for Pentadash Demo
 * Generates PDF reports for call analytics and compliance
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportGenerator {
    constructor(db) {
        this.db = db;
        this.reportsDir = path.join(__dirname, '../data/reports');

        // Ensure reports directory exists
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }

        console.log('✅ Report generator initialized');
    }

    /**
     * Generate flagged calls report
     */
    async generateFlaggedCallsReport(filters = {}) {
        return new Promise((resolve, reject) => {
            const filename = `flagged-calls-${Date.now()}.pdf`;
            const filepath = path.join(this.reportsDir, filename);

            // Query flagged calls
            this.db.all(
                `SELECT * FROM flagged_calls ORDER BY createdAt DESC LIMIT 100`,
                [],
                (err, calls) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Create PDF
                    const doc = new PDFDocument();
                    const stream = fs.createWriteStream(filepath);

                    doc.pipe(stream);

                    // Header
                    doc.fontSize(20).text('Flagged Calls Report', { align: 'center' });
                    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
                    doc.moveDown();

                    // Summary
                    doc.fontSize(14).text('Summary');
                    doc.fontSize(10).text(`Total Flagged Calls: ${calls.length}`);
                    doc.moveDown();

                    // Calls details
                    calls.forEach((call, index) => {
                        if (index > 0) doc.addPage();

                        doc.fontSize(14).text(`Call ${index + 1}: ${call.callId}`);
                        doc.fontSize(10);
                        doc.text(`Severity: ${call.severity}`);
                        doc.text(`Reason: ${call.reason}`);
                        doc.text(`Caller: ${call.callerName} (${call.callerNumber})`);
                        doc.text(`Extension: ${call.extension}`);
                        doc.text(`Date: ${call.createdAt}`);
                        doc.moveDown();
                        doc.text(`Transcription:`);
                        doc.text(call.transcription || 'N/A', { width: 500 });
                    });

                    doc.end();

                    stream.on('finish', () => {
                        resolve({ success: true, filename, filepath });
                    });

                    stream.on('error', (error) => {
                        reject(error);
                    });
                }
            );
        });
    }

    /**
     * Generate daily summary report
     */
    async generateDailySummary(date) {
        const filename = `daily-summary-${date || new Date().toISOString().split('T')[0]}.pdf`;
        const filepath = path.join(this.reportsDir, filename);

        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('Daily Summary Report', { align: 'center' });
        doc.fontSize(12).text(`Date: ${date || new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();

        // Placeholder content
        doc.fontSize(14).text('Call Statistics');
        doc.fontSize(10);
        doc.text('Total Calls: N/A (Demo Mode)');
        doc.text('Answered Calls: N/A');
        doc.text('Missed Calls: N/A');
        doc.text('Average Wait Time: N/A');
        doc.moveDown();

        doc.fontSize(14).text('Performance Metrics');
        doc.fontSize(10);
        doc.text('Service Level: N/A');
        doc.text('Average Handle Time: N/A');
        doc.text('First Call Resolution: N/A');

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve({ success: true, filename, filepath });
            });

            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * List available reports
     */
    async listReports() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.reportsDir, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }

                const reports = files
                    .filter(f => f.endsWith('.pdf'))
                    .map(f => {
                        const stats = fs.statSync(path.join(this.reportsDir, f));
                        return {
                            filename: f,
                            size: stats.size,
                            created: stats.birthtime
                        };
                    });

                resolve(reports);
            });
        });
    }

    /**
     * Get report file path
     */
    getReportPath(filename) {
        return path.join(this.reportsDir, filename);
    }
}

module.exports = ReportGenerator;
