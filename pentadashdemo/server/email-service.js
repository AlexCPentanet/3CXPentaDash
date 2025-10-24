/**
 * Email Service for Pentadash Demo
 * Handles email alerts for flagged calls and tower incidents
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor(config, db) {
        this.config = config;
        this.db = db;
        this.transporter = null;

        if (config.smtp && config.smtp.host) {
            this.initialize();
        } else {
            console.log('📧 Email service: SMTP not configured (demo mode)');
        }
    }

    /**
     * Initialize SMTP transporter
     */
    initialize() {
        try {
            this.transporter = nodemailer.createTransport(this.config.smtp);
            console.log('✅ Email service initialized');
        } catch (error) {
            console.error('❌ Email service initialization failed:', error.message);
        }
    }

    /**
     * Send alert email
     */
    async sendAlert(alert) {
        if (!this.transporter) {
            console.log('📧 Email alert (demo mode):', alert.subject);
            return { success: true, demo: true };
        }

        try {
            const mailOptions = {
                from: this.config.smtp.auth.user,
                to: this.config.alerts.recipients.join(','),
                subject: alert.subject,
                html: alert.html,
                text: alert.text
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('❌ Email send failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send flagged call alert
     */
    async sendFlaggedCallAlert(call) {
        const subject = `🚨 Flagged Call Alert - ${call.severity.toUpperCase()}: ${call.reason}`;
        const html = `
            <h2>Flagged Call Alert</h2>
            <p><strong>Severity:</strong> ${call.severity}</p>
            <p><strong>Reason:</strong> ${call.reason}</p>
            <p><strong>Caller:</strong> ${call.callerName} (${call.callerNumber})</p>
            <p><strong>Extension:</strong> ${call.extension}</p>
            <p><strong>Sentiment:</strong> ${call.sentiment}</p>
            <hr>
            <p><strong>Transcription:</strong></p>
            <p>${call.transcription || 'N/A'}</p>
            <hr>
            <p><strong>Keywords:</strong> ${call.keywords || '[]'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `;

        return this.sendAlert({ subject, html, text: subject });
    }

    /**
     * Send tower incident alert
     */
    async sendTowerIncidentAlert(tower, incident) {
        const subject = `⚠️ Tower Impact Alert - ${tower.name}: ${incident.type}`;
        const html = `
            <h2>Tower Infrastructure Impact Alert</h2>
            <p><strong>Tower:</strong> ${tower.name}</p>
            <p><strong>Location:</strong> ${tower.address}</p>
            <p><strong>Incident Type:</strong> ${incident.type}</p>
            <p><strong>Severity:</strong> ${incident.severity}</p>
            <p><strong>Distance:</strong> ${incident.distance} km</p>
            <hr>
            <p><strong>Description:</strong></p>
            <p>${incident.description}</p>
            <hr>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `;

        return this.sendAlert({ subject, html, text: subject });
    }

    /**
     * Test email configuration
     */
    async testConnection() {
        if (!this.transporter) {
            return { success: false, error: 'SMTP not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'SMTP connection successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;
