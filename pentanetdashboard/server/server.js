/**
 * Pentanet 3CX Internal Dashboard - Main Server
 *
 * Integrates all backend services:
 * - Admin API (user management, settings, flagged calls)
 * - 3CX WebSocket proxy for real-time events
 * - Static file serving
 * - Authentication middleware
 * - Email alerts
 * - Report generation
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');

// Import services
const EmailService = require('./email-service');
const ReportGenerator = require('./report-generator');
const DemoDataGenerator = require('./demo-data-generator');
const EmergencyOverlays = require('./emergency-overlays');
const PerthSuburbs = require('./perth-suburbs');
const StatusMonitor = require('./status-monitor');
const DemoModeProtection = require('./demo-mode-protection');

// Configuration
const PORT = process.env.PORT || 8444;
const WEB_PORT = process.env.WEB_PORT || 8443;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/database/dashboard.db');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-generate-random-secret';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 3600000; // 60 minutes

// 3CX Configuration
const TCX_CONFIG = {
    fqdn: process.env.TCX_FQDN || 'pentanet.3cx.com.au',
    port: parseInt(process.env.TCX_PORT) || 5001,
    externalIP: process.env.TCX_EXTERNAL_IP || '175.45.85.203',
    internalIP: process.env.TCX_INTERNAL_IP || '10.71.80.223',
    version: process.env.TCX_VERSION || '20.0.7.1057'
};

console.log('🚀 Pentanet 3CX Dashboard Server Starting...');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   API Port: ${PORT}`);
console.log(`   Web Port: ${WEB_PORT}`);
console.log(`   3CX Server: ${TCX_CONFIG.fqdn}:${TCX_CONFIG.port}`);
console.log(`   Database: ${DB_PATH}`);

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: NODE_ENV === 'production'
        ? [`https://${TCX_CONFIG.fqdn}:${TCX_CONFIG.port}`]
        : '*',
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Apply demo mode protection middleware
if (demoProtection.enabled) {
    app.use(demoProtection.protectFileWrites());
}

// Request logging
app.use((req, res, next) => {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ${req.method} ${req.url}`);
    next();
});

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Initialize services
const emailService = new EmailService({
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    },
    alerts: {
        recipients: process.env.ALERT_RECIPIENTS ? process.env.ALERT_RECIPIENTS.split(',') : [],
        includeRecording: true,
        includeTranscript: true,
        includeSentiment: true
    }
}, db);

const reportGenerator = new ReportGenerator(db, {
    reportsDir: process.env.REPORTS_DIR || path.join(__dirname, '../data/reports'),
    branding: {
        companyName: 'Pentanet',
        contactEmail: process.env.ADMIN_EMAIL || 'stephen@pentanet.com.au'
    }
});

// Initialize demo mode protection
const demoProtection = new DemoModeProtection({
    enabled: process.env.DEMO_MODE === 'true',
    readOnlyPaths: [
        'data/database/dashboard-demo.db',
        '.env',
        'server.js'
    ],
    protectedSettings: [
        'tcx_api_credentials',
        'smtp_config',
        'jwt_secret'
    ],
    logFile: path.join(__dirname, '../data/demo-protection.log')
});

if (demoProtection.enabled) {
    console.log('🔒 Demo Mode Protection ENABLED');
    console.log('   - File writes: PROTECTED');
    console.log('   - Settings: READ-ONLY');
    console.log('   - Database: LIMITED WRITES');
}

// Initialize demo data generator (for demo mode)
let demoDataGenerator = null;
if (process.env.DEMO_MODE === 'true' || NODE_ENV === 'development') {
    demoDataGenerator = new DemoDataGenerator();
    console.log('📊 Demo mode enabled - live call data will be simulated');
}

// Initialize status monitor
const statusMonitor = new StatusMonitor({
    tcxFqdn: TCX_CONFIG.fqdn,
    tcxPort: TCX_CONFIG.port,
    tcxVersion: TCX_CONFIG.version,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    checkInterval: 60000 // Check every minute
});

// Start monitoring after a short delay
setTimeout(() => {
    statusMonitor.start();
}, 5000); // 5 second delay to allow server to fully initialize

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if token is expired (session timeout)
        const tokenAge = Date.now() - decoded.iat * 1000;
        if (tokenAge > SESSION_TIMEOUT) {
            return res.status(401).json({ error: 'Session expired' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const roleHierarchy = { viewer: 1, manager: 2, admin: 3 };
        const userLevel = roleHierarchy[req.user.role] || 0;
        const requiredLevel = roleHierarchy[role] || 999;

        if (userLevel < requiredLevel) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

function checkIPWhitelist(req, res, next) {
    // Skip IP check in development
    if (NODE_ENV === 'development') {
        return next();
    }

    // Get client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                  || req.headers['x-real-ip']
                  || req.connection.remoteAddress;

    // Check if whitelist is enabled
    db.get(
        `SELECT value FROM settings WHERE category = 'security' AND key = 'ip_whitelist_enabled'`,
        [],
        (err, row) => {
            if (err || !row || row.value !== 'true') {
                // Whitelist disabled, allow all
                return next();
            }

            // Check if IP is in whitelist
            db.get(
                `SELECT * FROM ip_whitelist WHERE ipAddress = ?`,
                [clientIP],
                (err, row) => {
                    if (err || !row) {
                        console.warn(`⚠️  Blocked access from non-whitelisted IP: ${clientIP}`);
                        return res.status(403).json({ error: 'Access denied' });
                    }
                    next();
                }
            );
        }
    );
}

// Audit logging helper
function logAudit(userId, action, entity, entityId, changes = {}, ipAddress = '') {
    db.run(
        `INSERT INTO audit_log (userId, action, entity, entityId, changes, ipAddress, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [userId, action, entity, entityId, JSON.stringify(changes), ipAddress],
        (err) => {
            if (err) console.error('Audit log error:', err);
        }
    );
}

// =====================================================
// API ROUTES - AUTHENTICATION
// =====================================================

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                  || req.headers['x-real-ip']
                  || req.connection.remoteAddress;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get(
        `SELECT * FROM users WHERE username = ? AND active = 1`,
        [username],
        async (err, user) => {
            if (err) {
                console.error('Login query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if account is locked
            if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
                return res.status(403).json({
                    error: 'Account locked',
                    lockedUntil: user.lockedUntil
                });
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                // Increment login attempts
                const newAttempts = (user.loginAttempts || 0) + 1;
                const shouldLock = newAttempts >= 5;

                db.run(
                    `UPDATE users SET loginAttempts = ?, lockedUntil = ? WHERE id = ?`,
                    [newAttempts, shouldLock ? moment().add(30, 'minutes').toISOString() : null, user.id]
                );

                logAudit(user.id, 'login_failed', 'user', user.id, {}, clientIP);

                return res.status(401).json({
                    error: 'Invalid credentials',
                    attemptsRemaining: shouldLock ? 0 : 5 - newAttempts
                });
            }

            // Check 2FA if required
            if (user.require2FA) {
                // TODO: Implement TOTP verification
                // For now, return that 2FA is required
                return res.status(403).json({
                    error: '2FA required',
                    userId: user.id,
                    require2FA: true
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    departments: JSON.parse(user.departments || '[]'),
                    permissions: JSON.parse(user.permissions || '{}')
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Update last login and reset attempts
            db.run(
                `UPDATE users SET lastLogin = datetime('now'), loginAttempts = 0, lockedUntil = NULL WHERE id = ?`,
                [user.id]
            );

            logAudit(user.id, 'login', 'user', user.id, {}, clientIP);

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    departments: JSON.parse(user.departments || '[]'),
                    permissions: JSON.parse(user.permissions || '{}')
                }
            });
        }
    );
});

// Verify token
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Logout
app.post('/api/auth/logout', verifyToken, (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                  || req.headers['x-real-ip']
                  || req.connection.remoteAddress;

    logAudit(req.user.id, 'logout', 'user', req.user.id, {}, clientIP);

    res.json({ success: true });
});

// =====================================================
// API ROUTES - USERS
// =====================================================

// Get all users (admin/manager only)
app.get('/api/users', verifyToken, requireRole('manager'), (req, res) => {
    const query = req.user.role === 'admin'
        ? `SELECT id, username, email, fullName, role, departments, permissions, active, require2FA, lastLogin, createdAt FROM users`
        : `SELECT id, username, email, fullName, role, departments, active, lastLogin FROM users WHERE role != 'admin'`;

    db.all(query, [], (err, users) => {
        if (err) {
            console.error('Get users error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Parse JSON fields
        users = users.map(u => ({
            ...u,
            departments: JSON.parse(u.departments || '[]'),
            permissions: u.permissions ? JSON.parse(u.permissions) : undefined
        }));

        res.json({ users });
    });
});

// Create user (admin only)
app.post('/api/users', verifyToken, requireRole('admin'), async (req, res) => {
    const { username, password, email, fullName, role, departments, permissions } = req.body;

    if (!username || !password || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO users (username, password, email, fullName, role, departments, permissions, active, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
        [
            username,
            hashedPassword,
            email,
            fullName || username,
            role,
            JSON.stringify(departments || []),
            JSON.stringify(permissions || {})
        ],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                console.error('Create user error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const userId = this.lastID;

            logAudit(req.user.id, 'create', 'user', userId, { username, email, role }, '');

            res.json({
                success: true,
                userId,
                user: { id: userId, username, email, fullName, role, departments, active: true }
            });
        }
    );
});

// Update user (admin only)
app.put('/api/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    // Build update query dynamically
    const allowedFields = ['email', 'fullName', 'role', 'departments', 'permissions', 'active', 'require2FA'];
    const updateFields = [];
    const values = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateFields.push(`${field} = ?`);

            if (field === 'departments' || field === 'permissions') {
                values.push(JSON.stringify(updates[field]));
            } else {
                values.push(updates[field]);
            }
        }
    }

    // Handle password change separately
    if (updates.password) {
        const hashedPassword = await bcrypt.hash(updates.password, 10);
        updateFields.push('password = ?');
        values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updatedAt = datetime(\'now\')');
    values.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Update user error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        logAudit(req.user.id, 'update', 'user', userId, updates, '');

        res.json({ success: true });
    });
});

// Delete user (admin only)
app.delete('/api/users/:id', verifyToken, requireRole('admin'), (req, res) => {
    const userId = req.params.id;

    // Prevent self-deletion
    if (userId == req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run(
        `DELETE FROM users WHERE id = ?`,
        [userId],
        function(err) {
            if (err) {
                console.error('Delete user error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            logAudit(req.user.id, 'delete', 'user', userId, {}, '');

            res.json({ success: true });
        }
    );
});

// =====================================================
// API ROUTES - FLAGGED CALLS
// =====================================================

// Get flagged calls (manager+)
app.get('/api/flagged-calls', verifyToken, requireRole('manager'), (req, res) => {
    const { severity, type, reviewed, startDate, endDate, limit = 100 } = req.query;

    // Use demo data if available
    if (demoDataGenerator) {
        const filters = {
            severity,
            type,
            status: reviewed === 'false' ? 'open' : reviewed === 'true' ? 'resolved' : undefined,
            startDate,
            endDate
        };
        const calls = demoDataGenerator.getFlaggedCalls(filters).slice(0, parseInt(limit));
        return res.json({ calls });
    }

    let query = `SELECT * FROM flagged_calls WHERE 1=1`;
    const params = [];

    if (severity) {
        query += ` AND severity = ?`;
        params.push(severity);
    }

    if (type) {
        query += ` AND type = ?`;
        params.push(type);
    }

    if (reviewed !== undefined) {
        query += ` AND reviewed = ?`;
        params.push(reviewed === 'true' ? 1 : 0);
    }

    if (startDate) {
        query += ` AND createdAt >= ?`;
        params.push(startDate);
    }

    if (endDate) {
        query += ` AND createdAt <= ?`;
        params.push(endDate);
    }

    query += ` ORDER BY createdAt DESC LIMIT ?`;
    params.push(parseInt(limit));

    db.all(query, params, (err, calls) => {
        if (err) {
            console.error('Get flagged calls error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Parse JSON fields
        calls = calls.map(call => ({
            ...call,
            sentiment: call.sentiment ? JSON.parse(call.sentiment) : null,
            keywords: call.keywords ? JSON.parse(call.keywords) : null
        }));

        res.json({ calls });
    });
});

// Add flagged call (system or admin)
app.post('/api/flagged-calls', verifyToken, (req, res) => {
    const { callId, extension, callerName, callerNumber, reason, severity, type, transcription, sentiment, keywords } = req.body;

    if (!callId || !severity || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
        `INSERT INTO flagged_calls (callId, extension, callerName, callerNumber, reason, severity, type, transcription, sentiment, keywords, reviewed, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
        [
            callId,
            extension,
            callerName,
            callerNumber,
            reason,
            severity,
            type,
            transcription,
            sentiment ? JSON.stringify(sentiment) : null,
            keywords ? JSON.stringify(keywords) : null
        ],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Call already flagged' });
                }
                console.error('Flag call error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const flagId = this.lastID;

            logAudit(req.user.id, 'create', 'flagged_call', flagId, { callId, severity, type }, '');

            // Send email alert if configured
            if (severity === 'high' || type === 'tio') {
                emailService.sendFlaggedCallAlert({
                    id: flagId,
                    callId,
                    extension,
                    callerName,
                    callerNumber,
                    reason,
                    severity,
                    type,
                    transcription,
                    sentiment: sentiment ? JSON.parse(JSON.stringify(sentiment)) : null,
                    keywords: keywords ? JSON.parse(JSON.stringify(keywords)) : null
                }).catch(err => console.error('Email alert error:', err));
            }

            res.json({ success: true, flagId });
        }
    );
});

// Review flagged call (manager+)
app.put('/api/flagged-calls/:id/review', verifyToken, requireRole('manager'), (req, res) => {
    const flagId = req.params.id;
    const { reviewed, reviewNotes } = req.body;

    db.run(
        `UPDATE flagged_calls SET reviewed = ?, reviewedBy = ?, reviewedAt = datetime('now'), reviewNotes = ? WHERE id = ?`,
        [reviewed ? 1 : 0, req.user.id, reviewNotes || null, flagId],
        function(err) {
            if (err) {
                console.error('Review call error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Flagged call not found' });
            }

            logAudit(req.user.id, 'review', 'flagged_call', flagId, { reviewed, reviewNotes }, '');

            res.json({ success: true });
        }
    );
});

// =====================================================
// API ROUTES - REPORTS
// =====================================================

// Generate PDF report
app.post('/api/reports/generate', verifyToken, requireRole('manager'), async (req, res) => {
    const { type, startDate, endDate, filters } = req.body;

    try {
        let reportPath;

        if (type === 'flagged-calls') {
            // Get flagged calls data
            const calls = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM flagged_calls WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC`,
                    [startDate, endDate],
                    (err, rows) => err ? reject(err) : resolve(rows)
                );
            });

            reportPath = await reportGenerator.generateFlaggedCallsReport(calls, {
                startDate,
                endDate,
                generatedBy: req.user.username
            });
        } else if (type === 'performance') {
            // TODO: Implement performance report
            return res.status(501).json({ error: 'Performance reports not yet implemented' });
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        logAudit(req.user.id, 'generate', 'report', type, { startDate, endDate }, '');

        res.json({
            success: true,
            reportPath,
            downloadUrl: `/api/reports/download/${path.basename(reportPath)}`
        });
    } catch (err) {
        console.error('Report generation error:', err);
        res.status(500).json({ error: 'Report generation failed' });
    }
});

// Download report
app.get('/api/reports/download/:filename', verifyToken, requireRole('manager'), (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.env.REPORTS_DIR || path.join(__dirname, '../data/reports'), filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.download(filepath);
});

// =====================================================
// API ROUTES - SETTINGS
// =====================================================

// Get settings (admin only)
app.get('/api/settings', verifyToken, requireRole('admin'), (req, res) => {
    const { category } = req.query;

    let query = `SELECT * FROM settings`;
    const params = [];

    if (category) {
        query += ` WHERE category = ?`;
        params.push(category);
    }

    db.all(query, params, (err, settings) => {
        if (err) {
            console.error('Get settings error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Convert to nested object
        const result = {};
        settings.forEach(s => {
            if (!result[s.category]) result[s.category] = {};
            result[s.category][s.key] = s.value;
        });

        res.json({ settings: result });
    });
});

// Update setting (admin only)
app.put('/api/settings', verifyToken, requireRole('admin'), (req, res) => {
    const { category, key, value } = req.body;

    if (!category || !key) {
        return res.status(400).json({ error: 'Category and key required' });
    }

    db.run(
        `INSERT OR REPLACE INTO settings (category, key, value) VALUES (?, ?, ?)`,
        [category, key, value],
        (err) => {
            if (err) {
                console.error('Update setting error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            logAudit(req.user.id, 'update', 'setting', `${category}.${key}`, { value }, '');

            res.json({ success: true });
        }
    );
});

// =====================================================
// API ROUTES - SYSTEM STATUS
// =====================================================

// Get system status
app.get('/api/status', verifyToken, (req, res) => {
    const status = {
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            env: NODE_ENV
        },
        database: {
            connected: db ? true : false,
            path: DB_PATH
        },
        threecx: {
            fqdn: TCX_CONFIG.fqdn,
            port: TCX_CONFIG.port,
            version: TCX_CONFIG.version
        }
    };

    res.json({ status });
});

// =====================================================
// API ROUTES - LIVE DEMO DATA
// =====================================================

// Get live dashboard data (demo mode)
app.get('/api/dashboard/live', (req, res) => {
    if (demoDataGenerator) {
        const data = demoDataGenerator.getDashboardData();
        res.json(data);
    } else {
        res.status(503).json({ error: 'Demo mode not enabled' });
    }
});

// Get queue statistics
app.get('/api/queues', (req, res) => {
    if (demoDataGenerator) {
        const data = demoDataGenerator.getDashboardData();
        res.json({ queues: data.queues });
    } else {
        res.status(503).json({ error: 'Demo mode not enabled' });
    }
});

// Get agent list
app.get('/api/agents', (req, res) => {
    if (demoDataGenerator) {
        const data = demoDataGenerator.getDashboardData();
        res.json({ agents: data.agents });
    } else {
        res.status(503).json({ error: 'Demo mode not enabled' });
    }
});

// Get active calls
app.get('/api/calls/active', (req, res) => {
    if (demoDataGenerator) {
        const data = demoDataGenerator.getDashboardData();
        res.json({ calls: data.activeCalls });
    } else {
        res.status(503).json({ error: 'Demo mode not enabled' });
    }
});

// Get recent calls
app.get('/api/calls/recent', (req, res) => {
    if (demoDataGenerator) {
        const data = demoDataGenerator.getDashboardData();
        res.json({ calls: data.recentCalls });
    } else {
        res.status(503).json({ error: 'Demo mode not enabled' });
    }
});

// Get emergency overlays data
app.get('/api/emergency-overlays', async (req, res) => {
    try {
        const overlays = await EmergencyOverlays.fetchAllFeeds();
        res.json(overlays);
    } catch (error) {
        console.error('Error fetching emergency overlays:', error);
        res.status(500).json({ error: 'Failed to fetch emergency overlays' });
    }
});

// Get emergency overlay layer metadata
app.get('/api/emergency-overlays/meta', (req, res) => {
    res.json(EmergencyOverlays.LAYER_META);
});

// ==============================================
// SYSTEM STATUS & MONITORING
// ===================================================

// Get comprehensive system status
app.get('/api/admin/status', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const status = statusMonitor.getStatus();

        // Add additional system info
        const systemInfo = {
            ...status,
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime(),
                env: NODE_ENV,
                demoMode: process.env.DEMO_MODE === 'true',
                ports: {
                    api: PORT,
                    web: WEB_PORT
                }
            }
        };

        res.json(systemInfo);
    } catch (error) {
        console.error('Error fetching system status:', error);
        res.status(500).json({ error: 'Failed to fetch system status' });
    }
});

// Force refresh all status checks
app.post('/api/admin/status/refresh', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await statusMonitor.checkAllServices();
        const status = statusMonitor.getStatus();
        res.json(status);
    } catch (error) {
        console.error('Error refreshing status:', error);
        res.status(500).json({ error: 'Failed to refresh status' });
    }
});

// Get specific service status
app.get('/api/admin/status/:service', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const service = statusMonitor.getService(req.params.service);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(service);
    } catch (error) {
        console.error('Error fetching service status:', error);
        res.status(500).json({ error: 'Failed to fetch service status' });
    }
});

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
    const status = statusMonitor.getStatus();

    res.status(status.overall === 'operational' ? 200 : 503).json({
        status: status.overall,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Get demo protection status
app.get('/api/admin/demo-protection', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const status = demoProtection.getStatus();
        const recentEvents = demoProtection.getRecentEvents(20);

        res.json({
            ...status,
            recentEvents
        });
    } catch (error) {
        console.error('Error fetching demo protection status:', error);
        res.status(500).json({ error: 'Failed to fetch demo protection status' });
    }
});

// Get Perth suburbs GeoJSON
app.get('/api/perth-suburbs', (req, res) => {
    try {
        const suburbs = PerthSuburbs.getAllSuburbsGeoJSON();
        res.json(suburbs);
    } catch (error) {
        console.error('Error fetching Perth suburbs:', error);
        res.status(500).json({ error: 'Failed to fetch Perth suburbs' });
    }
});

// Search suburbs by name
app.get('/api/perth-suburbs/search', (req, res) => {
    try {
        const query = req.query.q || '';
        const results = PerthSuburbs.searchSuburbs(query);
        res.json(results);
    } catch (error) {
        console.error('Error searching suburbs:', error);
        res.status(500).json({ error: 'Failed to search suburbs' });
    }
});

// Get suburbs within radius
app.get('/api/perth-suburbs/nearby', (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        const radius = parseFloat(req.query.radius) || 5;

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        const suburbs = PerthSuburbs.getSuburbsWithinRadius(lat, lon, radius);
        res.json(suburbs);
    } catch (error) {
        console.error('Error finding nearby suburbs:', error);
        res.status(500).json({ error: 'Failed to find nearby suburbs' });
    }
});

// Geocode address to coordinates
app.get('/api/geocode', (req, res) => {
    try {
        const suburb = req.query.suburb;
        if (!suburb) {
            return res.status(400).json({ error: 'Suburb name required' });
        }

        const center = PerthSuburbs.getSuburbCenter(suburb);
        if (!center) {
            return res.status(404).json({ error: 'Suburb not found' });
        }

        res.json(center);
    } catch (error) {
        console.error('Error geocoding:', error);
        res.status(500).json({ error: 'Failed to geocode address' });
    }
});

// =====================================================
// STATIC FILE SERVING
// =====================================================

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.url.startsWith('/api/')) {
        res.sendFile(path.join(publicPath, 'index.html'));
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// =====================================================
// START SERVER
// =====================================================

const server = http.createServer(app);

// Initialize WebSocket server for real-time updates
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    // Send initial connection success
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

    ws.on('message', (message) => {
        console.log('Received message:', message);
        // Handle WebSocket messages
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// Broadcast function for real-time updates
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Make broadcast available globally
global.broadcast = broadcast;

// Start server
server.listen(PORT, () => {
    console.log('');
    console.log('✅ Pentanet 3CX Dashboard Server Running');
    console.log('==========================================');
    console.log(`   API Server: http://localhost:${PORT}`);
    console.log(`   WebSocket:  ws://localhost:${PORT}/ws`);
    console.log(`   Public URL: https://${TCX_CONFIG.fqdn}:${TCX_CONFIG.port}/pentanet-dashboard`);
    console.log('==========================================');
    console.log('');

    // Start demo data generator if enabled
    if (demoDataGenerator) {
        demoDataGenerator.start();
        console.log('📊 Live demo call data generation started');
        console.log('');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (demoDataGenerator) demoDataGenerator.stop();
    server.close(() => {
        console.log('Server closed');
        db.close(() => {
            console.log('Database closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    if (demoDataGenerator) demoDataGenerator.stop();
    server.close(() => {
        console.log('Server closed');
        db.close(() => {
            console.log('Database closed');
            process.exit(0);
        });
    });
});
