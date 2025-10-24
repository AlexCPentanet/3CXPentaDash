/**
 * Admin API Server
 * Backend server for wallboard administration
 * Handles user management, settings, flagged calls, and reports
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class AdminAPIServer {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3001,
            jwtSecret: config.jwtSecret || 'change-this-secret-key',
            dbPath: config.dbPath || path.join(__dirname, '../data/wallboard.db'),
            corsOrigin: config.corsOrigin || '*',
            saltRounds: 10
        };

        this.app = express();
        this.db = null;

        this.setupMiddleware();
        this.setupDatabase();
        this.setupRoutes();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // CORS
        this.app.use(cors({ origin: this.config.corsOrigin }));

        // Body parser
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Setup SQLite database
     */
    setupDatabase() {
        // Ensure data directory exists
        const dataDir = path.dirname(this.config.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Open database
        this.db = new sqlite3.Database(this.config.dbPath, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    /**
     * Initialize database tables
     */
    initializeTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                fullName TEXT,
                role TEXT NOT NULL DEFAULT 'viewer',
                active INTEGER NOT NULL DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                lastLogin DATETIME
            )
        `);

        // Flagged calls table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS flagged_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                callId TEXT UNIQUE NOT NULL,
                extension TEXT,
                callerName TEXT,
                callerNumber TEXT,
                startTime DATETIME,
                endTime DATETIME,
                duration INTEGER,
                reason TEXT NOT NULL,
                severity TEXT,
                type TEXT,
                transcription TEXT,
                sentiment TEXT,
                keywords TEXT,
                reviewed INTEGER DEFAULT 0,
                reviewedBy INTEGER,
                reviewedAt DATETIME,
                reviewNotes TEXT,
                flaggedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(reviewedBy) REFERENCES users(id)
            )
        `);

        // Settings table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT,
                updatedBy INTEGER,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(updatedBy) REFERENCES users(id),
                UNIQUE(category, key)
            )
        `);

        // Audit log table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                action TEXT NOT NULL,
                entity TEXT,
                entityId TEXT,
                changes TEXT,
                ipAddress TEXT,
                userAgent TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `);

        // Reports table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                filters TEXT,
                createdBy INTEGER NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(createdBy) REFERENCES users(id)
            )
        `);

        // Create default admin user if not exists
        this.createDefaultAdmin();
    }

    /**
     * Create default admin user
     */
    createDefaultAdmin() {
        const defaultPassword = 'admin123'; // Change this!

        this.db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt.hash(defaultPassword, this.config.saltRounds);

                this.db.run(`
                    INSERT INTO users (username, password, email, fullName, role)
                    VALUES (?, ?, ?, ?, ?)
                `, ['admin', hashedPassword, 'admin@localhost', 'System Administrator', 'admin'], (err) => {
                    if (err) {
                        console.error('Error creating default admin:', err);
                    } else {
                        console.log('Default admin user created');
                        console.log('Username: admin');
                        console.log('Password: admin123');
                        console.log('PLEASE CHANGE THE DEFAULT PASSWORD!');
                    }
                });
            }
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Authentication routes
        this.app.post('/api/auth/login', this.login.bind(this));
        this.app.post('/api/auth/logout', this.authenticate.bind(this), this.logout.bind(this));
        this.app.get('/api/auth/verify', this.authenticate.bind(this), this.verifyToken.bind(this));

        // User management routes
        this.app.get('/api/users', this.authenticate.bind(this), this.requireRole('admin'), this.getUsers.bind(this));
        this.app.post('/api/users', this.authenticate.bind(this), this.requireRole('admin'), this.createUser.bind(this));
        this.app.put('/api/users/:id', this.authenticate.bind(this), this.requireRole('admin'), this.updateUser.bind(this));
        this.app.delete('/api/users/:id', this.authenticate.bind(this), this.requireRole('admin'), this.deleteUser.bind(this));
        this.app.put('/api/users/:id/password', this.authenticate.bind(this), this.changePassword.bind(this));

        // Flagged calls routes
        this.app.get('/api/flagged-calls', this.authenticate.bind(this), this.getFlaggedCalls.bind(this));
        this.app.get('/api/flagged-calls/:id', this.authenticate.bind(this), this.getFlaggedCall.bind(this));
        this.app.post('/api/flagged-calls', this.authenticate.bind(this), this.addFlaggedCall.bind(this));
        this.app.put('/api/flagged-calls/:id/review', this.authenticate.bind(this), this.reviewFlaggedCall.bind(this));
        this.app.get('/api/flagged-calls/stats', this.authenticate.bind(this), this.getFlaggedCallStats.bind(this));

        // Settings routes
        this.app.get('/api/settings', this.authenticate.bind(this), this.getSettings.bind(this));
        this.app.get('/api/settings/:category', this.authenticate.bind(this), this.getSettingsByCategory.bind(this));
        this.app.put('/api/settings/:category/:key', this.authenticate.bind(this), this.requireRole('admin'), this.updateSetting.bind(this));

        // Reports routes
        this.app.get('/api/reports', this.authenticate.bind(this), this.getReports.bind(this));
        this.app.post('/api/reports', this.authenticate.bind(this), this.createReport.bind(this));
        this.app.get('/api/reports/:id', this.authenticate.bind(this), this.getReport.bind(this));
        this.app.delete('/api/reports/:id', this.authenticate.bind(this), this.deleteReport.bind(this));
        this.app.post('/api/reports/:id/generate', this.authenticate.bind(this), this.generateReport.bind(this));

        // Connection status route
        this.app.get('/api/status', this.getStatus.bind(this));

        // Audit log routes
        this.app.get('/api/audit-log', this.authenticate.bind(this), this.requireRole('admin'), this.getAuditLog.bind(this));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date() });
        });
    }

    /**
     * Authentication middleware
     */
    authenticate(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    /**
     * Role-based access control middleware
     */
    requireRole(...roles) {
        return (req, res, next) => {
            if (!req.user || !roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        };
    }

    /**
     * Login
     */
    async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        this.db.get('SELECT * FROM users WHERE username = ? AND active = 1', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            this.db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

            // Generate JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                this.config.jwtSecret,
                { expiresIn: '8h' }
            );

            // Log audit
            this.logAudit(user.id, 'login', 'user', user.id, null, req.ip, req.headers['user-agent']);

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                }
            });
        });
    }

    /**
     * Logout
     */
    logout(req, res) {
        this.logAudit(req.user.id, 'logout', 'user', req.user.id, null, req.ip, req.headers['user-agent']);
        res.json({ message: 'Logged out successfully' });
    }

    /**
     * Verify token
     */
    verifyToken(req, res) {
        res.json({ valid: true, user: req.user });
    }

    /**
     * Get users
     */
    getUsers(req, res) {
        this.db.all(`
            SELECT id, username, email, fullName, role, active, createdAt, lastLogin
            FROM users
            ORDER BY createdAt DESC
        `, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        });
    }

    /**
     * Create user
     */
    async createUser(req, res) {
        const { username, password, email, fullName, role } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password, and email required' });
        }

        const hashedPassword = await bcrypt.hash(password, this.config.saltRounds);

        this.db.run(`
            INSERT INTO users (username, password, email, fullName, role)
            VALUES (?, ?, ?, ?, ?)
        `, [username, hashedPassword, email, fullName || '', role || 'viewer'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            this.logAudit(req.user.id, 'create_user', 'user', this.lastID, { username, email, role }, req.ip);

            res.status(201).json({
                id: this.lastID,
                username,
                email,
                fullName,
                role
            });
        }.bind(this));
    }

    /**
     * Update user
     */
    updateUser(req, res) {
        const { id } = req.params;
        const { email, fullName, role, active } = req.body;

        const updates = [];
        const params = [];

        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (fullName !== undefined) { updates.push('fullName = ?'); params.push(fullName); }
        if (role !== undefined) { updates.push('role = ?'); params.push(role); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }

        updates.push('updatedAt = CURRENT_TIMESTAMP');
        params.push(id);

        this.db.run(`
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            this.logAudit(req.user.id, 'update_user', 'user', id, req.body, req.ip);
            res.json({ message: 'User updated successfully' });
        });
    }

    /**
     * Delete user
     */
    deleteUser(req, res) {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        this.db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            this.logAudit(req.user.id, 'delete_user', 'user', id, null, req.ip);
            res.json({ message: 'User deleted successfully' });
        });
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Users can only change their own password unless admin
        if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Verify current password if changing own password
        if (parseInt(id) === req.user.id) {
            this.db.get('SELECT password FROM users WHERE id = ?', [id], async (err, user) => {
                if (err || !user) {
                    return res.status(500).json({ error: 'Database error' });
                }

                const match = await bcrypt.compare(currentPassword, user.password);
                if (!match) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }

                await this.updatePasswordHash(id, newPassword, req);
                res.json({ message: 'Password changed successfully' });
            });
        } else {
            // Admin changing another user's password
            await this.updatePasswordHash(id, newPassword, req);
            res.json({ message: 'Password changed successfully' });
        }
    }

    /**
     * Update password hash
     */
    async updatePasswordHash(userId, newPassword, req) {
        const hashedPassword = await bcrypt.hash(newPassword, this.config.saltRounds);

        this.db.run('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId], (err) => {
            if (err) {
                console.error('Error updating password:', err);
            } else {
                this.logAudit(req.user.id, 'change_password', 'user', userId, null, req.ip);
            }
        });
    }

    /**
     * Get flagged calls
     */
    getFlaggedCalls(req, res) {
        const { reviewed, severity, type, limit, offset } = req.query;

        let query = 'SELECT * FROM flagged_calls WHERE 1=1';
        const params = [];

        if (reviewed !== undefined) {
            query += ' AND reviewed = ?';
            params.push(reviewed === 'true' ? 1 : 0);
        }

        if (severity) {
            query += ' AND severity = ?';
            params.push(severity);
        }

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY flaggedAt DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        if (offset) {
            query += ' OFFSET ?';
            params.push(parseInt(offset));
        }

        this.db.all(query, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Parse JSON fields
            const calls = rows.map(row => ({
                ...row,
                keywords: row.keywords ? JSON.parse(row.keywords) : null
            }));

            res.json(calls);
        });
    }

    /**
     * Get single flagged call
     */
    getFlaggedCall(req, res) {
        const { id } = req.params;

        this.db.get('SELECT * FROM flagged_calls WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Flagged call not found' });
            }

            row.keywords = row.keywords ? JSON.parse(row.keywords) : null;
            res.json(row);
        });
    }

    /**
     * Add flagged call
     */
    addFlaggedCall(req, res) {
        const {
            callId, extension, callerName, callerNumber,
            startTime, endTime, duration,
            reason, severity, type,
            transcription, sentiment, keywords
        } = req.body;

        this.db.run(`
            INSERT INTO flagged_calls (
                callId, extension, callerName, callerNumber,
                startTime, endTime, duration,
                reason, severity, type,
                transcription, sentiment, keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            callId, extension, callerName, callerNumber,
            startTime, endTime, duration,
            reason, severity, type,
            transcription, sentiment, JSON.stringify(keywords)
        ], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Call already flagged' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({ id: this.lastID, message: 'Call flagged successfully' });
        });
    }

    /**
     * Review flagged call
     */
    reviewFlaggedCall(req, res) {
        const { id } = req.params;
        const { notes } = req.body;

        this.db.run(`
            UPDATE flagged_calls
            SET reviewed = 1,
                reviewedBy = ?,
                reviewedAt = CURRENT_TIMESTAMP,
                reviewNotes = ?
            WHERE id = ?
        `, [req.user.id, notes || '', id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            this.logAudit(req.user.id, 'review_flagged_call', 'flagged_call', id, { notes }, req.ip);
            res.json({ message: 'Call reviewed successfully' });
        });
    }

    /**
     * Get flagged call statistics
     */
    getFlaggedCallStats(req, res) {
        this.db.all(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN reviewed = 0 THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN reviewed = 1 THEN 1 ELSE 0 END) as reviewed,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_severity,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_severity,
                SUM(CASE WHEN type = 'abuse' THEN 1 ELSE 0 END) as abuse,
                SUM(CASE WHEN type = 'complaint' THEN 1 ELSE 0 END) as complaint,
                SUM(CASE WHEN type = 'escalation' THEN 1 ELSE 0 END) as escalation
            FROM flagged_calls
        `, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows[0]);
        });
    }

    /**
     * Get settings
     */
    getSettings(req, res) {
        this.db.all('SELECT * FROM settings ORDER BY category, key', (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Group by category
            const settings = {};
            rows.forEach(row => {
                if (!settings[row.category]) {
                    settings[row.category] = {};
                }
                settings[row.category][row.key] = row.value;
            });

            res.json(settings);
        });
    }

    /**
     * Get settings by category
     */
    getSettingsByCategory(req, res) {
        const { category } = req.params;

        this.db.all('SELECT * FROM settings WHERE category = ?', [category], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const settings = {};
            rows.forEach(row => {
                settings[row.key] = row.value;
            });

            res.json(settings);
        });
    }

    /**
     * Update setting
     */
    updateSetting(req, res) {
        const { category, key } = req.params;
        const { value } = req.body;

        this.db.run(`
            INSERT INTO settings (category, key, value, updatedBy)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(category, key) DO UPDATE SET
                value = excluded.value,
                updatedBy = excluded.updatedBy,
                updatedAt = CURRENT_TIMESTAMP
        `, [category, key, value, req.user.id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            this.logAudit(req.user.id, 'update_setting', 'setting', `${category}.${key}`, { value }, req.ip);
            res.json({ message: 'Setting updated successfully' });
        });
    }

    /**
     * Get reports
     */
    getReports(req, res) {
        this.db.all(`
            SELECT r.*, u.username as createdByUsername
            FROM reports r
            LEFT JOIN users u ON r.createdBy = u.id
            ORDER BY r.createdAt DESC
        `, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const reports = rows.map(row => ({
                ...row,
                filters: row.filters ? JSON.parse(row.filters) : null
            }));

            res.json(reports);
        });
    }

    /**
     * Create report
     */
    createReport(req, res) {
        const { name, type, description, filters } = req.body;

        this.db.run(`
            INSERT INTO reports (name, type, description, filters, createdBy)
            VALUES (?, ?, ?, ?, ?)
        `, [name, type, description || '', JSON.stringify(filters || {}), req.user.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({ id: this.lastID, message: 'Report created successfully' });
        });
    }

    /**
     * Get report
     */
    getReport(req, res) {
        const { id } = req.params;

        this.db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Report not found' });
            }

            row.filters = row.filters ? JSON.parse(row.filters) : null;
            res.json(row);
        });
    }

    /**
     * Delete report
     */
    deleteReport(req, res) {
        const { id } = req.params;

        this.db.run('DELETE FROM reports WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            this.logAudit(req.user.id, 'delete_report', 'report', id, null, req.ip);
            res.json({ message: 'Report deleted successfully' });
        });
    }

    /**
     * Generate report (placeholder - implement based on report type)
     */
    generateReport(req, res) {
        const { id } = req.params;

        // This would generate actual report data based on report type
        // For now, return placeholder
        res.json({
            reportId: id,
            generatedAt: new Date(),
            data: {},
            message: 'Report generation not yet implemented'
        });
    }

    /**
     * Get connection status
     */
    getStatus(req, res) {
        res.json({
            status: 'online',
            database: this.db ? 'connected' : 'disconnected',
            timestamp: new Date()
        });
    }

    /**
     * Get audit log
     */
    getAuditLog(req, res) {
        const { limit, offset } = req.query;

        let query = `
            SELECT a.*, u.username
            FROM audit_log a
            LEFT JOIN users u ON a.userId = u.id
            ORDER BY a.createdAt DESC
        `;

        const params = [];

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        if (offset) {
            query += ' OFFSET ?';
            params.push(parseInt(offset));
        }

        this.db.all(query, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const logs = rows.map(row => ({
                ...row,
                changes: row.changes ? JSON.parse(row.changes) : null
            }));

            res.json(logs);
        });
    }

    /**
     * Log audit entry
     */
    logAudit(userId, action, entity, entityId, changes, ipAddress, userAgent) {
        this.db.run(`
            INSERT INTO audit_log (userId, action, entity, entityId, changes, ipAddress, userAgent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, action, entity, entityId, JSON.stringify(changes), ipAddress, userAgent], (err) => {
            if (err) {
                console.error('Error logging audit:', err);
            }
        });
    }

    /**
     * Start server
     */
    start() {
        this.app.listen(this.config.port, () => {
            console.log(`Admin API server running on port ${this.config.port}`);
        });
    }

    /**
     * Stop server
     */
    stop() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Export for use as module
module.exports = AdminAPIServer;

// Run standalone if executed directly
if (require.main === module) {
    const server = new AdminAPIServer({
        port: process.env.PORT || 3001,
        jwtSecret: process.env.JWT_SECRET || 'change-this-secret-key',
        dbPath: process.env.DB_PATH || path.join(__dirname, '../data/wallboard.db')
    });

    server.start();
}
