# 3CX V20 Live Call Centre Wallboard

A modern, real-time wallboard for 3CX V20 call centres featuring live call monitoring, agent status tracking, queue statistics, and AI-powered sentiment analysis. Fully customizable with your company branding.

## Features

### Core Functionality
- **Real-time Call Monitoring** - View all active calls with agent names, caller numbers, and call duration
- **Key Performance Indicators (KPIs)** - Track active calls, waiting calls, available agents, average wait time, calls answered, and service level
- **Agent Status Grid** - Monitor all agents with live status updates (Available, On Call, Away, Offline)
- **Queue Statistics** - View detailed stats for all call queues including waiting calls, answered calls, abandoned calls, and average wait times
- **Live Clock and Date** - Always-visible date and time display

### Advanced Features
- **Sentiment Analysis** - AI-powered call sentiment tracking with visual charts and recent sentiment history
- **Customizable Branding** - Add your company logo, name, and custom color scheme
- **Responsive Design** - Works on displays of all sizes from small monitors to large video walls
- **Auto-refresh** - Configurable refresh intervals for real-time updates
- **Connection Status** - Visual indicator showing connection status to 3CX server

### Visual Design
- Modern dark theme optimized for 24/7 viewing
- Smooth animations and transitions
- Color-coded status indicators
- Professional gradient header
- Clean, organized layout

## Installation

### Prerequisites
- Web server (Apache, Nginx, IIS, or any HTTP server)
- Modern web browser (Chrome, Firefox, Edge, Safari)
- 3CX V20 Phone System
- 3CX API access credentials

### Quick Start

1. **Download the files**
   ```
   index.html
   styles.css
   app.js
   config.js
   ```

2. **Place files on your web server**
   - Upload all files to your web server directory
   - Ensure files are accessible via HTTP/HTTPS

3. **Add your company logo**
   - Place your logo file (PNG, JPG, or SVG) in the same directory
   - Name it `logo.png` or update the path in `config.js`
   - Recommended size: max 200px width × 60px height

4. **Configure the wallboard**
   - Open `config.js` in a text editor
   - Update the configuration settings (see Configuration section below)

5. **Open in browser**
   - Navigate to the wallboard URL in your browser
   - Recommend using full-screen mode (F11)
   - For video walls, set browser to kiosk mode

## Configuration

Edit the `config.js` file to customize your wallboard:

### 3CX API Settings

```javascript
apiUrl: 'https://your-3cx-server.com:5001',
apiToken: 'YOUR_API_TOKEN_HERE',
updateInterval: 5000, // Update every 5 seconds
```

### Branding Customization

```javascript
branding: {
    title: 'Your Company Call Centre',
    logo: 'logo.png',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6'
}
```

### Display Options

```javascript
display: {
    showKPIs: true,
    showActiveCalls: true,
    showAgentStatus: true,
    showQueueStats: true,
    showSentiment: true,
    maxActiveCallsDisplay: 20,
    autoHideCursor: 5000 // Auto-hide cursor after 5 seconds
}
```

### Service Level Agreement (SLA)

```javascript
sla: {
    targetPercentage: 80,  // 80% service level target
    targetAnswerTime: 20   // Answer within 20 seconds
}
```

## 3CX API Integration

### Getting Your API Token

1. Log in to your 3CX Management Console
2. Navigate to **Settings** > **Advanced** > **API**
3. Enable the API if not already enabled
4. Create a new API token or use existing one
5. Copy the token and paste it into `config.js`

### API Endpoints Used

The wallboard uses the following 3CX API endpoints:

- `/api/activecalls` - Retrieves current active calls
- `/api/agents` - Gets agent status information
- `/api/queues` - Fetches queue statistics
- `/api/metrics` - Retrieves call metrics and KPIs

### Demo Mode

For testing without 3CX connection, set demo mode in `config.js`:

```javascript
window.DEMO_MODE = true;
```

This will display simulated data for development and testing purposes.

## Sentiment Analysis

The wallboard includes AI-powered sentiment analysis for customer calls:

### How It Works
- Analyzes call patterns, duration, and agent interactions
- Classifies calls as Positive, Neutral, or Negative
- Displays real-time sentiment distribution via pie chart
- Shows recent sentiment history for quick insights

### Integration Options

**Built-in Analysis (Demo)**
- Uses simulated sentiment data
- Good for testing and demonstrations

**External API Integration**
- Configure `sentiment.apiEndpoint` in `config.js`
- Connect to speech analytics or transcription services
- Supports real-time sentiment scoring from call recordings

```javascript
sentiment: {
    enabled: true,
    recentItemsCount: 5,
    apiEndpoint: 'https://your-sentiment-api.com/analyze'
}
```

## Deployment Options

### Option 1: Local Web Server
- Install Apache/Nginx on a dedicated PC
- Access via `http://localhost` or local network IP
- Suitable for single office deployment

### Option 2: Cloud Hosting
- Upload to cloud hosting service (AWS, Azure, DigitalOcean)
- Access from anywhere via HTTPS
- Suitable for multi-site deployments

### Option 3: 3CX Server
- Host directly on your 3CX server
- Minimal additional infrastructure
- Ensure proper security measures

### Video Wall Setup

For large display walls:

1. Set browser to full-screen/kiosk mode
2. Disable screen savers and power saving
3. Configure auto-refresh on system restart
4. Use high-resolution displays (1920×1080 minimum)

**Windows Kiosk Mode:**
```
chrome.exe --kiosk --app=http://your-wallboard-url
```

**Linux Kiosk Mode:**
```
chromium-browser --kiosk --app=http://your-wallboard-url
```

## Customization

### Color Scheme

Edit CSS variables in `styles.css` or use `config.js`:

```javascript
function applyCustomTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#your-color');
    root.style.setProperty('--background-color', '#your-color');
}
```

### Layout Modifications

The wallboard uses CSS Grid for flexible layout. Edit `styles.css` to adjust:

- Grid columns: `.kpi-section`, `.content-grid`, `.agent-grid`, `.queue-grid`
- Card sizes: Modify `minmax()` values in grid templates
- Spacing: Adjust `--spacing-*` variables

### Adding Custom Metrics

Edit `app.js` to add custom KPIs:

1. Add HTML element in `index.html`
2. Create calculation method in `WallboardApp` class
3. Update in `updateKPIs()` method

## Troubleshooting

### Wallboard shows "Disconnected from 3CX"

**Possible causes:**
- Incorrect API URL or token in `config.js`
- 3CX API not enabled
- Firewall blocking API access
- CORS issues (if hosting on different domain)

**Solutions:**
- Verify API credentials
- Check 3CX API settings
- Add CORS headers to 3CX server
- Host wallboard on same domain as 3CX

### No data displaying

**Check:**
- Browser console for errors (F12)
- Demo mode is enabled for testing
- API endpoints are correct
- Network connectivity to 3CX server

### Logo not displaying

**Solutions:**
- Verify logo file path in `config.js`
- Check file permissions
- Use absolute URL if needed
- Verify image file format (PNG, JPG, SVG)

### Performance issues

**Optimizations:**
- Increase `updateInterval` in `config.js`
- Reduce `maxActiveCallsDisplay` value
- Disable unused features in display settings
- Use modern browser with hardware acceleration

## Browser Recommendations

**Recommended:**
- Google Chrome (latest)
- Microsoft Edge (Chromium-based)
- Firefox (latest)

**Not recommended:**
- Internet Explorer (any version)
- Older browser versions without ES6 support

## Security Considerations

- Store API tokens securely
- Use HTTPS for production deployments
- Restrict network access to wallboard
- Regularly update 3CX and web server
- Use read-only API tokens when possible
- Implement authentication if wallboard is public-facing

## Support and Updates

### Need Help?

- Check 3CX documentation for API details
- Review browser console for error messages
- Verify configuration settings in `config.js`

### Feature Requests

This wallboard can be extended with:
- Historical trend charts
- Multi-language support
- Mobile responsive version
- Custom alert notifications
- Integration with other systems
- Advanced analytics dashboards

## Technical Specifications

**Technologies Used:**
- HTML5
- CSS3 (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6+)
- Chart.js for sentiment visualization
- 3CX REST API

**Browser Requirements:**
- ES6 JavaScript support
- CSS Grid support
- Fetch API support
- Modern rendering engine

**Performance:**
- Lightweight (< 50KB total)
- No framework dependencies
- Optimized for 24/7 operation
- Minimal memory footprint

## License

This wallboard is provided as-is for use with 3CX V20 phone systems. Modify and customize as needed for your organization.

---

**Version:** 1.0.0
**Last Updated:** 2025
**Compatible with:** 3CX V20
# 3CXPentaDash
