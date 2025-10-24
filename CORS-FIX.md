# CORS Fix - Local Development Setup

## The Problem

Your 3CX server blocks requests from `http://localhost:8000` due to CORS (Cross-Origin Resource Sharing) policy. Even though authentication works (200 OK), the browser blocks the response.

## The Solution - CORS Proxy Server

We've created a proxy server that sits between your browser and 3CX, adding the necessary CORS headers.

```
Browser → Proxy (localhost:8080) → 3CX Server (pentanet.3cx.com.au:5001)
```

## Quick Start (All-in-One)

### Option 1: Automatic Setup (Easiest)

1. **Double-click:** [start-with-proxy.bat](start-with-proxy.bat)

This will automatically:
- ✓ Start CORS proxy on port 8080
- ✓ Start web server on port 8000
- ✓ Open both in separate windows

2. **Open browser to:**
   ```
   http://localhost:8000/index.html
   ```

3. **To stop:** Press any key in the main window

### Option 2: Manual Setup

If you prefer to start servers manually:

**Terminal 1 - CORS Proxy:**
```bash
cd C:\Users\alex.campkin\Documents\Project
node proxy-server.js
```

**Terminal 2 - Web Server:**
```bash
cd C:\Users\alex.campkin\Documents\Project
python -m http.server 8000
```

**Then open:** `http://localhost:8000/index.html`

## Verify It's Working

### 1. Check Proxy Server Console

You should see requests being forwarded:
```
POST /connect/token
GET /xapi/v1/PhoneExtensions?$select=Number,FirstName,LastName
GET /xapi/v1/ActiveConnections?$filter=Status eq 'Connected'
GET /xapi/v1/Groups?$select=Number,Name
GET /xapi/v1/CallLogRecords?$filter=TimeStart ge 2025-10-20T00:00:00Z
```

### 2. Check Browser Console

You should see:
```
✓ XAPI token obtained successfully (expires in 3600s)
✓ Token validated successfully - 3CX Version: 20.x.x.xxx
✓ Successfully authenticated with 3CX XAPI
```

**NO MORE CORS ERRORS!**

### 3. Check Wallboard

You should see:
- ✓ Green "Connected to 3CX" indicator
- ✓ Real agent data (12 agents with names)
- ✓ Real queue data
- ✓ Live active calls
- ✓ Data updating every 3 seconds

## Configuration

The proxy is configured in [config.js](config.js):

```javascript
// Local development (with proxy)
apiUrl: 'http://localhost:8080'

// Production (direct to 3CX)
// apiUrl: 'https://pentanet.3cx.com.au:5001'
```

## Troubleshooting

### "node is not recognized"

**Problem:** Node.js is not installed

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install (LTS version recommended)
3. Restart Command Prompt
4. Try again

### Proxy server won't start

**Check if port 8080 is already in use:**
```bash
netstat -ano | findstr :8080
```

**Solution:** Either:
1. Kill the process using port 8080
2. Or edit [proxy-server.js](proxy-server.js) and change `PROXY_PORT` to another port (e.g., 8081)

### Web server won't start

**Check if port 8000 is already in use:**
```bash
netstat -ano | findstr :8000
```

**Solution:** Change port or kill the process.

### Still getting CORS errors

**Check that:**
1. Proxy server is running (check console for "3CX CORS Proxy Server Started")
2. `apiUrl` in config.js points to `http://localhost:8080`
3. Browser is accessing `http://localhost:8000/index.html` (not `file://`)

### No data showing

**Check proxy console** - If you don't see any requests, the wallboard isn't connecting to proxy.

**Solution:**
1. Verify `apiUrl: 'http://localhost:8080'` in config.js
2. Hard refresh browser (Ctrl+F5)
3. Check browser console for errors

## Production Deployment

For production, you have two options:

### Option 1: Deploy on Same Server as 3CX

**Best solution - no CORS issues!**

1. Copy wallboard files to 3CX server
2. Update config.js:
   ```javascript
   apiUrl: 'https://pentanet.3cx.com.au:5001'
   ```
3. Access via: `https://pentanet.3cx.com.au:5001/wallboard/`

### Option 2: Deploy with Reverse Proxy

Use nginx/Apache on production server:

**nginx config:**
```nginx
server {
    listen 443 ssl;
    server_name wallboard.yourcompany.com;

    # Serve wallboard files
    location / {
        root /var/www/wallboard;
        index index.html;
    }

    # Proxy 3CX API requests
    location /connect/ {
        proxy_pass https://pentanet.3cx.com.au:5001/connect/;
        proxy_ssl_verify off;
    }

    location /xapi/ {
        proxy_pass https://pentanet.3cx.com.au:5001/xapi/;
        proxy_ssl_verify off;
    }
}
```

Then update config.js:
```javascript
apiUrl: ''  // Empty = same origin
```

## How the Proxy Works

The [proxy-server.js](proxy-server.js) does three things:

1. **Adds CORS headers** to all responses:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

2. **Forwards requests** to 3CX:
   ```
   localhost:8080/connect/token → pentanet.3cx.com.au:5001/connect/token
   ```

3. **Accepts self-signed SSL certificates**:
   ```javascript
   rejectUnauthorized: false
   ```

## Security Note

⚠️ **The proxy is for LOCAL DEVELOPMENT ONLY**

Do NOT use this proxy in production because:
- No authentication
- Accepts all SSL certificates
- Allows all origins (`*`)

For production, deploy the wallboard on the same domain as 3CX or use a proper reverse proxy with SSL.

## File Reference

- **[proxy-server.js](proxy-server.js)** - CORS proxy server
- **[start-with-proxy.bat](start-with-proxy.bat)** - Automatic startup script
- **[config.js](config.js)** - Wallboard configuration (update apiUrl here)
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - General troubleshooting guide

---

**Quick Command Reference:**

```bash
# Start everything (Windows)
start-with-proxy.bat

# Or manually:
node proxy-server.js          # Terminal 1
python -m http.server 8000    # Terminal 2

# Then open:
http://localhost:8000/index.html
```
