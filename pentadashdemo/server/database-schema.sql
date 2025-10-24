-- Pentanet Dashboard Database Schema
-- SQLite Database Structure

-- Users table (enhanced with 2FA and lockout)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    fullName TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    departments TEXT,
    permissions TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    require2FA INTEGER DEFAULT 0,
    twoFASecret TEXT,
    lastLogin DATETIME,
    loginAttempts INTEGER DEFAULT 0,
    lockedUntil DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flagged calls table
CREATE TABLE IF NOT EXISTS flagged_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    callId TEXT UNIQUE,
    extension TEXT,
    callerName TEXT,
    callerNumber TEXT,
    reason TEXT,
    severity TEXT NOT NULL,
    type TEXT NOT NULL,
    transcription TEXT,
    sentiment TEXT,
    keywords TEXT,
    reviewed INTEGER DEFAULT 0,
    reviewedBy INTEGER,
    reviewedAt DATETIME,
    reviewNotes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reviewedBy) REFERENCES users(id)
);

-- IP whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ipAddress TEXT NOT NULL,
    description TEXT,
    createdBy INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(createdBy) REFERENCES users(id)
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    updatedBy INTEGER,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key),
    FOREIGN KEY(updatedBy) REFERENCES users(id)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    action TEXT NOT NULL,
    entity TEXT,
    entityId TEXT,
    changes TEXT,
    ipAddress TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
);

-- Towers table (Pentanet infrastructure)
CREATE TABLE IF NOT EXISTS towers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    services TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    alert_radius REAL DEFAULT 5.0,
    active INTEGER DEFAULT 1,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tower incidents table (track impacts)
CREATE TABLE IF NOT EXISTS tower_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    towerId INTEGER NOT NULL,
    incidentType TEXT NOT NULL,
    incidentId TEXT,
    severity TEXT NOT NULL,
    description TEXT,
    distance REAL,
    notified INTEGER DEFAULT 0,
    resolvedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(towerId) REFERENCES towers(id)
);

-- Widgets configuration table
CREATE TABLE IF NOT EXISTS widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT,
    position TEXT,
    size TEXT,
    visible INTEGER DEFAULT 1,
    dashboardType TEXT DEFAULT 'public',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keywords table (for sentiment analysis)
CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT,
    active INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flagged_calls_severity ON flagged_calls(severity);
CREATE INDEX IF NOT EXISTS idx_flagged_calls_created ON flagged_calls(createdAt);
CREATE INDEX IF NOT EXISTS idx_flagged_calls_reviewed ON flagged_calls(reviewed);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(userId);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(createdAt);
CREATE INDEX IF NOT EXISTS idx_towers_active ON towers(active);
CREATE INDEX IF NOT EXISTS idx_tower_incidents_tower ON tower_incidents(towerId);
CREATE INDEX IF NOT EXISTS idx_tower_incidents_created ON tower_incidents(createdAt);
CREATE INDEX IF NOT EXISTS idx_keywords_severity ON keywords(severity);
CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(active);

-- Insert default settings
INSERT OR IGNORE INTO settings (category, key, value) VALUES
('system', 'dashboard_title', 'Pentanet Call Center Dashboard'),
('system', 'company_name', 'Pentanet'),
('system', 'session_timeout', '3600000'),
('system', 'setup_completed', 'false'),
('security', 'ip_whitelist_enabled', 'false'),
('security', 'require_2fa', 'false'),
('email', 'smtp_host', ''),
('email', 'smtp_port', '587'),
('email', 'smtp_username', ''),
('email', 'alert_recipients', '[]'),
('email', 'alert_high_severity', 'true'),
('email', 'alert_tio_mentions', 'true'),
('email', 'alert_tower_incidents', 'true'),
('email', 'weekly_report_enabled', 'true'),
('email', 'weekly_report_day', '1'),
('email', 'weekly_report_time', '09:00'),
('branding', 'primary_color', '#0052CC'),
('branding', 'secondary_color', '#00A3E0'),
('branding', 'success_color', '#00C48C'),
('branding', 'warning_color', '#FF9800'),
('branding', 'danger_color', '#F44336'),
('branding', 'accent_color', '#00D4FF'),
('map', 'default_center_lat', '-31.9505'),
('map', 'default_center_lon', '115.8605'),
('map', 'default_zoom', '10'),
('map', 'show_nbn_outages', 'true'),
('map', 'show_power_outages', 'true'),
('map', 'show_fire_incidents', 'true'),
('map', 'show_flood_incidents', 'true'),
('map', 'show_towers', 'true');

-- Insert default high severity keywords
INSERT OR IGNORE INTO keywords (keyword, severity, category, active) VALUES
('lawsuit', 'high', 'legal', 1),
('lawyer', 'high', 'legal', 1),
('attorney', 'high', 'legal', 1),
('legal action', 'high', 'legal', 1),
('sue', 'high', 'legal', 1),
('TIO', 'high', 'compliance', 1),
('telecommunications industry ombudsman', 'high', 'compliance', 1),
('ombudsman', 'high', 'compliance', 1),
('regulatory', 'high', 'compliance', 1);

-- Insert default medium severity keywords
INSERT OR IGNORE INTO keywords (keyword, severity, category, active) VALUES
('complaint', 'medium', 'negative', 1),
('frustrated', 'medium', 'negative', 1),
('disappointed', 'medium', 'negative', 1),
('manager', 'medium', 'escalation', 1),
('supervisor', 'medium', 'escalation', 1),
('escalate', 'medium', 'escalation', 1),
('refund', 'medium', 'financial', 1),
('cancel', 'medium', 'churn', 1),
('terrible', 'medium', 'negative', 1),
('awful', 'medium', 'negative', 1);

-- Insert default low severity keywords
INSERT OR IGNORE INTO keywords (keyword, severity, category, active) VALUES
('slow', 'low', 'quality', 1),
('expensive', 'low', 'pricing', 1),
('confusing', 'low', 'usability', 1),
('difficult', 'low', 'usability', 1);

-- Insert default positive keywords
INSERT OR IGNORE INTO keywords (keyword, severity, category, active) VALUES
('thank you', 'positive', 'positive', 1),
('excellent', 'positive', 'positive', 1),
('great', 'positive', 'positive', 1),
('appreciate', 'positive', 'positive', 1),
('helpful', 'positive', 'positive', 1),
('satisfied', 'positive', 'positive', 1),
('happy', 'positive', 'positive', 1);
