# 3CX V20 API Setup Guide

This guide will help you configure the wallboard to connect to your 3CX V20 phone system using OAuth 2.0 Client Credentials authentication.

## Prerequisites

- 3CX V20 Phone System (version 20 or higher)
- Administrator access to 3CX Management Console
- Network access to 3CX server (HTTPS)

## Step 1: Enable 3CX API

1. Log in to **3CX Management Console**
2. Navigate to **Settings** > **Advanced** > **API**
3. Enable **"Allow API Access"**
4. Note the **API Port** (default: 5001)
5. Click **Apply**

## Step 2: Create OAuth Client Application

### Option A: Using 3CX Management Console (Recommended)

1. In 3CX Management Console, go to **Settings** > **API**
2. Click **"Add Application"** or **"OAuth Clients"**
3. Configure the new OAuth client:
   ```
   Application Name: Call Centre Wallboard
   Grant Type: Client Credentials
   Scopes: cxapi (full API access)
   Redirect URI: (leave empty for client credentials)
   ```
4. Click **Save**
5. **Copy the Client ID and Client Secret** - you'll need these in the next step

### Option B: Manual Configuration via Database (Advanced)

If your 3CX version doesn't have a UI for OAuth clients:

1. Access 3CX server via SSH/RDP
2. Connect to PostgreSQL database:
   ```bash
   sudo -u postgres psql database_single
   ```
3. Create OAuth client:
   ```sql
   INSERT INTO oauth_clients (client_id, client_secret, name, grant_types, scopes)
   VALUES ('wallboard-client', 'YOUR_SECRET_HERE', 'Wallboard', 'client_credentials', 'cxapi');
   ```

## Step 3: Configure Wallboard

1. Open `config.js` in a text editor

2. Update the 3CX API configuration:

```javascript
window.WALLBOARD_CONFIG = {
    // 3CX API Configuration
    apiUrl: 'https://YOUR-3CX-SERVER:5001',

    // OAuth 2.0 Client Credentials
    clientId: 'YOUR_CLIENT_ID_HERE',
    clientSecret: 'YOUR_CLIENT_SECRET_HERE',

    // Authentication method: 'oauth' or 'token'
    authMethod: 'oauth',

    // ... rest of configuration
};
```

3. Replace the following values:
   - `YOUR-3CX-SERVER` - Your 3CX server hostname or IP address
   - `YOUR_CLIENT_ID_HERE` - The Client ID from Step 2
   - `YOUR_CLIENT_SECRET_HERE` - The Client Secret from Step 2

4. Disable demo mode:
```javascript
window.DEMO_MODE = false;
```

5. Save the file

## Step 4: Configure API Endpoints (Optional)

The wallboard uses these default 3CX V20 API endpoints:

```javascript
endpoints: {
    activeCalls: '/api/ActiveCalls',
    agents: '/api/ExtensionList',
    queues: '/api/QueueList',
    metrics: '/api/CallStatistics'
}
```

Only modify these if your 3CX installation uses custom endpoint paths.

## Step 5: Test the Connection

1. Open the wallboard in a web browser:
   ```
   http://your-server/index.html
   ```

2. Open browser **Developer Console** (F12)

3. Look for connection messages:
   ```
   Initializing Enhanced 3CX Wallboard...
   Authenticating with OAuth 2.0 Client Credentials...
   OAuth authentication successful
   ```

4. Check the footer status indicator:
   - **Green dot** = Connected to 3CX
   - **Red dot** = Connection failed

## Troubleshooting

### Authentication Failed

**Error:** `OAuth authentication failed: 401 Unauthorized`

**Solutions:**
- Verify Client ID and Client Secret are correct
- Ensure OAuth client has `client_credentials` grant type
- Check that client has `cxapi` scope

### CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Solutions:**
1. Enable CORS in 3CX Management Console:
   - Go to **Settings** > **Advanced** > **API**
   - Add your wallboard URL to **Allowed Origins**
   - Example: `http://wallboard.company.com`

2. Alternative: Host wallboard on same domain as 3CX

### Connection Timeout

**Error:** `Failed to fetch` or timeout errors

**Solutions:**
- Verify 3CX server URL is correct (including https:// and port)
- Check firewall allows HTTPS traffic on port 5001
- Test API access with curl:
  ```bash
  curl -X POST https://YOUR-3CX-SERVER:5001/connect/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&scope=cxapi"
  ```

### SSL Certificate Errors

**Error:** `NET::ERR_CERT_AUTHORITY_INVALID`

**Solutions:**
- Install valid SSL certificate on 3CX server
- For testing: Accept self-signed certificate in browser
- Production: Use Let's Encrypt or commercial SSL certificate

### No Data Displayed

**Checklist:**
1. ✓ Authentication successful (green indicator)
2. ✓ Check browser console for API errors
3. ✓ Verify API endpoints return data:
   ```javascript
   // Test in browser console
   fetch('https://YOUR-3CX-SERVER:5001/api/ExtensionList', {
     headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
   }).then(r => r.json()).then(console.log)
   ```
4. ✓ Ensure agents/queues are configured in 3CX

## Alternative: API Token Authentication (Legacy)

If OAuth is not available, you can use token-based authentication:

### Generate API Token

1. In 3CX Management Console:
   - Go to **Settings** > **API**
   - Click **"Generate Token"**
   - Copy the generated token

2. Update `config.js`:

```javascript
window.WALLBOARD_CONFIG = {
    apiUrl: 'https://YOUR-3CX-SERVER:5001',

    // Use token instead of OAuth
    apiToken: 'YOUR_API_TOKEN_HERE',
    authMethod: 'token',

    // ... rest of configuration
};
```

## Security Best Practices

### Production Deployment

1. **Use HTTPS**: Always serve wallboard over HTTPS
2. **Secure Credentials**: Store client secrets securely
   - Don't commit secrets to version control
   - Use environment variables or secure config management
3. **Network Isolation**: Restrict API access to internal network
4. **Token Rotation**: Regularly rotate client secrets
5. **Minimal Permissions**: Only grant required API scopes

### Recommended Network Setup

```
Internet
   ↓
Firewall
   ↓
Reverse Proxy (Nginx/Apache)
   ↓
Wallboard Server (HTTPS only)
   ↓
Internal Network
   ↓
3CX Server (API Port 5001)
```

## API Endpoints Reference

### Active Calls
```
GET /api/ActiveCalls
```
Returns list of currently active calls with agent, caller, and duration information.

### Extension List (Agents)
```
GET /api/ExtensionList
```
Returns all extensions with status (Available, OnCall, Away, etc.) and statistics.

### Queue List
```
GET /api/QueueList
```
Returns all call queues with waiting calls, answered/abandoned counts, and wait times.

### Call Statistics
```
GET /api/CallStatistics
```
Returns daily statistics including total answered, abandoned, and service level metrics.

## Example API Response Formats

### Active Calls Response
```json
[
  {
    "Id": "call-123",
    "AgentName": "John Smith",
    "CallerNumber": "+1-555-0100",
    "QueueName": "Sales",
    "Duration": 45
  }
]
```

### Extension List Response
```json
[
  {
    "Number": "100",
    "Name": "John Smith",
    "Status": "OnCall",
    "CallsToday": 12,
    "AvgHandleTime": 180
  }
]
```

### Queue List Response
```json
[
  {
    "Name": "Sales",
    "Priority": 8,
    "Waiting": 3,
    "Answered": 156,
    "Abandoned": 12,
    "AvgWaitTime": 45
  }
]
```

### Call Statistics Response
```json
{
  "TotalAnswered": 718,
  "TotalAbandoned": 57,
  "AvgHandlingTime": 195,
  "LongestWait": 320,
  "AnsweredWithinSLA": 612
}
```

## Support

### 3CX Documentation
- Official 3CX API Documentation: https://www.3cx.com/docs/manual/api/
- 3CX Support Portal: https://www.3cx.com/support/

### Wallboard Issues
- Check browser console for errors (F12)
- Review this setup guide
- Verify network connectivity to 3CX server
- Test API endpoints independently

## Advanced Configuration

### Custom Data Transformation

If your 3CX API returns data in a different format, you can modify the transformation functions in `app.js`:

```javascript
// Customize in app.js
map3CXStatus(status) {
    // Map your custom status values
}

mapQueuePriority(priorityNum) {
    // Custom priority mapping
}
```

### Filtering Agents/Queues

Show only specific agents or queues in `config.js`:

```javascript
// Show only these queues
queues: ['Sales', 'Support', 'Technical'],

// Show only these agent extensions
agents: ['100', '101', '102', '103']
```

### Refresh Interval

Adjust how often data refreshes (in milliseconds):

```javascript
updateInterval: 3000,  // 3 seconds (default)
// updateInterval: 5000,  // 5 seconds (less load)
// updateInterval: 1000,  // 1 second (real-time)
```

---

**Last Updated:** 2025-01-20
**Version:** 1.0.0
**Compatible with:** 3CX V20+
