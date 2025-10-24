/**
 * Demo Mode Protection
 * Prevents production updates from affecting demo environment
 */

const fs = require('fs');
const path = require('path');

class DemoModeProtection {
    constructor(config = {}) {
        this.enabled = config.enabled || false;
        this.readOnlyPaths = config.readOnlyPaths || [];
        this.protectedSettings = config.protectedSettings || [];
        this.logFile = config.logFile || path.join(__dirname, '../data/demo-protection.log');
    }

    /**
     * Check if a file path is protected
     */
    isProtected(filePath) {
        if (!this.enabled) return false;

        return this.readOnlyPaths.some(protectedPath => {
            return filePath.includes(protectedPath);
        });
    }

    /**
     * Check if a setting is protected
     */
    isSettingProtected(settingKey) {
        if (!this.enabled) return false;

        return this.protectedSettings.includes(settingKey);
    }

    /**
     * Log protection event
     */
    log(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details
        };

        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write protection log:', error);
        }
    }

    /**
     * Express middleware to protect file writes
     */
    protectFileWrites() {
        return (req, res, next) => {
            if (!this.enabled) return next();

            // Check if request involves file modification
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                const protectedRoutes = [
                    '/api/settings',
                    '/api/admin/branding',
                    '/api/admin/config'
                ];

                if (protectedRoutes.some(route => req.path.startsWith(route))) {
                    this.log('blocked_request', {
                        method: req.method,
                        path: req.path,
                        ip: req.ip,
                        user: req.user?.username
                    });

                    return res.status(403).json({
                        error: 'Demo Mode Active',
                        message: 'This operation is disabled in demo mode to protect the demonstration environment',
                        demoMode: true
                    });
                }
            }

            next();
        };
    }

    /**
     * Protect database writes
     */
    protectDatabaseWrites(allowedTables = []) {
        return (query, params) => {
            if (!this.enabled) return true;

            // Extract table name from query
            const tableMatch = query.match(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+(\w+)/i);

            if (tableMatch) {
                const tableName = tableMatch[1];

                // Protected tables
                const protectedTables = ['settings', 'users', 'ip_whitelist'];

                if (protectedTables.includes(tableName) && !allowedTables.includes(tableName)) {
                    this.log('blocked_db_write', {
                        table: tableName,
                        query: query.substring(0, 100)
                    });

                    return false;
                }
            }

            return true;
        };
    }

    /**
     * Create a demo-safe wrapper for database operations
     */
    wrapDatabase(db) {
        if (!this.enabled) return db;

        const self = this;

        return {
            ...db,
            run(sql, params, callback) {
                // Allow certain operations
                const allowedPatterns = [
                    /^INSERT INTO flagged_calls/i,
                    /^INSERT INTO calls/i,
                    /^INSERT INTO audit_log/i,
                    /^UPDATE users SET lastLogin/i
                ];

                const isAllowed = allowedPatterns.some(pattern => pattern.test(sql));

                if (!isAllowed && /^(INSERT|UPDATE|DELETE)/i.test(sql)) {
                    self.log('blocked_db_operation', {
                        sql: sql.substring(0, 100)
                    });

                    console.warn('⚠️  Demo Mode: Blocked database write operation');

                    if (callback) {
                        callback(new Error('Operation not allowed in demo mode'));
                    }
                    return this;
                }

                return db.run.call(db, sql, params, callback);
            },
            get: db.get.bind(db),
            all: db.all.bind(db),
            each: db.each.bind(db),
            prepare: db.prepare.bind(db),
            close: db.close.bind(db)
        };
    }

    /**
     * Get protection status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            protectedPathsCount: this.readOnlyPaths.length,
            protectedSettingsCount: this.protectedSettings.length,
            logFile: this.logFile
        };
    }

    /**
     * Get recent protection events
     */
    getRecentEvents(limit = 50) {
        try {
            if (!fs.existsSync(this.logFile)) {
                return [];
            }

            const logContent = fs.readFileSync(this.logFile, 'utf8');
            const lines = logContent.trim().split('\n');
            const events = lines.slice(-limit).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean);

            return events.reverse();
        } catch (error) {
            console.error('Failed to read protection log:', error);
            return [];
        }
    }
}

module.exports = DemoModeProtection;
