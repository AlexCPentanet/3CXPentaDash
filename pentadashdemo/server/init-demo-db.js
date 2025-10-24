/**
 * Demo Database Initialization Script
 * Populates the demo database with sample data for UI QC and review
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/database/dashboard-demo.db');

console.log('🎬 Initializing Pentadash Demo Database...');
console.log(`   Database: ${DB_PATH}`);

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Read schema file
const schemaPath = path.join(__dirname, 'database-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Initialize schema
db.exec(schema, async (err) => {
    if (err) {
        console.error('❌ Schema creation failed:', err);
        process.exit(1);
    }
    console.log('✅ Database schema created');

    // Insert demo users
    await insertDemoUsers();

    // Insert demo towers
    await insertDemoTowers();

    // Insert demo flagged calls
    await insertDemoFlaggedCalls();

    // Update settings for demo
    await updateDemoSettings();

    console.log('');
    console.log('🎉 Demo database initialized successfully!');
    console.log('');

    db.close();
});

// Insert demo users
function insertDemoUsers() {
    return new Promise((resolve, reject) => {
        console.log('👥 Creating demo user accounts...');

        const users = [
            {
                username: 'admin',
                password: 'Admin123!',
                email: 'admin@pentanet.com.au',
                fullName: 'Admin User',
                role: 'admin'
            },
            {
                username: 'manager',
                password: 'Manager123!',
                email: 'manager@pentanet.com.au',
                fullName: 'Manager User',
                role: 'manager'
            },
            {
                username: 'viewer',
                password: 'Viewer123!',
                email: 'viewer@pentanet.com.au',
                fullName: 'Viewer User',
                role: 'viewer'
            },
            {
                username: 'qc',
                password: 'QC123!',
                email: 'qc@pentanet.com.au',
                fullName: 'QC Reviewer',
                role: 'admin'
            },
            {
                username: 'demo',
                password: 'Demo123!',
                email: 'demo@pentanet.com.au',
                fullName: 'Demo User',
                role: 'manager'
            }
        ];

        let completed = 0;

        users.forEach(user => {
            bcrypt.hash(user.password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.run(
                    `INSERT INTO users (username, password, email, fullName, role, active)
                     VALUES (?, ?, ?, ?, ?, 1)`,
                    [user.username, hash, user.email, user.fullName, user.role],
                    (err) => {
                        if (err && !err.message.includes('UNIQUE')) {
                            console.error(`   ❌ Failed to create user ${user.username}:`, err.message);
                        } else {
                            console.log(`   ✅ User created: ${user.username} (${user.role})`);
                        }

                        completed++;
                        if (completed === users.length) {
                            resolve();
                        }
                    }
                );
            });
        });
    });
}

// Insert demo towers (Pentanet locations in Perth)
function insertDemoTowers() {
    return new Promise((resolve, reject) => {
        console.log('🗼 Adding demo tower locations...');

        const towers = [
            {
                name: 'Perth CBD Tower',
                services: JSON.stringify(['Fiber', '5G', 'Fixed Wireless']),
                latitude: -31.9505,
                longitude: 115.8605,
                address: '123 St Georges Terrace, Perth WA 6000',
                alert_radius: 5.0
            },
            {
                name: 'Fremantle Tower',
                services: JSON.stringify(['Fixed Wireless', '4G', '5G']),
                latitude: -32.0569,
                longitude: 115.7439,
                address: '45 Market Street, Fremantle WA 6160',
                alert_radius: 8.0
            },
            {
                name: 'Joondalup Tower',
                services: JSON.stringify(['5G', 'Fixed Wireless']),
                latitude: -31.7448,
                longitude: 115.7661,
                address: '102 Grand Boulevard, Joondalup WA 6027',
                alert_radius: 6.0
            },
            {
                name: 'Morley Tower',
                services: JSON.stringify(['Fiber', '4G', '5G']),
                latitude: -31.8899,
                longitude: 115.9051,
                address: '15 Russell Street, Morley WA 6062',
                alert_radius: 5.0
            },
            {
                name: 'Rockingham Tower',
                services: JSON.stringify(['Fixed Wireless', '5G']),
                latitude: -32.2769,
                longitude: 115.7308,
                address: '7 Council Avenue, Rockingham WA 6168',
                alert_radius: 7.0
            },
            {
                name: 'Midland Tower',
                services: JSON.stringify(['Fiber', 'Fixed Wireless', '4G']),
                latitude: -31.8889,
                longitude: 116.0147,
                address: '20 The Crescent, Midland WA 6056',
                alert_radius: 6.0
            },
            {
                name: 'Armadale Tower',
                services: JSON.stringify(['Fixed Wireless', '4G']),
                latitude: -32.1497,
                longitude: 116.0107,
                address: '55 Jull Street, Armadale WA 6112',
                alert_radius: 5.5
            },
            {
                name: 'Scarborough Tower',
                services: JSON.stringify(['5G', 'Fixed Wireless']),
                latitude: -31.8946,
                longitude: 115.7606,
                address: '148 The Esplanade, Scarborough WA 6019',
                alert_radius: 4.5
            }
        ];

        let completed = 0;

        towers.forEach(tower => {
            db.run(
                `INSERT INTO towers (name, services, latitude, longitude, address, alert_radius, active)
                 VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [tower.name, tower.services, tower.latitude, tower.longitude, tower.address, tower.alert_radius],
                (err) => {
                    if (err && !err.message.includes('UNIQUE')) {
                        console.error(`   ❌ Failed to add tower ${tower.name}:`, err.message);
                    } else {
                        console.log(`   ✅ Tower added: ${tower.name}`);
                    }

                    completed++;
                    if (completed === towers.length) {
                        resolve();
                    }
                }
            );
        });
    });
}

// Insert demo flagged calls
function insertDemoFlaggedCalls() {
    return new Promise((resolve, reject) => {
        console.log('📞 Adding demo flagged calls...');

        const flaggedCalls = [
            {
                callId: 'DEMO-001',
                extension: '101',
                callerName: 'John Smith',
                callerNumber: '+61412345678',
                reason: 'TIO mention detected',
                severity: 'high',
                type: 'compliance',
                transcription: 'If this issue is not resolved, I will be contacting the TIO.',
                sentiment: 'negative',
                keywords: JSON.stringify(['TIO', 'issue', 'resolved'])
            },
            {
                callId: 'DEMO-002',
                extension: '102',
                callerName: 'Sarah Johnson',
                callerNumber: '+61423456789',
                reason: 'Legal threat detected',
                severity: 'high',
                type: 'legal',
                transcription: 'I am very disappointed and will speak to my lawyer about this.',
                sentiment: 'negative',
                keywords: JSON.stringify(['lawyer', 'disappointed'])
            },
            {
                callId: 'DEMO-003',
                extension: '103',
                callerName: 'Mike Brown',
                callerNumber: '+61434567890',
                reason: 'Escalation request',
                severity: 'medium',
                type: 'escalation',
                transcription: 'This is frustrating. I need to speak to a manager please.',
                sentiment: 'negative',
                keywords: JSON.stringify(['frustrating', 'manager'])
            },
            {
                callId: 'DEMO-004',
                extension: '101',
                callerName: 'Emma Wilson',
                callerNumber: '+61445678901',
                reason: 'Cancellation intent',
                severity: 'medium',
                type: 'churn',
                transcription: 'I want to cancel my service and get a refund.',
                sentiment: 'negative',
                keywords: JSON.stringify(['cancel', 'refund'])
            },
            {
                callId: 'DEMO-005',
                extension: '104',
                callerName: 'David Lee',
                callerNumber: '+61456789012',
                reason: 'Positive feedback',
                severity: 'positive',
                type: 'positive',
                transcription: 'Thank you so much! Your service is excellent and the agent was very helpful.',
                sentiment: 'positive',
                keywords: JSON.stringify(['thank you', 'excellent', 'helpful'])
            }
        ];

        let completed = 0;

        flaggedCalls.forEach(call => {
            db.run(
                `INSERT INTO flagged_calls (callId, extension, callerName, callerNumber, reason, severity, type, transcription, sentiment, keywords, reviewed)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [call.callId, call.extension, call.callerName, call.callerNumber, call.reason, call.severity, call.type, call.transcription, call.sentiment, call.keywords],
                (err) => {
                    if (err && !err.message.includes('UNIQUE')) {
                        console.error(`   ❌ Failed to add flagged call ${call.callId}:`, err.message);
                    } else {
                        console.log(`   ✅ Flagged call added: ${call.callId} (${call.severity})`);
                    }

                    completed++;
                    if (completed === flaggedCalls.length) {
                        resolve();
                    }
                }
            );
        });
    });
}

// Update settings for demo
function updateDemoSettings() {
    return new Promise((resolve, reject) => {
        console.log('⚙️  Updating demo settings...');

        const settings = [
            { category: 'system', key: 'setup_completed', value: 'true' },
            { category: 'system', key: 'dashboard_title', value: 'Pentadash Demo - UI QC Review' },
            { category: 'system', key: 'demo_mode', value: 'true' },
            { category: 'branding', key: 'primary_color', value: '#0052CC' },
            { category: 'branding', key: 'secondary_color', value: '#00A3E0' }
        ];

        let completed = 0;

        settings.forEach(setting => {
            db.run(
                `INSERT OR REPLACE INTO settings (category, key, value) VALUES (?, ?, ?)`,
                [setting.category, setting.key, setting.value],
                (err) => {
                    if (err) {
                        console.error(`   ❌ Failed to update setting ${setting.key}:`, err.message);
                    }

                    completed++;
                    if (completed === settings.length) {
                        console.log(`   ✅ Settings updated`);
                        resolve();
                    }
                }
            );
        });
    });
}
