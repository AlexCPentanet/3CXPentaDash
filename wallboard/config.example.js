/**
 * 3CX Wallboard Configuration
 *
 * Copy this file to config.js and update with your actual values
 */

window.WALLBOARD_CONFIG = {
    // 3CX Server Connection
    pbx: {
        fqdn: 'pentanet.3cx.com.au',  // Your 3CX FQDN (without https://)
        port: 5001,                     // API port (default: 5001)
        useSSL: true                    // Use HTTPS/WSS
    },

    // OAuth Credentials (from 3CX Integrations > API)
    auth: {
        clientId: 'client1wb',          // Your client ID
        clientSecret: 'YOUR_API_KEY_HERE', // Replace with actual API key
        tokenRefreshBuffer: 300         // Refresh token 5 minutes before expiry (seconds)
    },

    // API Endpoints to use
    endpoints: {
        // XAPI (Configuration API) endpoints
        xapi: {
            users: '/xapi/v1/Users',
            groups: '/xapi/v1/Groups',
            extensions: '/xapi/v1/PhoneExtensions',
            queues: '/xapi/v1/Groups?$filter=Type eq \'Queue\'',
            systemStatus: '/xapi/v1/SystemStatus'
        },

        // Call Control API endpoints
        callControl: {
            connections: '/callcontrol',
            websocket: '/callcontrol/ws'
        }
    },

    // Update intervals (milliseconds)
    refresh: {
        dashboard: 5000,        // Dashboard metrics refresh (5 seconds)
        statistics: 30000,      // Historical stats refresh (30 seconds)
        websocketPing: 30000    // WebSocket keepalive ping (30 seconds)
    },

    // Dashboard Settings
    dashboard: {
        maxSparklinePoints: 20,     // Number of data points in sparklines
        maxActivityItems: 10,        // Recent activity items to show
        sentimentHistoryPoints: 30,  // Sentiment trend chart points
        autoRefresh: true,           // Enable auto-refresh
        enableWebSocket: true,       // Use WebSocket for real-time updates
        enableNotifications: false   // Browser notifications for events
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

    // Theme Colors (Grafana-inspired)
    theme: {
        primary: '#3274d9',
        secondary: '#1f3b5e',
        accent: '#5794f2',
        background: '#0b0c0e',
        surface: '#141619',
        panel: '#181b1f',
        border: '#2f3338',
        success: '#73bf69',
        warning: '#ff9830',
        danger: '#f2495c',
        text: '#d8d9da',
        textMuted: '#9fa2a8'
    },

    // Branding
    branding: {
        companyName: 'Your Company',
        logoUrl: 'logo.png',         // Path to company logo
        primaryColor: '#3274d9',     // Override primary color
        accentColor: '#5794f2'       // Override accent color
    },

    // Demo Mode (for testing without API connection)
    demo: {
        enabled: false,              // Set to true to use simulated data
        simulateDelay: 1000,        // Simulated API delay (ms)
        randomizeData: true         // Randomize demo data
    },

    // Advanced Settings
    advanced: {
        enableDebugLogging: true,    // Console logging
        enableErrorReporting: true,  // Log errors to console
        maxRetryAttempts: 3,         // API retry attempts
        retryDelay: 2000,            // Delay between retries (ms)
        requestTimeout: 10000        // API request timeout (ms)
    }
};
