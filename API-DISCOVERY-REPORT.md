# 3CX API Discovery Report

**Date:** 2025-01-20
**3CX Version:** V20
**Status:** XAPI endpoints return 404/401 errors

---

## Key Finding: Documentation Mismatch

The documentation in `3CXCallControlAPI_v20` folder describes a **.NET assembly API**, not a REST/HTTP API. This API:

- **Runs locally** on the 3CX server as a .NET library
- **Not accessible** via HTTP/REST from external applications
- **Requires** direct file system access to 3CX installation folder
- **Designed for** server-side integrations, not web-based wallboards

### From the Documentation:

> "This API (.NET assembly) is the integral part of concrete 3CX PhoneSystem installation. It should be referenced and loaded directly from the location of PBX installation. Applications must not use local copy of this assembly and must run in native mode of operating system."

**This explains why XAPI endpoints return 404 errors** - the documented API is not the web-accessible REST API we need for the wallboard.

---

## 3CX V20 Web API Options

For a browser-based wallboard, we need to identify which **web-accessible APIs** are actually available in your 3CX installation.

### Option 1: 3CX Configuration API (XAPI) - OData REST

**Status:** Authentication works, but data endpoints fail

**What Works:**
- ✅ `POST /connect/token` - OAuth authentication (200 OK)
- ✅ `GET /xapi/v1/Defs` - Token validation (200 OK)

**What Fails:**
- ❌ `GET /xapi/v1/ActiveConnections` - 404 Not Found
- ❌ `GET /xapi/v1/PhoneExtensions` - 404 Not Found
- ❌ `GET /xapi/v1/CallLogRecords` - 404 Not Found
- ❌ `GET /xapi/v1/Groups` - 401 Unauthorized

**Possible Reasons:**
1. XAPI requires 8SC+ Enterprise license (your license tier unknown)
2. Configuration API not enabled in 3CX Admin Console
3. Service Principal lacks necessary permissions
4. These specific endpoints don't exist in your 3CX build

### Option 2: 3CX WebSocket API

3CX V20 may provide real-time updates via WebSocket connections. This would be ideal for a live wallboard.

**Typical WebSocket Endpoint:**
```
wss://pentanet.3cx.com.au:5001/ws/events
```

**Features:**
- Real-time push notifications for call events
- Lower network overhead than polling
- Better for live dashboards

**Status:** Not yet tested

### Option 3: 3CX Web Client API

The 3CX Web Client (the browser interface users access) uses its own API endpoints. We might be able to leverage these.

**Typical Endpoints:**
```
/webclient/api/v1/Status
/webclient/api/v1/ActiveCalls
/webclient/api/v1/QueueStatus
```

**Authentication:** Usually session-based or token-based

**Status:** Not yet tested

### Option 4: 3CX Management API

3CX has a management API for administrative tasks. May provide queue statistics.

**Typical Base Path:**
```
/management/api/v1/...
```

**Status:** Not yet tested

---

## Recommended Next Steps

### Step 1: Run Comprehensive API Diagnostic

Use the diagnostic tool we created: [api-diagnostic.html](api-diagnostic.html)

**Instructions:**
1. Start proxy and web server:
   ```batch
   start-with-proxy.bat
   ```

2. Open in browser:
   ```
   http://localhost:8000/api-diagnostic.html
   ```

3. Click **"Run All Tests"**

4. Review results to identify which endpoints actually exist

### Step 2: Check 3CX Admin Console Settings

Verify API access is properly configured:

1. **Log in to 3CX Management Console**
2. Navigate to **Settings > Advanced > API**
3. Check:
   - ✅ "Allow API Access" is enabled
   - Note the API port (default: 5001)
   - Check "Allowed Origins" for CORS settings

4. Navigate to **System > License**
5. Verify license tier (XAPI requires **8SC+ Enterprise**)

### Step 3: Verify Service Principal Permissions

Fix the 401 Unauthorized error on Groups endpoint:

1. **Log in to 3CX Web Client** as administrator
2. Go to **Integrations > API**
3. Find your Service Principal: **client1wb**
4. Click **Edit** and verify:
   - **Status**: Active
   - **Role**: Must be **System Admin** or **System Owner** (not just User)
   - **3CX Configuration API Access**: Must be checked
   - **Department**: Set to appropriate department or "All Departments"
5. Save and test again

### Step 4: Explore Alternative Data Sources

If REST APIs are limited, consider these alternatives:

#### A. 3CX Call History Database

3CX stores call logs in a database. If you have database access:

**Database:** SQLite or PostgreSQL (depending on installation)
**Location:** 3CX installation folder, typically:
```
C:\Program Files\3CX Phone System\Instance1\Data\
```

**Tables:**
- `call_log` - Call history
- `queue_statistics` - Queue performance
- `agent_status` - Agent states

**Pros:**
- Direct access to all data
- No API limitations
- Very fast queries

**Cons:**
- Requires database access credentials
- No real-time updates (need to poll)
- May not be accessible remotely

#### B. 3CX Dashboard/Monitoring Interface

3CX has built-in dashboards that display the same data you need. These dashboards must get their data from somewhere.

**Investigation:**
1. Open 3CX Web Client Dashboard in browser
2. Open Browser Developer Tools (F12)
3. Go to Network tab
4. Observe which API calls the dashboard makes
5. Replicate those endpoints in your wallboard

This reverse-engineering approach often reveals undocumented but functional APIs.

#### C. Custom Integration Service

If no suitable web API exists, create a middleware service:

**Architecture:**
```
3CX Server (.NET Assembly)
       ↓
Custom C# Service (runs on 3CX server)
       ↓ (exposes REST API)
Your Wallboard (browser)
```

**This service would:**
- Run on the 3CX server (Windows service)
- Use the .NET assembly API documented in 3CXCallControlAPI_v20
- Expose a simple REST API for your wallboard
- Handle CORS, authentication, and data transformation

**Pros:**
- Full access to all 3CX data via .NET API
- Custom endpoints designed for your wallboard
- Real-time event subscription possible

**Cons:**
- Requires C# development
- Must be deployed on 3CX server
- Maintenance with 3CX updates

---

## Alternative Approaches to Consider

### 1. Use 3CX's Built-in Wallboard

3CX V20 includes a built-in wallboard feature:
- Navigate to **Call Queues** in Web Client
- Click **Wallboard** button
- This may meet your needs without custom development

### 2. Third-Party Integration Tools

Several vendors provide 3CX integrations:
- **Xima Software** - Call center reporting
- **Zultys Analytics** - Real-time dashboards
- **QueueMetrics** - Call center statistics

These tools have already solved the API access problem.

### 3. Export/Sync Data

If real-time updates aren't critical:
- Set up periodic export of call statistics (CSV, JSON)
- Use 3CX's built-in reporting features
- Display exported data in your wallboard
- Refresh every 5-30 minutes

---

## Current Wallboard Status

**Demo Mode:** Currently enabled to showcase UI functionality

**Features Working (with simulated data):**
- ✅ Active calls counter with sparkline trends
- ✅ Calls waiting in queue
- ✅ Available agents display
- ✅ Average wait time
- ✅ Agent status panel with 12 agents
- ✅ Queue status for multiple queues
- ✅ Recent call activity feed
- ✅ Sentiment analysis meter
- ✅ Grafana-inspired dark theme
- ✅ Auto-refresh every 3 seconds

**To Disable Demo Mode:**
Edit [config.js](config.js:104):
```javascript
window.DEMO_MODE = false;
```

---

## Testing Plan

### Test 1: Diagnostic Tool

**File:** [api-diagnostic.html](api-diagnostic.html)

**Purpose:** Systematically test all possible API endpoints

**Expected Output:**
- List of working endpoints (200 OK)
- List of failing endpoints with error codes
- Recommendations based on results

### Test 2: WebSocket Connection

Create a test page that attempts WebSocket connection:

```javascript
const ws = new WebSocket('wss://pentanet.3cx.com.au:5001/ws/events');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => console.log('Received:', event.data);
```

### Test 3: Web Client API Reverse Engineering

1. Open 3CX Web Client in browser
2. Open Dev Tools (F12) > Network tab
3. Filter by XHR/Fetch requests
4. Identify API calls made by dashboard
5. Test those endpoints with our authentication token

### Test 4: Database Access

If you have access to the 3CX server:

```bash
# Find database files
dir "C:\Program Files\3CX Phone System\Instance1\Data\*.db"

# Or for PostgreSQL
psql -h localhost -U phonesystem -d database_name
```

---

## Security Considerations

### CORS Proxy (Current Setup)

**Current Architecture:**
```
Browser (localhost:8000)
    ↓
Proxy Server (localhost:8080)
    ↓
3CX Server (pentanet.3cx.com.au:5001)
```

**Security Concerns:**
1. Proxy exposes 3CX API to any local application
2. Credentials stored in JavaScript (visible in browser)
3. No encryption on localhost connections

**For Production:**
- Deploy proxy server with proper authentication
- Use environment variables for credentials
- Implement rate limiting
- Add request logging
- Use HTTPS even on localhost

### Alternative: Server-Side Backend

**Better Architecture:**
```
Browser (HTTPS)
    ↓
Your Backend Server (Node.js/C#)
    ↓ (authenticates with 3CX)
3CX Server
```

**Advantages:**
- Credentials never exposed to browser
- Better security control
- Can implement caching
- Add custom business logic

---

## Questions to Resolve

1. **What is your 3CX license tier?**
   - Check: 3CX Management Console > System > License
   - XAPI requires 8SC+ Enterprise

2. **Is Configuration API explicitly enabled?**
   - Check: Settings > Advanced > API
   - "Allow API Access" checkbox

3. **What role does Service Principal have?**
   - Check: Integrations > API > client1wb
   - Should be System Admin or System Owner

4. **Can you access 3CX server directly?**
   - If yes, database access or local .NET service possible
   - If no, must rely on REST API only

5. **What's the 3CX build number?**
   - Different builds may have different endpoint paths
   - Check: System > About

6. **Do you have 3CX support contract?**
   - They can confirm which APIs are available
   - They can provide endpoint documentation

---

## Conclusion

The wallboard UI is fully functional in demo mode. The blocker is **determining which web-accessible API** your 3CX installation actually provides.

**Most Likely Solution:**
- Run the diagnostic tool to identify working endpoints
- Adjust Service Principal permissions (fix 401 error)
- Verify XAPI is enabled and licensed
- OR: Use alternative API discovered through testing

**Next Action:** Run [api-diagnostic.html](api-diagnostic.html) and share the results.

---

**Related Files:**
- [config.js](config.js) - API configuration
- [app.js](app.js) - Authentication and data fetching logic
- [api-diagnostic.html](api-diagnostic.html) - Comprehensive endpoint testing tool
- [3CX-XAPI-SETUP.md](3CX-XAPI-SETUP.md) - XAPI configuration guide
- [CORS-FIX.md](CORS-FIX.md) - Proxy server setup

