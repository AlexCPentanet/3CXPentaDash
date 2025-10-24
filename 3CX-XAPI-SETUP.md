# 3CX Configuration API (XAPI) Setup Guide

Complete guide for connecting the wallboard to 3CX V20+ using the Configuration API (XAPI).

## Important: License Requirement

**You must have an 8SC+ Enterprise license to use 3CX Configuration API (XAPI).**

## What is XAPI?

The 3CX Configuration API (XAPI) is a REST-based interface introduced in 3CX Version 20 that provides:
- OData-compliant endpoints
- OAuth 2.0 authentication
- Programmatic access to nearly all 3CX configuration aspects
- Real-time access to call data, extensions, and system status

## Step 1: Enable XAPI in 3CX Admin Console

1. Log in to **3CX Web Client** as administrator
2. Navigate to **Integrations > API**
3. Click **Add** button to create a new client application

## Step 2: Configure Service Principal

When creating the API integration, configure the following:

### Basic Settings
```
Client ID: wallboard-client
(This is the DN for accessing the route point and needed for authorization)
```

### Configuration API Access
- ✓ Check **"3CX Configuration API Access"** checkbox

### Service Principal Settings
```
Department: [Select appropriate department or leave as default]
Role: System Admin (or System Owner for full access)
```

**Important Notes:**
- **System Owner** or **System Admin** roles grant system-wide rights
- Other roles will have limited access based on department permissions
- The role determines what data the wallboard can access

### Save and Copy API Key

4. Click **Save**
5. **COPY THE API KEY** - it will only be shown once!
6. Save both the **Client ID** and **API Key** securely

## Step 3: Configure Wallboard

Open `config.js` and update the configuration:

```javascript
window.WALLBOARD_CONFIG = {
    // Your 3CX server URL (HTTPS required, no port needed)
    apiUrl: 'https://your-3cx-server.com',

    // Service Principal credentials from Step 2
    clientId: 'wallboard-client',           // Your Client ID
    clientSecret: 'YOUR_API_KEY_HERE',      // The API Key (shown only once)

    // Authentication method (must be 'xapi')
    authMethod: 'xapi',

    // ... rest of configuration
};
```

**Required Changes:**
1. `apiUrl` - Replace with your 3CX server URL (HTTPS, no port)
2. `clientId` - Your Client ID from the API integration
3. `clientSecret` - The API Key you copied in Step 2
4. Set `DEMO_MODE = false` at the bottom of the file

## Step 4: Verify Configuration

### Test Authentication

1. Open the wallboard in a web browser
2. Open **Developer Console** (F12)
3. Look for these messages:

```
Initializing Enhanced 3CX Wallboard with XAPI...
Authenticating with 3CX XAPI (OAuth 2.0 Client Credentials)...
✓ XAPI token obtained (expires in 3600s)
✓ Token validated - 3CX Version: 20.x.x.xxx
✓ Successfully authenticated with 3CX XAPI
```

4. Check footer status:
   - **Green dot** = Connected successfully
   - **Red dot** = Connection failed (check console for errors)

## XAPI Authentication Flow

The wallboard uses OAuth 2.0 Client Credentials flow:

```
1. POST /connect/token
   Headers: Content-Type: application/x-www-form-urlencoded
   Body:
     client_id=[your_client_id]
     client_secret=[your_api_key]
     grant_type=client_credentials

2. Receive Access Token
   Response:
     {
       "access_token": "eyJ...",
       "expires_in": 3600,
       "token_type": "Bearer"
     }

3. Validate Token (Quick Test)
   GET /xapi/v1/Defs?$select=Id
   Headers: Authorization: Bearer [access_token]

4. Use Token for All API Requests
   Auto-refreshes 2 minutes before expiry
```

## XAPI Endpoints Used by Wallboard

### Active Connections (Live Calls)
```
GET /xapi/v1/ActiveConnections?$filter=Status eq 'Connected'
```
Returns currently active calls with extension, remote number, and duration.

### Phone Extensions (Agents)
```
GET /xapi/v1/PhoneExtensions?$filter=IsRegistered eq true
```
Returns registered extensions with status and profile information.

### Groups (Call Queues)
```
GET /xapi/v1/Groups
```
Returns configured groups including call queues and ring groups.

### Call Log Records (Daily Statistics)
```
GET /xapi/v1/CallLogRecords?$filter=TimeStart ge [today]
```
Returns call history for calculating daily statistics.

### System Status
```
GET /xapi/v1/SystemStatus
```
Returns system health and status information.

## OData Query Examples

XAPI supports OData queries for filtering and selecting data:

### Filter by Date
```
$filter=TimeStart ge 2025-01-20T00:00:00Z
```

### Select Specific Fields
```
$select=Number,FirstName,LastName,CurrentProfile
```

### Combine Filter and Select
```
$filter=IsRegistered eq true&$select=Number,FirstName,LastName
```

### Top N Results
```
$top=50
```

## Troubleshooting

### Authentication Fails (401 Unauthorized)

**Symptoms:**
```
XAPI OAuth failed (401): Unauthorized
```

**Solutions:**
1. Verify Client ID is correct
2. Verify API Key was copied correctly (check for extra spaces)
3. Ensure API integration is enabled in 3CX
4. Check that Service Principal has appropriate role

### License Error

**Error:** "8SC+ Enterprise license required"

**Solution:**
- XAPI requires 8SC+ Enterprise license
- Upgrade your 3CX license or use demo mode for testing

### CORS Errors

**Error:** `Access-Control-Allow-Origin` blocked

**Solutions:**
1. Host wallboard on same domain as 3CX
2. Configure CORS in 3CX if available
3. Use reverse proxy to avoid CORS issues

### Token Validation Failed

**Error:** "Token validation failed: 403"

**Solutions:**
1. Check Service Principal role has sufficient permissions
2. Verify department access settings
3. Ensure XAPI access is enabled for the client

### No Data Displayed

**Checklist:**
- ✓ Authentication successful (green indicator)
- ✓ Check console for specific endpoint errors
- ✓ Verify extensions are registered in 3CX
- ✓ Confirm call queues/groups exist
- ✓ Test endpoints individually (see below)

### Testing Individual Endpoints

Use browser console or Postman to test:

```javascript
// Get access token first
const token = 'YOUR_ACCESS_TOKEN';

// Test extensions endpoint
fetch('https://your-3cx-server.com/xapi/v1/PhoneExtensions?$top=5', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);

// Test active connections
fetch('https://your-3cx-server.com/xapi/v1/ActiveConnections', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

## Important XAPI Limitations

### Real-Time Queue Statistics Not Available

The XAPI Configuration API provides **configuration data** rather than **real-time call queue metrics**.

**Available:**
- Active connections (live calls)
- Extension status and registration
- Call log history (for statistics)
- Group/queue configuration

**NOT Directly Available:**
- Real-time queue wait times
- Current number of calls waiting in queue
- Live abandoned call tracking per queue

**Workaround:**
The wallboard calculates these metrics by:
1. Querying `ActiveConnections` to count current calls
2. Analyzing `CallLogRecords` for daily statistics
3. Estimating queue metrics based on available data

For true real-time queue statistics, you may need to:
- Use 3CX Call History Reports
- Implement custom CDR analysis
- Consider 3CX Call Flow Designer integration

## Security Best Practices

### Production Deployment

1. **HTTPS Only**
   - Always use HTTPS for 3CX server
   - Serve wallboard over HTTPS
   - Valid SSL certificates required

2. **Secure Credentials**
   ```javascript
   // DON'T commit secrets to version control
   // Use environment-specific config files
   // config.production.js (not in git)
   // config.development.js (not in git)
   ```

3. **Least Privilege**
   - Create dedicated Service Principal for wallboard
   - Grant minimum required permissions
   - Use department-specific access if possible

4. **Token Management**
   - Tokens auto-refresh (handled by wallboard)
   - Tokens expire after 60 minutes
   - Never expose tokens in client-side code

5. **Network Security**
   ```
   Firewall → Reverse Proxy → Wallboard → Internal Network → 3CX
   ```

### Recommended Service Principal Configuration

```
Role: Custom Role with:
  - View Extensions
  - View Groups
  - View Call History
  - View System Status

Department: Call Centre Department (if applicable)
```

## Advanced Configuration

### Filtering Specific Extensions

Show only specific agent extensions:

```javascript
// In config.js
agents: ['100', '101', '102', '103', '104']
```

The wallboard will filter to show only these extensions.

### Filtering Specific Queues

Show only specific call queues:

```javascript
// In config.js
queues: ['Sales', 'Support', 'Technical Support']
```

### Custom Refresh Interval

Adjust data refresh rate (careful with API rate limits):

```javascript
updateInterval: 3000,  // 3 seconds (default)
// updateInterval: 5000,  // 5 seconds (recommended for production)
// updateInterval: 10000, // 10 seconds (lighter API load)
```

### Custom Status Mapping

Modify status mapping in `app.js`:

```javascript
mapXAPIStatus(profile) {
    // Add your custom profile names
    const statusMap = {
        'Available': 'available',
        'In Meeting': 'break',
        'Custom Status': 'away'
        // ... add more
    };
    return statusMap[profile] || 'away';
}
```

## XAPI Documentation References

### Official Resources
- [3CX Configuration API Specification](https://www.3cx.com/docs/manual/configuration-api/)
- [XAPI Tutorial GitHub](https://github.com/3cxorg/xapi-tutorial)
- [OData Protocol Documentation](https://www.odata.org/)

### Key Endpoints Reference

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `/xapi/v1/Defs` | Quick test / validation | System definitions |
| `/xapi/v1/PhoneExtensions` | Get extensions | Extension list |
| `/xapi/v1/Groups` | Get queues/groups | Group list |
| `/xapi/v1/ActiveConnections` | Get active calls | Live connection data |
| `/xapi/v1/CallLogRecords` | Get call history | Historical call data |
| `/xapi/v1/SystemStatus` | Get system info | System metrics |

## Example API Responses

### PhoneExtensions Response
```json
{
  "value": [
    {
      "Number": "100",
      "FirstName": "John",
      "LastName": "Smith",
      "CurrentProfile": "Available",
      "IsRegistered": true
    }
  ]
}
```

### ActiveConnections Response
```json
{
  "value": [
    {
      "Id": "conn-123",
      "ExtensionNumber": "100",
      "RemoteNumber": "+15550100",
      "Status": "Connected",
      "Duration": 125,
      "ExternalLine": "Sales"
    }
  ]
}
```

### Groups Response
```json
{
  "value": [
    {
      "Number": "800",
      "Name": "Sales Queue",
      "Type": "Queue"
    }
  ]
}
```

## Migration from Demo Mode

### Steps to Enable Production Mode

1. **Configure 3CX** (Steps 1-2 above)
2. **Update config.js** with real credentials
3. **Disable demo mode:**
   ```javascript
   window.DEMO_MODE = false;
   ```
4. **Test connection** (check console)
5. **Monitor for errors** during first hour
6. **Verify data accuracy** against 3CX reports

### Comparison: Demo vs Production

| Feature | Demo Mode | Production (XAPI) |
|---------|-----------|-------------------|
| Active Calls | Simulated | Real-time from ActiveConnections |
| Agent Status | Random | Live from PhoneExtensions |
| Queue Stats | Generated | Calculated from CallLogRecords |
| Daily Stats | Incremental | From actual call history |
| Updates | Every 3s | Every 3s (configurable) |

## Support and Resources

### Getting Help

1. Check browser console for specific errors
2. Review this setup guide
3. Test API endpoints individually
4. Verify 3CX license includes XAPI
5. Check 3CX logs for API access errors

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| 401 Unauthorized | Invalid credentials | Check Client ID and API Key |
| 403 Forbidden | Insufficient permissions | Check Service Principal role |
| 404 Not Found | Wrong endpoint | Verify XAPI URL format |
| 426 Upgrade Required | License issue | Verify 8SC+ Enterprise license |

---

**Version:** 2.0.0
**Last Updated:** 2025-01-20
**Compatible with:** 3CX V20+ with 8SC+ Enterprise License
**API Version:** XAPI v1
