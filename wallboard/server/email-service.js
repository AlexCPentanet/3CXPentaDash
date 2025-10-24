/**
 * Email Alert Service
 * Sends email notifications for flagged calls with recordings, transcripts, and sentiment
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class EmailService {
    constructor(config, db) {
        this.config = config.email || {};
        this.db = db;
        this.transporter = null;
        this.pendingDigest = [];

        // Initialize SMTP transport if configured
        if (this.config.enabled && this.config.smtp.host) {
            this.initializeTransport();
        }

        // Schedule daily digest if enabled
        if (this.config.alerts?.batchLowSeverity) {
            this.scheduleDailyDigest();
        }
    }

    /**
     * Initialize SMTP transporter
     */
    initializeTransport() {
        try {
            this.transporter = nodemailer.createTransport({
                host: this.config.smtp.host,
                port: this.config.smtp.port || 587,
                secure: this.config.smtp.secure || false,
                auth: {
                    user: this.config.smtp.auth.user,
                    pass: this.config.smtp.auth.pass
                },
                // For self-signed certificates
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('Email service error:', error);
                } else {
                    console.log('✓ Email service ready');
                }
            });

        } catch (error) {
            console.error('Failed to initialize email transport:', error);
        }
    }

    /**
     * Send flagged call alert
     */
    async sendFlaggedCallAlert(flaggedCall, options = {}) {
        if (!this.config.enabled || !this.transporter) {
            console.log('Email alerts disabled or not configured');
            return false;
        }

        // Check if we should send this severity level
        const severity = flaggedCall.details?.severity || 'low';
        const shouldSend = this.shouldSendAlert(severity);

        if (!shouldSend) {
            // Add to digest instead
            if (this.config.alerts?.batchLowSeverity && severity === 'low') {
                this.pendingDigest.push(flaggedCall);
            }
            return false;
        }

        try {
            // Prepare email content
            const emailContent = await this.buildAlertEmail(flaggedCall, options);

            // Send email
            const info = await this.transporter.sendMail({
                from: `"3CX Wallboard Alert" <${this.config.smtp.auth.user}>`,
                to: this.config.alerts.recipients.join(', '),
                subject: this.buildSubject(flaggedCall),
                html: emailContent.html,
                text: emailContent.text,
                attachments: emailContent.attachments
            });

            console.log('✓ Flagged call alert sent:', info.messageId);
            return true;

        } catch (error) {
            console.error('Failed to send flagged call alert:', error);
            return false;
        }
    }

    /**
     * Check if alert should be sent based on severity
     */
    shouldSendAlert(severity) {
        const triggers = this.config.alerts?.triggers || {};

        switch (severity) {
            case 'high':
                return triggers.highSeverity !== false;
            case 'medium':
                return triggers.mediumSeverity !== false;
            case 'low':
                return triggers.lowSeverity === true;
            default:
                return false;
        }
    }

    /**
     * Build email subject
     */
    buildSubject(flaggedCall) {
        const template = this.config.alerts?.subject || '[FLAGGED CALL] {severity} - {reason}';
        const severity = (flaggedCall.details?.severity || 'unknown').toUpperCase();
        const reason = flaggedCall.reason || 'Unknown';

        return template
            .replace('{severity}', severity)
            .replace('{reason}', reason);
    }

    /**
     * Build email content
     */
    async buildAlertEmail(flaggedCall, options = {}) {
        const html = this.buildHTMLEmail(flaggedCall);
        const text = this.buildTextEmail(flaggedCall);
        const attachments = [];

        // Attach call recording if enabled and available
        if (this.config.alerts?.includeRecording && flaggedCall.recordingPath) {
            const recordingPath = this.resolveRecordingPath(flaggedCall.recordingPath);

            if (fs.existsSync(recordingPath)) {
                attachments.push({
                    filename: `call-${flaggedCall.callId}.wav`,
                    path: recordingPath,
                    contentType: 'audio/wav'
                });
            }
        }

        // Attach transcript as text file if enabled
        if (this.config.alerts?.includeTranscript && flaggedCall.transcription) {
            attachments.push({
                filename: `transcript-${flaggedCall.callId}.txt`,
                content: flaggedCall.transcription,
                contentType: 'text/plain'
            });
        }

        // Attach sentiment analysis as JSON if enabled
        if (this.config.alerts?.includeSentiment && flaggedCall.sentiment) {
            const sentimentData = {
                overall: flaggedCall.sentiment,
                score: flaggedCall.sentimentScore || 0,
                keywords: flaggedCall.details?.keywords || []
            };

            attachments.push({
                filename: `sentiment-${flaggedCall.callId}.json`,
                content: JSON.stringify(sentimentData, null, 2),
                contentType: 'application/json'
            });
        }

        return { html, text, attachments };
    }

    /**
     * Build HTML email
     */
    buildHTMLEmail(call) {
        const severity = call.details?.severity || 'unknown';
        const severityColor = severity === 'high' ? '#F44336' :
                             severity === 'medium' ? '#FF9800' : '#FFC107';

        const includeTranscript = this.config.alerts?.includeTranscript;
        const includeSentiment = this.config.alerts?.includeSentiment;
        const includeKeywords = this.config.alerts?.includeKeywords;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: ${severityColor};
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .severity {
            display: inline-block;
            padding: 4px 12px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 8px;
        }
        .content {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 12px;
            margin: 20px 0;
            background: white;
            padding: 15px;
            border-radius: 4px;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .section {
            background: white;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            border-left: 4px solid ${severityColor};
        }
        .section h2 {
            margin-top: 0;
            font-size: 16px;
            color: ${severityColor};
        }
        .transcription {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.8;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        .keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .keyword {
            background: #ff5252;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
        }
        .sentiment-bar {
            display: flex;
            height: 30px;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .sentiment-positive {
            background: #4CAF50;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .sentiment-neutral {
            background: #FFC107;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .sentiment-negative {
            background: #F44336;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
        .action-button {
            display: inline-block;
            background: #0052CC;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Flagged Call Alert</h1>
        <div class="severity">${severity} Severity</div>
    </div>

    <div class="content">
        <div class="info-grid">
            <div class="info-label">Call ID:</div>
            <div class="info-value">${call.callId}</div>

            <div class="info-label">Time:</div>
            <div class="info-value">${moment(call.flaggedAt || call.startTime).format('YYYY-MM-DD HH:mm:ss')}</div>

            <div class="info-label">Caller:</div>
            <div class="info-value">${call.callerName || call.callerNumber || 'Unknown'}</div>

            <div class="info-label">Extension:</div>
            <div class="info-value">${call.extension || 'N/A'}</div>

            <div class="info-label">Duration:</div>
            <div class="info-value">${this.formatDuration(call.duration)}</div>

            <div class="info-label">Reason:</div>
            <div class="info-value"><strong>${call.reason}</strong></div>
        </div>

        ${includeKeywords && call.details?.keywords ? `
        <div class="section">
            <h2>Detected Keywords</h2>
            <div class="keywords">
                ${call.details.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
            </div>
        </div>
        ` : ''}

        ${includeSentiment && call.sentiment ? `
        <div class="section">
            <h2>Sentiment Analysis</h2>
            <p><strong>Overall Sentiment:</strong> ${call.sentiment}</p>
            ${call.sentimentScore ? `<p><strong>Score:</strong> ${call.sentimentScore.toFixed(2)}</p>` : ''}
        </div>
        ` : ''}

        ${includeTranscript && call.transcription ? `
        <div class="section">
            <h2>Call Transcription</h2>
            <div class="transcription">${this.escapeHtml(call.transcription)}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="https://${this.config.dashboardUrl || 'wallboard.pentanet.com.au'}/admin/flagged-calls" class="action-button">
                Review in Admin Panel
            </a>
        </div>
    </div>

    <div class="footer">
        <p>This is an automated alert from 3CX Wallboard</p>
        <p>Pentanet Systems - Licensed by Aatrox Communications Limited</p>
        <p>${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Build plain text email
     */
    buildTextEmail(call) {
        const severity = (call.details?.severity || 'unknown').toUpperCase();
        const includeTranscript = this.config.alerts?.includeTranscript;
        const includeKeywords = this.config.alerts?.includeKeywords;

        let text = `
🚨 FLAGGED CALL ALERT - ${severity} SEVERITY
${'-'.repeat(60)}

Call Information:
-----------------
Call ID:      ${call.callId}
Time:         ${moment(call.flaggedAt || call.startTime).format('YYYY-MM-DD HH:mm:ss')}
Caller:       ${call.callerName || call.callerNumber || 'Unknown'}
Extension:    ${call.extension || 'N/A'}
Duration:     ${this.formatDuration(call.duration)}

Flagged For:
------------
${call.reason}
`;

        if (includeKeywords && call.details?.keywords) {
            text += `\nDetected Keywords:\n`;
            text += call.details.keywords.map(kw => `  - ${kw}`).join('\n');
            text += '\n';
        }

        if (call.sentiment) {
            text += `\nSentiment: ${call.sentiment}`;
            if (call.sentimentScore) {
                text += ` (Score: ${call.sentimentScore.toFixed(2)})`;
            }
            text += '\n';
        }

        if (includeTranscript && call.transcription) {
            text += `\nCall Transcription:\n`;
            text += '-'.repeat(60) + '\n';
            text += call.transcription;
            text += '\n' + '-'.repeat(60) + '\n';
        }

        text += `
Review this call in the admin panel:
https://${this.config.dashboardUrl || 'wallboard.pentanet.com.au'}/admin/flagged-calls

---
3CX Wallboard Alert System
Pentanet Systems
${moment().format('YYYY-MM-DD HH:mm:ss')}
        `;

        return text;
    }

    /**
     * Send daily digest of low-severity flagged calls
     */
    async sendDailyDigest() {
        if (this.pendingDigest.length === 0) {
            console.log('No pending digest items');
            return;
        }

        try {
            const html = this.buildDigestHTML(this.pendingDigest);
            const text = this.buildDigestText(this.pendingDigest);

            await this.transporter.sendMail({
                from: `"3CX Wallboard Digest" <${this.config.smtp.auth.user}>`,
                to: this.config.alerts.recipients.join(', '),
                subject: `Daily Flagged Calls Digest - ${this.pendingDigest.length} calls`,
                html,
                text
            });

            console.log(`✓ Daily digest sent (${this.pendingDigest.length} calls)`);

            // Clear digest
            this.pendingDigest = [];

        } catch (error) {
            console.error('Failed to send daily digest:', error);
        }
    }

    /**
     * Build digest HTML
     */
    buildDigestHTML(calls) {
        const callRows = calls.map(call => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${moment(call.flaggedAt).format('HH:mm')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${call.callerName || call.callerNumber || 'Unknown'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${call.extension || 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${call.reason}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${call.sentiment || 'N/A'}</td>
            </tr>
        `).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #0052CC; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th { background: #0052CC; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <h1>Daily Flagged Calls Digest</h1>
    <p><strong>${calls.length}</strong> low-severity calls flagged on ${moment().format('YYYY-MM-DD')}</p>

    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>Caller</th>
                <th>Extension</th>
                <th>Reason</th>
                <th>Sentiment</th>
            </tr>
        </thead>
        <tbody>
            ${callRows}
        </tbody>
    </table>

    <div class="footer">
        <p>3CX Wallboard - Pentanet Systems</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Build digest text
     */
    buildDigestText(calls) {
        let text = `Daily Flagged Calls Digest - ${moment().format('YYYY-MM-DD')}\n`;
        text += `${calls.length} low-severity calls flagged\n\n`;

        calls.forEach((call, index) => {
            text += `${index + 1}. ${moment(call.flaggedAt).format('HH:mm')} - `;
            text += `${call.callerName || call.callerNumber || 'Unknown'} `;
            text += `(Ext: ${call.extension || 'N/A'}) - `;
            text += `${call.reason}\n`;
        });

        return text;
    }

    /**
     * Schedule daily digest
     */
    scheduleDailyDigest() {
        const digestTime = this.config.alerts?.dailyDigestTime || '09:00';
        const [hours, minutes] = digestTime.split(':').map(Number);

        // Calculate milliseconds until next digest time
        const now = new Date();
        const nextDigest = new Date(now);
        nextDigest.setHours(hours, minutes, 0, 0);

        if (nextDigest <= now) {
            nextDigest.setDate(nextDigest.getDate() + 1);
        }

        const msUntilDigest = nextDigest - now;

        console.log(`Daily digest scheduled for ${digestTime} (in ${Math.round(msUntilDigest / 1000 / 60)} minutes)`);

        setTimeout(() => {
            this.sendDailyDigest();
            // Reschedule for next day
            setInterval(() => this.sendDailyDigest(), 24 * 60 * 60 * 1000);
        }, msUntilDigest);
    }

    /**
     * Resolve recording file path
     */
    resolveRecordingPath(recordingPath) {
        // If it's already an absolute path, use it
        if (path.isAbsolute(recordingPath)) {
            return recordingPath;
        }

        // Otherwise, resolve from recordings directory
        const recordingsDir = this.config.recordingsDir || '/var/lib/3cxpbx/Instance1/Data/Recordings';
        return path.join(recordingsDir, recordingPath);
    }

    /**
     * Format duration in seconds to readable format
     */
    formatDuration(seconds) {
        if (!seconds) return 'N/A';

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Test email configuration
     */
    async testEmail(recipientEmail) {
        if (!this.transporter) {
            throw new Error('Email not configured');
        }

        const info = await this.transporter.sendMail({
            from: `"3CX Wallboard Test" <${this.config.smtp.auth.user}>`,
            to: recipientEmail,
            subject: 'Test Email from 3CX Wallboard',
            html: `
                <h2>Test Email</h2>
                <p>This is a test email from 3CX Wallboard email alert system.</p>
                <p>If you received this, email configuration is working correctly.</p>
                <p><strong>Time:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
            `,
            text: 'Test email from 3CX Wallboard. Email configuration is working correctly.'
        });

        return info;
    }
}

module.exports = EmailService;
