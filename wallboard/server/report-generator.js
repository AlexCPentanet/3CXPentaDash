/**
 * PDF Report Generator
 * Creates professional PDF reports for wallboard data
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class ReportGenerator {
    constructor(config = {}) {
        this.config = {
            outputDir: config.outputDir || path.join(__dirname, '../reports'),
            companyName: config.companyName || 'Your Company',
            logoPath: config.logoPath || null,
            primaryColor: config.primaryColor || '#3274d9',
            accentColor: config.accentColor || '#5794f2'
        };

        // Ensure output directory exists
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
    }

    /**
     * Generate flagged calls report
     */
    async generateFlaggedCallsReport(calls, options = {}) {
        const filename = options.filename || `flagged-calls-${Date.now()}.pdf`;
        const filepath = path.join(this.config.outputDir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Header
        this.addHeader(doc, 'Flagged Calls Report');
        this.addReportInfo(doc, {
            'Generated': moment().format('YYYY-MM-DD HH:mm:ss'),
            'Period': options.period || 'All Time',
            'Total Calls': calls.length
        });

        // Statistics
        this.addSection(doc, 'Summary Statistics');
        const stats = this.calculateFlaggedCallStats(calls);
        this.addStatistics(doc, stats);

        // Calls list
        this.addSection(doc, 'Flagged Calls Details');
        this.addFlaggedCallsTable(doc, calls);

        // Footer
        this.addFooter(doc);

        doc.end();

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(filepath));
            writeStream.on('error', reject);
        });
    }

    /**
     * Generate performance report
     */
    async generatePerformanceReport(data, options = {}) {
        const filename = options.filename || `performance-${Date.now()}.pdf`;
        const filepath = path.join(this.config.outputDir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Header
        this.addHeader(doc, 'Performance Report');
        this.addReportInfo(doc, {
            'Generated': moment().format('YYYY-MM-DD HH:mm:ss'),
            'Period': options.period || 'Last 30 Days'
        });

        // KPIs
        this.addSection(doc, 'Key Performance Indicators');
        this.addKPICards(doc, data.kpis || {});

        // Agent Performance
        if (data.agents && data.agents.length > 0) {
            this.addSection(doc, 'Agent Performance');
            this.addAgentPerformanceTable(doc, data.agents);
        }

        // Queue Performance
        if (data.queues && data.queues.length > 0) {
            this.addSection(doc, 'Queue Performance');
            this.addQueuePerformanceTable(doc, data.queues);
        }

        // Sentiment Analysis
        if (data.sentiment) {
            this.addSection(doc, 'Sentiment Analysis');
            this.addSentimentSummary(doc, data.sentiment);
        }

        // Footer
        this.addFooter(doc);

        doc.end();

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(filepath));
            writeStream.on('error', reject);
        });
    }

    /**
     * Generate agent report
     */
    async generateAgentReport(agent, data, options = {}) {
        const filename = options.filename || `agent-${agent.extension}-${Date.now()}.pdf`;
        const filepath = path.join(this.config.outputDir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Header
        this.addHeader(doc, `Agent Report: ${agent.name}`);
        this.addReportInfo(doc, {
            'Extension': agent.extension,
            'Email': agent.email,
            'Period': options.period || 'Last 30 Days',
            'Generated': moment().format('YYYY-MM-DD HH:mm:ss')
        });

        // Agent Statistics
        this.addSection(doc, 'Agent Statistics');
        this.addAgentStats(doc, data.stats || {});

        // Call History
        if (data.calls && data.calls.length > 0) {
            this.addSection(doc, 'Call History');
            this.addCallHistoryTable(doc, data.calls);
        }

        // Performance Trends
        if (data.trends) {
            this.addSection(doc, 'Performance Trends');
            this.addTrendAnalysis(doc, data.trends);
        }

        // Footer
        this.addFooter(doc);

        doc.end();

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(filepath));
            writeStream.on('error', reject);
        });
    }

    /**
     * Add header to document
     */
    addHeader(doc, title) {
        // Logo (if available)
        if (this.config.logoPath && fs.existsSync(this.config.logoPath)) {
            doc.image(this.config.logoPath, 50, 45, { width: 100 });
        }

        // Company name
        doc.fontSize(10)
           .fillColor('#666')
           .text(this.config.companyName, 50, 50, { align: 'right' });

        // Title
        doc.fontSize(24)
           .fillColor(this.config.primaryColor)
           .text(title, 50, 80, { align: 'left' });

        // Horizontal line
        doc.moveTo(50, 120)
           .lineTo(545, 120)
           .strokeColor(this.config.primaryColor)
           .stroke();

        doc.moveDown(2);
    }

    /**
     * Add report info section
     */
    addReportInfo(doc, info) {
        const y = doc.y + 10;
        let currentY = y;

        doc.fontSize(10).fillColor('#666');

        Object.entries(info).forEach(([key, value]) => {
            doc.text(`${key}:`, 50, currentY, { continued: true, width: 150 });
            doc.fillColor('#000').text(value, { align: 'left' });
            doc.fillColor('#666');
            currentY += 20;
        });

        doc.moveDown(2);
    }

    /**
     * Add section heading
     */
    addSection(doc, title) {
        // Check if we need a new page
        if (doc.y > 700) {
            doc.addPage();
        }

        doc.fontSize(16)
           .fillColor(this.config.primaryColor)
           .text(title, 50, doc.y);

        doc.moveDown(0.5);

        // Underline
        doc.moveTo(50, doc.y)
           .lineTo(300, doc.y)
           .strokeColor(this.config.accentColor)
           .stroke();

        doc.moveDown(1);
        doc.fillColor('#000');
    }

    /**
     * Add statistics cards
     */
    addStatistics(doc, stats) {
        const startY = doc.y;
        const cardWidth = 160;
        const cardHeight = 80;
        const spacing = 15;
        const cardsPerRow = 3;

        let currentX = 50;
        let currentY = startY;
        let count = 0;

        Object.entries(stats).forEach(([label, value]) => {
            // Draw card background
            doc.rect(currentX, currentY, cardWidth, cardHeight)
               .fillAndStroke('#f8f9fa', '#ddd');

            // Value
            doc.fontSize(24)
               .fillColor(this.config.primaryColor)
               .text(value, currentX, currentY + 20, {
                   width: cardWidth,
                   align: 'center'
               });

            // Label
            doc.fontSize(10)
               .fillColor('#666')
               .text(label, currentX, currentY + 55, {
                   width: cardWidth,
                   align: 'center'
               });

            count++;
            currentX += cardWidth + spacing;

            if (count % cardsPerRow === 0) {
                currentX = 50;
                currentY += cardHeight + spacing;
            }
        });

        // Move cursor past the cards
        doc.y = currentY + cardHeight + 20;
        doc.fillColor('#000');
    }

    /**
     * Add KPI cards
     */
    addKPICards(doc, kpis) {
        const stats = {
            'Total Calls': kpis.totalCalls || 0,
            'Answered': kpis.answered || 0,
            'Abandoned': kpis.abandoned || 0,
            'Avg Wait Time': `${kpis.avgWaitTime || 0}s`,
            'Avg Handle Time': `${kpis.avgHandleTime || 0}s`,
            'SLA %': `${kpis.slaPercentage || 0}%`
        };

        this.addStatistics(doc, stats);
    }

    /**
     * Add flagged calls table
     */
    addFlaggedCallsTable(doc, calls) {
        const tableTop = doc.y;
        const rowHeight = 30;
        const colWidths = [60, 100, 80, 80, 110, 65];
        const headers = ['Date', 'Caller', 'Extension', 'Type', 'Reason', 'Severity'];

        // Table header
        let x = 50;
        doc.fontSize(10).fillColor('#fff');

        headers.forEach((header, i) => {
            doc.rect(x, tableTop, colWidths[i], rowHeight)
               .fill(this.config.primaryColor);

            doc.text(header, x + 5, tableTop + 10, {
                width: colWidths[i] - 10,
                align: 'left'
            });

            x += colWidths[i];
        });

        // Table rows
        let currentY = tableTop + rowHeight;
        doc.fillColor('#000').fontSize(9);

        calls.slice(0, 20).forEach((call, index) => {
            // Check if we need a new page
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }

            const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            x = 50;

            // Row background
            doc.rect(50, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
               .fill(rowColor);

            doc.fillColor('#000');

            // Date
            doc.text(moment(call.flaggedAt).format('MM/DD HH:mm'), x + 5, currentY + 10, {
                width: colWidths[0] - 10
            });
            x += colWidths[0];

            // Caller
            doc.text(call.callerName || call.callerNumber || 'Unknown', x + 5, currentY + 10, {
                width: colWidths[1] - 10,
                ellipsis: true
            });
            x += colWidths[1];

            // Extension
            doc.text(call.extension || '-', x + 5, currentY + 10, {
                width: colWidths[2] - 10
            });
            x += colWidths[2];

            // Type
            doc.text(call.type || '-', x + 5, currentY + 10, {
                width: colWidths[3] - 10
            });
            x += colWidths[3];

            // Reason
            doc.text(call.reason || '-', x + 5, currentY + 10, {
                width: colWidths[4] - 10,
                ellipsis: true
            });
            x += colWidths[4];

            // Severity
            const severityColor = call.severity === 'high' ? '#f2495c' :
                                 call.severity === 'medium' ? '#ff9830' : '#666';
            doc.fillColor(severityColor)
               .text(call.severity || '-', x + 5, currentY + 10, {
                   width: colWidths[5] - 10
               });
            doc.fillColor('#000');

            currentY += rowHeight;
        });

        doc.y = currentY + 10;
    }

    /**
     * Add agent performance table
     */
    addAgentPerformanceTable(doc, agents) {
        const tableTop = doc.y;
        const rowHeight = 25;
        const colWidths = [150, 80, 80, 90, 90];
        const headers = ['Agent', 'Calls', 'Avg Handle', 'Sentiment', 'Status'];

        // Table header
        let x = 50;
        doc.fontSize(10).fillColor('#fff');

        headers.forEach((header, i) => {
            doc.rect(x, tableTop, colWidths[i], rowHeight)
               .fill(this.config.primaryColor);

            doc.text(header, x + 5, tableTop + 8, {
                width: colWidths[i] - 10,
                align: 'left'
            });

            x += colWidths[i];
        });

        // Table rows
        let currentY = tableTop + rowHeight;
        doc.fillColor('#000').fontSize(9);

        agents.forEach((agent, index) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }

            const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            x = 50;

            doc.rect(50, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
               .fill(rowColor);

            doc.fillColor('#000');

            // Agent name
            doc.text(agent.name || `Ext ${agent.extension}`, x + 5, currentY + 8, {
                width: colWidths[0] - 10,
                ellipsis: true
            });
            x += colWidths[0];

            // Calls
            doc.text((agent.totalCalls || 0).toString(), x + 5, currentY + 8, {
                width: colWidths[1] - 10
            });
            x += colWidths[1];

            // Avg Handle Time
            doc.text(`${agent.avgHandlingTime || 0}s`, x + 5, currentY + 8, {
                width: colWidths[2] - 10
            });
            x += colWidths[2];

            // Sentiment
            const sentiment = agent.sentiment || { positive: 0, neutral: 0, negative: 0 };
            const sentimentText = `${sentiment.positive}/${sentiment.neutral}/${sentiment.negative}`;
            doc.text(sentimentText, x + 5, currentY + 8, {
                width: colWidths[3] - 10
            });
            x += colWidths[3];

            // Status
            const statusColor = agent.status === 'Available' ? '#73bf69' :
                               agent.status === 'On Call' ? '#ff9830' : '#666';
            doc.fillColor(statusColor)
               .text(agent.status || 'Unknown', x + 5, currentY + 8, {
                   width: colWidths[4] - 10
               });
            doc.fillColor('#000');

            currentY += rowHeight;
        });

        doc.y = currentY + 10;
    }

    /**
     * Calculate flagged call statistics
     */
    calculateFlaggedCallStats(calls) {
        return {
            'Total': calls.length,
            'Reviewed': calls.filter(c => c.reviewed).length,
            'Pending': calls.filter(c => !c.reviewed).length,
            'High Severity': calls.filter(c => c.severity === 'high').length,
            'Abuse': calls.filter(c => c.type === 'abuse').length,
            'Complaints': calls.filter(c => c.type === 'complaint').length
        };
    }

    /**
     * Add footer to document
     */
    addFooter(doc) {
        const pages = doc.bufferedPageRange();

        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            // Page number
            doc.fontSize(10)
               .fillColor('#666')
               .text(
                   `Page ${i + 1} of ${pages.count}`,
                   50,
                   doc.page.height - 50,
                   { align: 'center' }
               );

            // Generation timestamp
            doc.fontSize(8)
               .text(
                   `Generated by 3CX Wallboard on ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
                   50,
                   doc.page.height - 30,
                   { align: 'center' }
               );
        }
    }

    /**
     * Add queue performance table (stub)
     */
    addQueuePerformanceTable(doc, queues) {
        // Similar to agent performance table
        // Implementation details omitted for brevity
        doc.text('Queue performance data would be displayed here', 50, doc.y);
        doc.moveDown();
    }

    /**
     * Add sentiment summary (stub)
     */
    addSentimentSummary(doc, sentiment) {
        const stats = {
            'Positive': `${sentiment.positive || 0}%`,
            'Neutral': `${sentiment.neutral || 0}%`,
            'Negative': `${sentiment.negative || 0}%`
        };

        this.addStatistics(doc, stats);
    }

    /**
     * Add agent stats (stub)
     */
    addAgentStats(doc, stats) {
        const displayStats = {
            'Total Calls': stats.totalCalls || 0,
            'Answered': stats.answered || 0,
            'Avg Handle Time': `${stats.avgHandleTime || 0}s`,
            'Customer Satisfaction': `${stats.satisfaction || 0}%`
        };

        this.addStatistics(doc, displayStats);
    }

    /**
     * Add call history table (stub)
     */
    addCallHistoryTable(doc, calls) {
        doc.text(`${calls.length} calls in history`, 50, doc.y);
        doc.moveDown();
    }

    /**
     * Add trend analysis (stub)
     */
    addTrendAnalysis(doc, trends) {
        doc.text('Performance trends would be displayed here', 50, doc.y);
        doc.moveDown();
    }
}

module.exports = ReportGenerator;
