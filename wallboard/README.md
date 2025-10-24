# 3CX V20 Real-Time Wallboard

A professional, real-time call center wallboard for 3CX V20 Update 7 with WebSocket support, advanced visualizations, and modular architecture.

## Features

### Real-Time Updates
- **WebSocket Integration** - Live call events without polling
- **Sub-second Latency** - Instant updates for call status changes
- **Auto-Reconnection** - Resilient WebSocket with exponential backoff
- **Automatic Token Refresh** - Seamless authentication management

### Advanced Visualizations
- **Interactive Charts** - Powered by Chart.js with animations
- **Sparklines** - Trend indicators on all KPI cards
- **Sentiment Analysis** - Real-time call quality metrics
- **Heat Maps** - Agent performance visualization
- **Time Series Graphs** - Historical data with zoom/pan

### Date Range Filtering
- **Flexible Ranges** - Today, Yesterday, Last 7/30 days, This Month, Last Month
- **Custom Range Picker** - Select any date range
- **Comparison Mode** - Compare current vs previous period
- **Real-time vs Historical** - Switch between live and historical views

### Dashboard Components
1. **KPI Cards** - Active Calls, Waiting, Available Agents, Avg Wait Time, SLA%, Abandonment Rate
2. **Agent Panel** - Real-time status, call counts, handling time, sentiment scores
3. **Queue Monitor** - Multi-queue stats with priority indicators
4. **Activity Feed** - Live call events stream
5. **Performance Charts** - Call volume, wait times, agent productivity
6. **Sentiment Meter** - Call quality distribution and trends

### Modular Architecture
```
wallboard/
├── index.html              # Main dashboard
├── config.example.js       # Configuration template
├── config.js               # Your actual config (gitignored)
├── js/
│   ├── api-client.js       # 3CX API client with auth
│   ├── websocket-client.js # WebSocket event handler
│   ├── data-service.js     # Data aggregation layer
│   ├── chart-manager.js    # Chart.js wrapper
│   ├── dashboard.js        # Main dashboard controller
│   └── utils.js            # Utility functions
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── theme.css           # Theme variables
│   └── responsive.css      # Mobile responsiveness
├── deploy/
│   ├── install.sh          # Linux installation script
│   ├── uninstall.sh        # Clean removal script
│   ├── update.sh           # Update script
│   └── nginx.conf.example  # Nginx configuration
└── docs/
    ├── INSTALLATION.md     # Setup instructions
    ├── CONFIGURATION.md    # Configuration guide
    └── API_REFERENCE.md    # API documentation
```

## Quick Start

### 1. Prerequisites
- 3CX V20 Update 7 or later
- Service Principal with Call Control API access
- Web server (Nginx, Apache, or Node.js)

### 2. Installation

```bash
# Clone or download to your web server
cd /var/www/html
mkdir wallboard
cd wallboard

# Copy configuration
cp config.example.js config.js

# Edit configuration with your 3CX details
nano config.js
```

### 3. Configuration

Edit `config.js`:

```javascript
window.WALLBOARD_CONFIG = {
    pbx: {
        fqdn: 'your-pbx.3cx.com.au',
        port: 5001,
        useSSL: true
    },
    auth: {
        clientId: 'your-client-id',
        clientSecret: 'your-api-key'
    }
};
```

### 4. Create Service Principal in 3CX

1. Login to **3CX Web Client** as admin
2. Go to **Integrations > API**
3. Click **Add**
4. Configure:
   - **Client ID**: Choose an available extension (e.g., 900)
   - **Name**: Wallboard Integration
   - ✅ **3CX Configuration API Access**
   - ✅ **3CX Call Control API Access**
   - **Department**: System Wide
   - **Role**: System Owner
5. **Save** and copy the API Key to `config.js`

### 5. Access Wallboard

Open in browser:
```
https://your-server/wallboard/
```

## Linux On-Premise Deployment

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name wallboard.yourdomain.com;

    ssl_certificate /etc/ssl/certs/wallboard.crt;
    ssl_certificate_key /etc/ssl/private/wallboard.key;

    root /var/www/html/wallboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Install Script

```bash
cd wallboard/deploy
chmod +x install.sh
sudo ./install.sh
```

The install script:
- Copies files to `/var/www/html/wallboard`
- Sets proper permissions
- Creates nginx configuration
- Enables and starts nginx
- Creates systemd service (optional)

### Uninstall Script

```bash
cd wallboard/deploy
chmod +x uninstall.sh
sudo ./uninstall.sh
```

Cleanly removes all wallboard files without affecting 3CX.

## Architecture

### Data Flow

```
┌─────────────────┐
│  3CX PBX Server │
└────────┬────────┘
         │
         │ OAuth 2.0
         │ REST API
         │ WebSocket
         │
    ┌────▼─────┐
    │ API      │
    │ Client   │
    └────┬─────┘
         │
    ┌────▼────────┐
    │ WebSocket   │
    │ Client      │
    └────┬────────┘
         │
    ┌────▼─────────┐
    │ Data Service │
    │ (Aggregation)│
    └────┬─────────┘
         │
    ┌────▼──────────┐
    │ Chart Manager │
    │ (Visualization)│
    └────┬──────────┘
         │
    ┌────▼────────┐
    │  Dashboard  │
    │  Controller │
    └────┬────────┘
         │
    ┌────▼────┐
    │   UI    │
    └─────────┘
```

### Real-Time Updates

1. **WebSocket Connection** - Established on page load
2. **Event Subscription** - Listens for call events
3. **Event Processing** - Data service aggregates metrics
4. **UI Update** - Charts and counters updated in real-time
5. **Auto-Reconnect** - Handles disconnections gracefully

### Authentication Flow

1. **Initial Auth** - OAuth 2.0 client credentials flow
2. **Token Storage** - In-memory (never localStorage for security)
3. **Auto-Refresh** - Refreshes 5 minutes before expiry
4. **Token Injection** - Added to all API and WS requests

## Configuration Options

### Dashboard Settings

```javascript
dashboard: {
    maxSparklinePoints: 20,      // Sparkline data points
    maxActivityItems: 10,         // Recent activity items
    sentimentHistoryPoints: 30,   // Sentiment trend points
    autoRefresh: true,            // Enable auto-refresh
    enableWebSocket: true,        // Use WebSocket
    enableNotifications: false    // Browser notifications
}
```

### Update Intervals

```javascript
refresh: {
    dashboard: 5000,      // Dashboard refresh (ms)
    statistics: 30000,    // Historical stats (ms)
    websocketPing: 30000  // WebSocket keepalive (ms)
}
```

### Theme Customization

```javascript
theme: {
    primary: '#3274d9',
    success: '#73bf69',
    warning: '#ff9830',
    danger: '#f2495c'
}
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ⚠️ IE11 Not Supported (uses modern JavaScript)

## Performance

- **Initial Load**: < 2 seconds
- **WebSocket Latency**: < 100ms
- **Chart Rendering**: 60 FPS animations
- **Memory Usage**: < 50MB
- **Network Usage**: < 1KB/s (WebSocket only)

## Security

- ✅ No credentials in localStorage
- ✅ Automatic token refresh
- ✅ WSS/HTTPS only in production
- ✅ CORS headers configured
- ✅ Content Security Policy ready
- ✅ XSS protection headers

## Troubleshooting

### WebSocket Not Connecting

1. Check Service Principal has Call Control API access
2. Verify firewall allows WSS connections
3. Check browser console for errors
4. Enable debug logging in config

### Data Not Updating

1. Verify API credentials in config.js
2. Check 3CX API is enabled (Settings > Advanced > API)
3. Test authentication: Open browser console, check for 401 errors
4. Try demo mode to verify UI works: `demo: { enabled: true }`

### Charts Not Rendering

1. Check Chart.js is loaded (view page source)
2. Verify browser supports HTML5 Canvas
3. Check browser console for JavaScript errors
4. Clear browser cache

## Development

### Demo Mode

Enable demo mode for development without 3CX connection:

```javascript
demo: {
    enabled: true,
    simulateDelay: 1000,
    randomizeData: true
}
```

### Debug Logging

Enable verbose logging:

```javascript
advanced: {
    enableDebugLogging: true,
    enableErrorReporting: true
}
```

## License

Proprietary - For use with 3CX systems only

## Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review browser console for errors
3. Enable debug logging
4. Contact your 3CX administrator

---

**Version**: 2.0.0
**Last Updated**: October 21, 2025
**Compatible with**: 3CX V20 Update 7+
