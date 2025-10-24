# 3CX Wallboard Installation Guide - Pentanet Systems

**System Information:**
- **3CX Version:** 20.0 Update 7 (Build 1057 Release)
- **License Type:** Enterprise Annual (24 Simultaneous Calls)
- **FQDN:** pentanet.3cx.com.au
- **Install Type:** On Premise (Linux)
- **License Expires:** October 17, 2026
- **Partner:** Aatrox Communications Limited
- **Owner:** stephen@pentanet.com.au

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [3CX Configuration](#3cx-configuration)
3. [Server Installation](#server-installation)
4. [Backend Setup](#backend-setup)
5. [Frontend Deployment](#frontend-deployment)
6. [Email Configuration](#email-configuration)
7. [Branding Customization](#branding-customization)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Server:**
- Linux (Ubuntu 20.04+ or Debian 10+)
- 2GB RAM minimum (4GB recommended)
- 10GB disk space
- Node.js 16+ and npm
- Nginx or Apache web server

**Network:**
- Access to 3CX server (pentanet.3cx.com.au:5001)
- HTTPS enabled (for WebSocket connections)
- Ports 80/443 open for web access
- Port 3001 for admin API

**3CX Access:**
- Admin access to 3CX Web Client
- Permission to create Service Principals
- System Owner or System Admin role

---

## 3CX Configuration

### Step 1: Enable API Access

1. Log in to **3CX Web Client** as administrator
2. Navigate to **Settings > Advanced > API**
3. Ensure **"Allow API Access"** is enabled
4. Note the API port: **5001** (HTTPS)

### Step 2: Create Service Principal for Wallboard

1. Go to **Integrations > API**
2. Click **Add**
3. Configure:

```
Client ID:               client1wb
Name:                    Wallboard Integration
Extension:               900 (or any available)

✅ 3CX Configuration API Access
✅ 3CX Call Control API Access

Department:              System Wide
Role:                    System Owner
```

4. Click **Save**
5. **IMMEDIATELY COPY THE API KEY** - it's only shown once!
   ```
   Example: hAIf3wp46naM8EWcvp9QEosJ54a9YLwr
   ```

6. Store the API key securely (you'll need it later)

### Step 3: Verify Network Access

Ensure the wallboard server can reach 3CX:

```bash
# Test HTTPS access
curl -k https://pentanet.3cx.com.au:5001/connect/token

# Test WebSocket ports
nc -zv pentanet.3cx.com.au 5001
```

**Expected:** Connection successful on port 5001

---

## Server Installation

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Git (if needed)
sudo apt install -y git

# Verify installations
node --version  # Should be v18.x or higher
npm --version
nginx -v
```

### Step 2: Clone/Copy Wallboard Files

```bash
# Create directory
sudo mkdir -p /var/www/html/wallboard
cd /var/www/html/wallboard

# Copy wallboard files (adjust path as needed)
# Or clone from repository:
# git clone https://your-repo/wallboard.git .

# Set permissions
sudo chown -R www-data:www-data /var/www/html/wallboard
```

### Step 3: Run Installation Script

```bash
cd /var/www/html/wallboard/deploy
chmod +x install.sh
sudo ./install.sh
```

The installation script will:
- Install dependencies
- Configure Nginx
- Set up SSL (optional)
- Configure firewall
- Create systemd services

**Follow the prompts:**
- SSL setup: Recommended (requires domain name)
- Domain name: wallboard.pentanet.com.au (or your preferred subdomain)
- Email: stephen@pentanet.com.au (for SSL certificate)

---

## Backend Setup

### Step 1: Install Node.js Dependencies

```bash
cd /var/www/html/wallboard/server
npm install
```

**Dependencies installed:**
- express - Web framework
- sqlite3 - Database
- bcrypt - Password hashing
- jsonwebtoken - Authentication
- nodemailer - Email alerts
- pdfkit - PDF reports
- moment - Date/time handling

### Step 2: Configure Environment Variables

Create environment file:

```bash
sudo nano /var/www/html/wallboard/server/.env
```

Add:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your-random-secret-key-here-change-this-in-production
SESSION_SECRET=another-random-secret-key-here

# Database
DB_PATH=/var/www/html/wallboard/server/data/wallboard.db

# 3CX Configuration
TCX_FQDN=pentanet.3cx.com.au
TCX_PORT=5001

# Email (configure later in admin panel)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Recordings
RECORDINGS_DIR=/var/lib/3cxpbx/Instance1/Data/Recordings
RECORDINGS_SMB=smb://10.71.80.203
RECORDINGS_DOMAIN=PENTANET
RECORDINGS_USER=svc.callrecordings
RECORDINGS_SHARE=CallRecordings
```

**Generate secure secrets:**

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Start Backend Server

```bash
# Start manually (for testing)
npm start

# Or use PM2 for production
sudo npm install -g pm2
pm2 start admin-api.js --name wallboard-api
pm2 save
pm2 startup  # Follow the instructions to enable startup on boot
```

**Verify backend is running:**

```bash
curl http://localhost:3001/health
```

**Expected output:**
```json
{"status":"ok","timestamp":"2025-01-20T..."}
```

---

## Frontend Deployment

### Step 1: Configure Wallboard Settings

```bash
cd /var/www/html/wallboard

# Copy Pentanet configuration
cp config.pentanet.js config.js

# Edit configuration
sudo nano config.js
```

**Update the following:**

```javascript
auth: {
    clientId: 'client1wb',  // From Step 2 of 3CX Configuration
    clientSecret: 'YOUR_API_KEY_HERE',  // The key you copied
},

// Verify these settings match your 3CX system:
pbx: {
    fqdn: 'pentanet.3cx.com.au',
    port: 5001,
    useSSL: true,
    maxConcurrentCalls: 24
},

// Update email recipients:
email: {
    enabled: true,
    alerts: {
        recipients: [
            'stephen@pentanet.com.au',
            // Add more recipients as needed
        ]
    }
}
```

### Step 2: Configure Nginx

The installation script created `/etc/nginx/sites-available/wallboard`.

**Verify configuration:**

```bash
sudo nano /etc/nginx/sites-available/wallboard
```

**Should contain:**

```nginx
server {
    listen 443 ssl http2;
    server_name wallboard.pentanet.com.au;

    ssl_certificate /etc/letsencrypt/live/wallboard.pentanet.com.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wallboard.pentanet.com.au/privkey.pem;

    root /var/www/html/wallboard;
    index index.html;

    # Main wallboard
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Admin API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name wallboard.pentanet.com.au;
    return 301 https://$server_name$request_uri;
}
```

**Test and reload Nginx:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Email Configuration

### Step 1: Configure SMTP in Admin Panel

1. Open admin panel: `https://wallboard.pentanet.com.au/admin/branding-config.html`
2. Login with default credentials:
   - **Username:** admin
   - **Password:** admin123
   - **⚠️ CHANGE PASSWORD IMMEDIATELY!**

3. Navigate to **Email Configuration** tab

4. Configure SMTP settings:

**For Gmail:**
```
SMTP Server:     smtp.gmail.com
Port:            587
Use SSL/TLS:     ✓ (checked)
Email Account:   alerts@pentanet.com.au
Password:        [App Password - see below]
```

**Creating Gmail App Password:**
1. Go to Google Account settings
2. Security > 2-Step Verification > App passwords
3. Generate password for "3CX Wallboard"
4. Copy the 16-character password
5. Use this in the wallboard configuration

**For Microsoft 365:**
```
SMTP Server:     smtp.office365.com
Port:            587
Use SSL/TLS:     ✓ (checked)
Email Account:   alerts@pentanet.com.au
Password:        [Account password]
```

5. Click **"Send Test Email"** to verify configuration

### Step 2: Configure Alert Recipients

1. In the **Email Configuration** tab
2. Add recipients:
   - stephen@pentanet.com.au
   - (Add other team members)

3. Configure alert triggers in **Notification Settings** tab:
   - ✅ High Severity: Immediate
   - ✅ Medium Severity: Immediate
   - ⬜ Low Severity: Immediate
   - ✅ Daily Digest: 09:00

4. Configure what to include:
   - ✅ Call Recording (if available)
   - ✅ Full Transcription
   - ✅ Sentiment Analysis
   - ✅ Detected Keywords

5. Click **"Save Notification Settings"**

---

## Branding Customization

### Step 1: Upload Pentanet Logo

1. In admin panel, go to **Branding & Styling** tab

2. Upload Pentanet logo:
   - Recommended size: 200px × 60px
   - Format: PNG with transparent background
   - Click "Choose Logo File"

3. Upload favicon:
   - Size: 32×32px or 64×64px
   - Format: ICO or PNG

### Step 2: Configure Colors

Pentanet color scheme is already set:

```
Primary:    #0052CC (Pentanet Blue)
Secondary:  #00A3E0 (Light Blue)
Accent:     #00D4FF (Cyan)
Success:    #00C48C
Warning:    #FF9800
Danger:     #F44336
```

Adjust if needed, then click **"Save Branding Settings"**

### Step 3: Update Footer Information

Already configured with:
```
Footer Text:     © 2025 Pentanet. Licensed by Aatrox Communications Limited
Contact Email:   stephen@pentanet.com.au
Support Phone:   +61 8 9466 2670
```

---

## Testing & Verification

### Step 1: Test Dashboard Access

1. Open browser: `https://wallboard.pentanet.com.au`
2. Dashboard should load and show:
   - Connection status indicator
   - KPI cards (may show zeros if no calls active)
   - Agent status panel
   - Queue monitors

**If using demo mode for testing:**
```javascript
// In config.js, temporarily set:
demo: {
    enabled: true
}
```

### Step 2: Test Admin Panel

1. Open: `https://wallboard.pentanet.com.au/admin/branding-config.html`
2. Login with credentials
3. **⚠️ Change default password immediately:**
   - Click user icon > Change Password
   - Current: admin123
   - New: [Strong password]

### Step 3: Test API Connection

Open browser console (F12) on dashboard:

```javascript
// Should see these messages:
✓ Wallboard configuration loaded for Pentanet
✓ 3CX Version: 20.0 Update 7 (Build 1057)
✓ Max Concurrent Calls: 24
✓ API Client initialized successfully
✓ WebSocket connected
```

### Step 4: Test Email Alerts

1. In admin panel > Email Configuration
2. Click **"Send Test Email"**
3. Check stephen@pentanet.com.au inbox
4. Should receive test email within 1 minute

### Step 5: Test Call Monitoring

Make a test call through 3CX:

1. Dial one of the DIDs (e.g., 61894662670)
2. Dashboard should update in real-time:
   - Active Calls counter increases
   - Call appears in Activity Feed
   - Agent status updates

3. End call
   - Active Calls counter decreases
   - Call moves to history

### Step 6: Test Flagged Call Alerts

Simulate a flagged call:

1. During a call, if keywords are detected:
   - "complaint", "terrible service", etc.
2. Email alert should be sent
3. Call appears in Admin > Flagged Calls

---

## Troubleshooting

### Issue: Cannot Connect to 3CX

**Symptoms:** Dashboard shows "Connection Failed"

**Solutions:**

1. **Check API credentials:**
   ```bash
   # Verify config.js has correct credentials
   grep -A 5 "auth:" /var/www/html/wallboard/config.js
   ```

2. **Test 3CX API access:**
   ```bash
   curl -k -X POST https://pentanet.3cx.com.au:5001/connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=client1wb&client_secret=YOUR_API_KEY"
   ```

   **Expected:** JSON response with `access_token`

3. **Check Service Principal:**
   - Login to 3CX Web Client
   - Integrations > API > client1wb
   - Verify it's Active and has both API accesses enabled

### Issue: WebSocket Not Connecting

**Symptoms:** No real-time updates

**Solutions:**

1. **Check browser console for errors**
2. **Verify Nginx WebSocket proxy:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   # Should allow 80/443
   ```

### Issue: Emails Not Sending

**Symptoms:** Test email fails

**Solutions:**

1. **Verify SMTP settings in admin panel**
2. **Check admin API logs:**
   ```bash
   pm2 logs wallboard-api
   ```

3. **Test SMTP directly:**
   ```bash
   telnet smtp.gmail.com 587
   # Or for Microsoft:
   telnet smtp.office365.com 587
   ```

4. **For Gmail:** Ensure App Password is used, not regular password

### Issue: 404 on XAPI Endpoints

**Symptoms:** API calls return 404

**Possible Causes:**
- XAPI not available in your license tier
- Endpoints not enabled

**Solutions:**

1. **Verify license includes XAPI:**
   - 3CX Management Console > System > License
   - Should be **Enterprise Annual** (✓ confirmed for Pentanet)

2. **Check API is enabled:**
   - Settings > Advanced > API
   - "Allow API Access" should be checked

3. **Try alternative endpoints:**
   - Edit config.js
   - Switch to legacy API if needed

### Issue: Call Recordings Not Attached

**Symptoms:** Email alerts don't include recordings

**Possible Causes:**
- Recording path not accessible
- SMB mount not configured

**Solutions:**

1. **Check recording location:**
   ```bash
   ls -l /var/lib/3cxpbx/Instance1/Data/Recordings
   ```

2. **Mount SMB share (if using remote storage):**
   ```bash
   sudo apt install cifs-utils
   sudo mkdir -p /mnt/3cx-recordings

   # Mount SMB share
   sudo mount -t cifs //10.71.80.203/CallRecordings /mnt/3cx-recordings \
     -o username=svc.callrecordings,domain=PENTANET,password=YOUR_PASSWORD

   # Make permanent in /etc/fstab:
   echo "//10.71.80.203/CallRecordings /mnt/3cx-recordings cifs username=svc.callrecordings,domain=PENTANET,password=YOUR_PASSWORD,iocharset=utf8 0 0" | sudo tee -a /etc/fstab
   ```

3. **Update config.js with correct path:**
   ```javascript
   recordings: {
       temporaryLocation: '/mnt/3cx-recordings',
       // ...
   }
   ```

### Getting Help

**Log Locations:**
- **Nginx:** `/var/log/nginx/error.log`
- **Admin API:** `pm2 logs wallboard-api`
- **Browser Console:** F12 > Console tab
- **Network Requests:** F12 > Network tab

**Diagnostic Commands:**
```bash
# Check service status
sudo systemctl status nginx
pm2 status

# Check API health
curl http://localhost:3001/health

# View real-time logs
tail -f /var/log/nginx/error.log
pm2 logs wallboard-api --lines 50
```

**Contact:**
- **System Owner:** stephen@pentanet.com.au
- **Support:** +61 8 9466 2670
- **Partner:** Aatrox Communications Limited

---

## Maintenance

### Daily Tasks
- Check flagged calls in admin panel
- Review email alerts

### Weekly Tasks
- Review agent performance metrics
- Generate weekly reports

### Monthly Tasks
- Check license expiry (Current: Oct 17, 2026)
- Review system logs
- Update admin panel passwords
- Backup database:
  ```bash
  cp /var/www/html/wallboard/server/data/wallboard.db \
     /var/backups/wallboard-$(date +%Y%m%d).db
  ```

### Updates
```bash
# Update wallboard
cd /var/www/html/wallboard
git pull  # Or copy new files
npm install  # In server directory
pm2 restart wallboard-api
sudo systemctl reload nginx
```

---

## Security Checklist

- [ ] Changed default admin password
- [ ] JWT secret changed from default
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (only 80/443 open to internet)
- [ ] Admin panel access restricted (consider IP whitelist)
- [ ] Email credentials stored securely (not in config files)
- [ ] Database backups enabled
- [ ] Service Principal has minimum required permissions
- [ ] Audit log enabled and monitored

---

**Installation Date:** _____________
**Installed By:** _____________
**Verified By:** stephen@pentanet.com.au

**Document Version:** 1.0
**Last Updated:** January 20, 2025
