/**
 * 3CX Wallboard Configuration - Pentanet Systems
 *
 * System Information:
 * - Type: Enterprise Annual (24 Simultaneous Calls)
 * - Version: 20.0 Update 7 (Build 1057 Release)
 * - License Expires: Oct 17, 2026
 * - Partner: Aatrox Communications Limited
 * - Owner: stephen@pentanet.com.au
 */

window.WALLBOARD_CONFIG = {
    // 3CX Server Connection - Pentanet Configuration
    pbx: {
        fqdn: 'pentanet.3cx.com.au',
        port: 5001,                     // HTTPS port
        useSSL: true,                   // Always use SSL for production

        // Network configuration
        network: {
            staticIP: '175.45.85.203',
            sipPort: 5060,
            sipsPort: 5061,
            tunnelPort: 5090,
            mediaPortRange: '9000-10999',
            httpPort: 5000,
            httpsPort: 5001
        },

        // System details
        version: '20.0 Update 7',
        build: '1057',
        installType: 'On Premise',
        multiCompany: false,
        maxConcurrentCalls: 24
    },

    // OAuth Credentials (from 3CX Integrations > API)
    auth: {
        clientId: 'client1wb',
        clientSecret: 'hAIf3wp46naM8EWcvp9QEosJ54a9YLwr',
        tokenRefreshBuffer: 300
    },

    // API Endpoints
    endpoints: {
        xapi: {
            users: '/xapi/v1/Users',
            groups: '/xapi/v1/Groups',
            extensions: '/xapi/v1/PhoneExtensions',
            queues: '/xapi/v1/Groups?$filter=Type eq \'Queue\'',
            systemStatus: '/xapi/v1/SystemStatus',
            recordings: '/xapi/v1/Recordings'
        },
        callControl: {
            connections: '/callcontrol',
            websocket: '/callcontrol/ws'
        }
    },

    // Recording Configuration
    recordings: {
        temporaryLocation: '/var/lib/3cxpbx/Instance1/Data/Recordings',
        remoteStorage: {
            type: 'SMB',
            networkPath: 'smb://10.71.80.203',
            domain: 'PENTANET',
            username: 'svc.callrecordings',
            shareName: 'CallRecordings'
            // Password configured in admin panel
        }
    },

    // Trunk Configuration - Virtutel
    trunk: {
        name: 'Virtutel',
        provider: 'Generic SIP Trunk (IP Based)',
        registrar: 'sip.virtutel.com.au',
        mainNumber: '61861182115',
        whitelistIP: '175.45.85.203',

        // DID Numbers Configuration
        dids: [
            { number: '61861182116', name: 'Unassigned', type: 'unassigned' },
            { number: '61894662670', name: 'Main DID', assignedTo: 'Digital Receptionist (800 PentaAttendant)', type: 'digital_receptionist' },
            { number: '61894662671', name: 'Digital Receptionist', assignedTo: '841 MSP/Reseller', type: 'digital_receptionist' },
            { number: '61894662672', name: 'Investors DID', assignedTo: 'Queue (826 Investor Line)', type: 'queue' },
            { number: '61861182117', name: 'Temp DID #4', assignedTo: 'Queue (826 Investor Line)', type: 'queue' },
            { number: '61861096633', name: 'Temp DID #5', assignedTo: 'Queue (826 Investor Line)', type: 'queue' },
            { number: '61894662674', name: 'PentaHouse DiD', assignedTo: 'User (153 150 St George\'s Tce)', type: 'user' },
            { number: '61894662675', name: '24/7 NOC', assignedTo: 'Digital Receptionist (827 NOC Inside Business Hours)', type: 'digital_receptionist' },
            { number: '61894662676', name: 'neXus Phone DID', assignedTo: 'User (171 nexus phone)', type: 'user' },
            { number: '61894662673', name: 'Delivery Receiving DID', assignedTo: 'Ring Group (840 Delivery Receiving Group)', type: 'ring_group' }
        ]
    },

    // Update intervals (milliseconds)
    refresh: {
        dashboard: 5000,
        statistics: 30000,
        websocketPing: 30000
    },

    // Dashboard Settings
    dashboard: {
        maxSparklinePoints: 20,
        maxActivityItems: 10,
        sentimentHistoryPoints: 30,
        autoRefresh: true,
        enableWebSocket: true,
        enableNotifications: true,

        // Pentanet-specific settings
        showTrunkStatus: true,
        showDIDRouting: true,
        showRecordingStatus: true
    },

    // Date Range Presets
    dateRanges: {
        today: { label: 'Today', days: 0 },
        yesterday: { label: 'Yesterday', days: 1 },
        last7days: { label: 'Last 7 Days', days: 7 },
        last30days: { label: 'Last 30 Days', days: 30 },
        thisMonth: { label: 'This Month', type: 'month' },
        lastMonth: { label: 'Last Month', type: 'lastMonth' }
    },

    // Branding - Pentanet
    branding: {
        companyName: 'Pentanet',
        logoUrl: '/assets/pentanet-logo.png',
        faviconUrl: '/assets/favicon.ico',

        // Color scheme (can be customized in admin panel)
        colors: {
            primary: '#0052CC',          // Pentanet blue
            secondary: '#00A3E0',        // Light blue
            accent: '#00D4FF',           // Cyan
            success: '#00C48C',
            warning: '#FF9800',
            danger: '#F44336',
            background: '#0A0E14',
            surface: '#141B24',
            panel: '#1A2332',
            border: '#2D3748',
            text: '#E2E8F0',
            textMuted: '#A0AEC0'
        },

        // Custom styling
        customCSS: '/assets/pentanet-theme.css',

        // Footer
        footer: {
            text: '© 2025 Pentanet. Licensed by Aatrox Communications Limited',
            contactEmail: 'stephen@pentanet.com.au',
            supportPhone: '+61 8 9466 2670'
        }
    },

    // Email Configuration for Flagged Call Alerts
    email: {
        enabled: true,

        // SMTP Settings (configure in admin panel for security)
        smtp: {
            host: '',                    // e.g., 'smtp.gmail.com'
            port: 587,
            secure: false,               // true for 465, false for other ports
            auth: {
                user: '',                // Email account
                pass: ''                 // Email password (use app password)
            }
        },

        // Alert Configuration
        alerts: {
            // Who receives flagged call alerts
            recipients: [
                'stephen@pentanet.com.au',
                // Add more recipients as needed
            ],

            // When to send alerts
            triggers: {
                highSeverity: true,      // Send immediately for high severity
                mediumSeverity: true,    // Send for medium severity
                lowSeverity: false,      // Don't send for low severity
                batchLowSeverity: true,  // Send daily digest for low severity
            },

            // What to include in alerts
            includeRecording: true,      // Attach call recording (if available)
            includeTranscript: true,     // Include full transcription
            includeSentiment: true,      // Include sentiment analysis
            includeKeywords: true,       // Show detected keywords

            // Alert format
            subject: '[FLAGGED CALL] {severity} - {reason}',
            template: 'default',         // Can customize in admin panel

            // Digest settings
            dailyDigestTime: '09:00',    // Time to send daily digest (24h format)
            weeklyDigestDay: 'monday',   // Day for weekly digest
        }
    },

    // Sentiment Analysis Configuration
    sentiment: {
        enableRealTimeTranscription: false,  // Requires third-party API
        enableSentimentAnalysis: true,
        enableComplaintDetection: true,
        enableAbuseDetection: true,

        // Thresholds
        negativeThreshold: 0.3,
        abuseThreshold: 0.7,

        // Analysis intervals
        analysisInterval: 10000,

        // Third-party API integration (optional)
        transcriptionApi: null,          // e.g., Google Speech-to-Text, Azure
        sentimentApi: null               // e.g., AWS Comprehend, Azure Text Analytics
    },

    // Queue-specific Settings
    queues: {
        investorLine: {
            extension: '826',
            name: 'Investor Line',
            priority: 'high',
            slaTarget: 20,               // Answer within 20 seconds
            alertThreshold: 5            // Alert if more than 5 waiting
        },
        nocLine: {
            extension: '827',
            name: 'NOC Inside Business Hours',
            priority: 'high',
            slaTarget: 15,
            alertThreshold: 3
        },
        deliveryReceiving: {
            extension: '840',
            name: 'Delivery Receiving Group',
            priority: 'medium',
            slaTarget: 30,
            alertThreshold: 5
        }
    },

    // Demo Mode (for testing without API connection)
    demo: {
        enabled: false,
        simulateDelay: 1000,
        randomizeData: true
    },

    // Advanced Settings
    advanced: {
        enableDebugLogging: true,
        enableErrorReporting: true,
        maxRetryAttempts: 3,
        retryDelay: 2000,
        requestTimeout: 10000,

        // Performance settings
        maxConcurrentRequests: 5,
        cacheTimeout: 60000,             // Cache data for 60 seconds

        // Security
        enforceHTTPS: true,
        validateSSLCertificates: true
    },

    // License Information (read-only, displayed in admin panel)
    license: {
        type: 'Enterprise Annual',
        simultaneousCalls: 24,
        expiryDate: '2026-10-17',
        partner: 'Aatrox Communications Limited',
        owner: 'stephen@pentanet.com.au',
        licensed: true
    }
};

// Environment-specific overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development mode
    window.WALLBOARD_CONFIG.advanced.enableDebugLogging = true;
    window.WALLBOARD_CONFIG.pbx.useSSL = true; // Still use SSL for API calls
    window.WALLBOARD_CONFIG.advanced.enforceHTTPS = false;
}

// Validate configuration on load
(function validateConfig() {
    const config = window.WALLBOARD_CONFIG;

    if (!config.auth.clientId || !config.auth.clientSecret) {
        console.error('⚠️ API credentials not configured! Please update config.js');
    }

    if (!config.pbx.fqdn) {
        console.error('⚠️ 3CX FQDN not configured!');
    }

    if (config.email.enabled && (!config.email.smtp.host || !config.email.smtp.auth.user)) {
        console.warn('⚠️ Email alerts enabled but SMTP not configured. Configure in admin panel.');
    }

    // Check license expiry
    const expiryDate = new Date(config.license.expiryDate);
    const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 30) {
        console.warn(`⚠️ License expires in ${daysUntilExpiry} days (${config.license.expiryDate})`);
    }

    console.log('✓ Wallboard configuration loaded for Pentanet');
    console.log(`✓ 3CX Version: ${config.pbx.version} (Build ${config.pbx.build})`);
    console.log(`✓ Max Concurrent Calls: ${config.pbx.maxConcurrentCalls}`);
})();
