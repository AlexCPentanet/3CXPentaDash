# Troubleshooting Guide - CORS and Connection Issues

## Issue: "Failed to fetch" or CORS Error

### Why This Happens

Browsers block requests from `file://` URLs to external servers for security reasons. This is called CORS (Cross-Origin Resource Sharing) policy.

### Solution 1: Run a Local Web Server (Recommended)

You need to serve the wallboard through HTTP instead of opening files directly.

#### Option A: Using Python (Easiest)

1. **Check if Python is installed:**
   ```bash
   python --version
   ```

2. **Start the server:**
   - **Double-click** [start-server.bat](start-server.bat)
   - OR run in Command Prompt:
     ```bash
     cd C:\Users\alex.campkin\Documents\Project
     python -m http.server 8000
     ```

3. **Open browser to:**
   ```
   http://localhost:8000/index.html
   ```

#### Option B: Using PowerShell

1. **Right-click** [start-server.ps1](start-server.ps1)
2. Select **"Run with PowerShell"**
3. Open browser to: `http://localhost:8000`

#### Option C: Using Node.js

If you have Node.js installed:

```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000`

#### Option D: Using Chrome with CORS Disabled (NOT RECOMMENDED)

**Only for testing! Not for production use!**

1. Close ALL Chrome windows
2. Create shortcut to Chrome with flag:
   ```
   chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome-dev"
   ```
3. Use this Chrome instance ONLY for testing

### Solution 2: Deploy to a Web Server

#### Deploy to Your Network

1. **Copy files to web server:**
   - IIS (Windows Server)
   - Apache (Linux)
   - Nginx (Linux/Windows)

2. **Access via HTTP:**
   ```
   http://your-server/wallboard/index.html
   ```

#### Deploy to 3CX Server (Advanced)

You can host the wallboard on your 3CX server itself:

1. **SSH to 3CX server**
2. **Copy files to:**
   ```
   /var/lib/3cxpbx/Instance1/Data/Http/
   ```
3. **Access via:**
   ```
   https://pentanet.3cx.com.au:5001/wallboard/
   ```

## Issue: "Authentication Failed" After Running Server

### Check 1: Verify Credentials

Open [config.js](config.js) and verify:

```javascript
apiUrl: 'https://pentanet.3cx.com.au:5001',  // ✓ Correct
clientId: 'client1wb',                        // ✓ Your Client ID
clientSecret: 'hAIf3wp46naM8EWcvp9QEosJ54a9YLwr',  // ✓ Your API Key
authMethod: 'xapi',                           // ✓ Correct
```

### Check 2: Test in Browser Console

1. **Open wallboard:** `http://localhost:8000/index.html`
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for these messages:**

**Expected Success:**
```
Initializing Enhanced 3CX Wallboard with XAPI...
Authenticating with 3CX XAPI (OAuth 2.0 Client Credentials)...
Requesting token from: https://pentanet.3cx.com.au:5001/connect/token
Token response status: 200 OK
Response content-type: application/json; charset=utf-8
Token response data: { has_access_token: true, expires_in: 3600, token_type: "Bearer" }
✓ XAPI token obtained successfully (expires in 3600s)
Token preview: eyJhbGciOiJSUzI1NiIs...
Validating token with: https://pentanet.3cx.com.au:5001/xapi/v1/Defs?$select=Id
Validation response status: 200 OK
✓ Token validated successfully - 3CX Version: 20.x.x.xxx
✓ Successfully authenticated with 3CX XAPI
```

### Check 3: Network Tab

1. **Open Developer Tools (F12)**
2. **Go to Network tab**
3. **Refresh page**
4. **Look for `/connect/token` request:**
   - Should show **Status: 200**
   - Response should contain `access_token`

5. **Look for `/xapi/v1/` requests:**
   - Should show **Status: 200**
   - Should have `Authorization: Bearer ...` header

## Issue: "Token Validation Failed"

This is usually OK! The wallboard will still try to fetch data.

### Why Validation Might Fail

1. **Endpoint not available** - Some 3CX versions don't support `/xapi/v1/Defs`
2. **Permission issue** - Service Principal needs correct role
3. **CORS on specific endpoint** - But other endpoints might work

### What to Check

Look in console for:
```
⚠ Token validation failed, but continuing anyway: [error message]
  Token might still work with XAPI endpoints
```

If you see data appearing on the wallboard, validation failure can be ignored.

## Issue: "No Data Displayed"

### Check 1: Is Demo Mode Off?

In [config.js](config.js), verify:
```javascript
window.DEMO_MODE = false;  // Must be false
```

### Check 2: Check Console for Errors

Look for these errors:

**Error: 401 Unauthorized**
- **Cause:** Wrong credentials
- **Fix:** Verify Client ID and Secret in config.js

**Error: 403 Forbidden**
- **Cause:** Service Principal lacks permissions
- **Fix:** In 3CX, set role to "System Admin" or "System Owner"

**Error: 404 Not Found**
- **Cause:** Wrong endpoint URL
- **Fix:** Verify apiUrl includes port `:5001`

**Error: "No extensions found"**
- **Cause:** No registered extensions
- **Fix:** Check that phones are registered in 3CX

### Check 3: Test Individual Endpoints

Use the test page: `http://localhost:8000/test-auth.html`

This will test each endpoint separately and show exactly where the issue is.

## Issue: CORS Error Even with Web Server

### Symptom

```
Access to fetch at 'https://pentanet.3cx.com.au:5001/...' from origin 'http://localhost:8000' has been blocked by CORS policy
```

### Solution: Configure 3CX CORS Settings

Unfortunately, 3CX XAPI may not support CORS for external origins by default.

**Workaround Options:**

#### Option 1: Host on Same Domain as 3CX

Host the wallboard on the same domain as your 3CX server to avoid CORS entirely.

#### Option 2: Use Reverse Proxy

Set up nginx or Apache as reverse proxy:

```nginx
# nginx config
location /wallboard/ {
    alias /path/to/wallboard/files/;
}

location /connect/ {
    proxy_pass https://pentanet.3cx.com.au:5001/connect/;
}

location /xapi/ {
    proxy_pass https://pentanet.3cx.com.au:5001/xapi/;
}
```

#### Option 3: Deploy Wallboard on 3CX Server

This is the most reliable solution:

1. Copy wallboard files to 3CX server
2. Access via 3CX's HTTPS URL
3. No CORS issues since same origin

## Issue: SSL Certificate Error

### Symptom

```
NET::ERR_CERT_AUTHORITY_INVALID
```

### Solution

1. **Production:** Install valid SSL certificate on 3CX server
2. **Testing:** Accept the self-signed certificate:
   - Visit `https://pentanet.3cx.com.au:5001` directly
   - Click "Advanced" → "Proceed to site"
   - Then reload wallboard

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Wallboard served via HTTP (not `file://`)
- [ ] `DEMO_MODE = false` in config.js
- [ ] 3CX credentials correct in config.js
- [ ] 3CX server accessible at URL:port
- [ ] SSL certificate accepted in browser
- [ ] Service Principal has "System Admin" role
- [ ] Extensions registered in 3CX
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 OK responses

## Still Not Working?

### Enable Demo Mode for Testing

To verify the wallboard interface works:

1. Open [config.js](config.js)
2. Change:
   ```javascript
   window.DEMO_MODE = true;
   ```
3. Refresh page
4. Should see simulated data

If demo mode works but real mode doesn't, issue is with 3CX connection.

### Get Detailed Logs

The wallboard now has enhanced logging. Check console for:

- Token request/response details
- Validation attempt details
- Each API endpoint request
- Response status codes
- Error messages

### Contact Support

If still stuck, provide these details:

1. Browser console logs (full output)
2. Network tab screenshot showing requests
3. 3CX version
4. Service Principal configuration (role, department)
5. Whether demo mode works

## Common Working Configurations

### Configuration 1: Local Development

```
Wallboard: http://localhost:8000
3CX: https://pentanet.3cx.com.au:5001
Issue: CORS errors
Solution: Deploy to production server
```

### Configuration 2: Same Server as 3CX

```
Wallboard: https://pentanet.3cx.com.au:5001/wallboard/
3CX: https://pentanet.3cx.com.au:5001
Issue: None (same origin)
Solution: Best practice
```

### Configuration 3: Internal Network Server

```
Wallboard: http://intranet.company.com/wallboard/
3CX: https://pentanet.3cx.com.au:5001
Issue: Possible CORS
Solution: Use reverse proxy
```

---

**Need Help?** Check browser console logs for specific error messages and refer to the relevant section above.
