// 3CX Wallboard Configuration
// Customize this file to match your 3CX setup and branding requirements

window.WALLBOARD_CONFIG = {
    // 3CX Configuration API (XAPI) - OAuth 2.0 Client Credentials
    // Base URL: Your 3CX server address (HTTPS required)
    // For local development with CORS proxy, use: 'http://localhost:8080'
    // For production deployment on same server as 3CX, use: 'https://pentanet.3cx.com.au:5001'
    apiUrl: 'http://localhost:8080',  // Using CORS proxy for local development

    // Service Principal Credentials (from 3CX Admin Console > Integrations > API)
    // Client ID: The DN/Client ID you specified when creating the API integration
    // Client Secret: The API Key shown once after creating the integration
    clientId: 'client1wb',
    clientSecret: 'hAIf3wp46naM8EWcvp9QEosJ54a9YLwr',

    // Authentication method: 'xapi' (3CX Configuration API with OAuth 2.0)
    authMethod: 'xapi',

    // Update interval in milliseconds (default: 3000ms = 3 seconds)
    updateInterval: 3000,

    // Branding Configuration
    branding: {
        // Company name to display in header
        title: 'Call Centre Dashboard',

        // Path to company logo (relative or absolute URL)
        // Recommended size: max 200px width, 60px height
        logo: 'logo.png',

        // Custom color scheme (use hex codes or CSS color values)
        primaryColor: '#2563eb',    // Main header color
        secondaryColor: '#1e40af',  // Secondary header color
        accentColor: '#3b82f6'      // Accent color for highlights
    },

    // Service Level Agreement (SLA) Configuration
    sla: {
        // Service level target percentage (e.g., 80 for 80%)
        targetPercentage: 80,

        // Target answer time in seconds (e.g., 20 for 20 seconds)
        targetAnswerTime: 20
    },

    // Sentiment Analysis Configuration
    sentiment: {
        // Enable/disable sentiment analysis feature
        enabled: true,

        // Number of recent sentiment items to display
        recentItemsCount: 5,

        // Sentiment analysis API endpoint (if using external service)
        // Leave empty to use built-in demo sentiment analysis
        apiEndpoint: ''
    },

    // Display Configuration
    display: {
        // Show/hide specific sections
        showKPIs: true,
        showActiveCalls: true,
        showAgentStatus: true,
        showQueueStats: true,
        showSentiment: true,

        // Maximum number of active calls to display
        maxActiveCallsDisplay: 20,

        // Auto-hide cursor after inactivity (in milliseconds, 0 to disable)
        autoHideCursor: 5000
    },

    // Queue Configuration
    // Specify which queues to monitor (empty array = all queues)
    queues: [],
    // Example: ['Sales', 'Support', 'Technical']

    // Agent Configuration
    // Specify which agent extensions to display (empty array = all agents)
    agents: [],
    // Example: ['100', '101', '102', '103']

    // 3CX Configuration API (XAPI) Endpoints
    // Standard XAPI v1 endpoints - do not modify unless using custom implementation
    endpoints: {
        // XAPI OData endpoints
        quickTest: '/xapi/v1/Defs?$select=Id',                    // Validate authentication
        extensions: '/xapi/v1/PhoneExtensions',                   // Get extensions/agents
        queues: '/xapi/v1/Groups',                                 // Get call queues/groups
        callLog: '/xapi/v1/CallLogRecords',                       // Get call history
        activeConnections: '/xapi/v1/ActiveConnections',          // Get active calls (live data)
        systemStatus: '/xapi/v1/SystemStatus'                     // Get system metrics
    }
};

// Demo Mode Configuration
// Set to true to use demo data instead of connecting to 3CX API
// Useful for testing and development
// NOTE: Currently using DEMO MODE because XAPI endpoints return 404
// This indicates 3CX Configuration API may not be available or endpoints are different
window.DEMO_MODE = true;

// Advanced: Custom Theme Variables
// You can override any CSS custom property here
function applyCustomTheme() {
    const root = document.documentElement;

    // Uncomment and modify these to override default theme
    // root.style.setProperty('--background-color', '#0f172a');
    // root.style.setProperty('--surface-color', '#1e293b');
    // root.style.setProperty('--text-primary', '#f8fafc');
    // root.style.setProperty('--success-color', '#22c55e');
    // root.style.setProperty('--warning-color', '#f59e0b');
    // root.style.setProperty('--danger-color', '#ef4444');
}

// Apply custom theme on load
document.addEventListener('DOMContentLoaded', applyCustomTheme);

// Auto-hide cursor feature
if (window.WALLBOARD_CONFIG.display.autoHideCursor > 0) {
    let cursorTimeout;

    document.addEventListener('mousemove', () => {
        document.body.style.cursor = 'default';
        clearTimeout(cursorTimeout);

        cursorTimeout = setTimeout(() => {
            document.body.style.cursor = 'none';
        }, window.WALLBOARD_CONFIG.display.autoHideCursor);
    });
}
