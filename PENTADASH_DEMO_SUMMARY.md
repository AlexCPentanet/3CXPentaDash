# Pentadash Demo - Deployment Summary

## Overview
A dedicated demo instance of the Pentanet 3CX Dashboard has been successfully created and deployed for UI QC and review purposes. The demo runs independently from the main application with its own database, configuration, and ports.

---

## Access Information

### Local Access (From Host Machine)
**Primary URL:** http://localhost:9443/
**Alternative URL:** http://10.71.40.52:9443/

### Network Access (From Other Machines)
**URL:** http://10.71.40.52:9443/

> **Note:** Ensure Windows Firewall allows inbound connections on ports 9443 and 9444 if accessing from other machines on the network.

---

## Login Credentials

### Admin Accounts (Full Access)
| Username | Password | Purpose |
|----------|----------|---------|
| **admin** | Admin123! | Primary admin account |
| **qc** | QC123! | QC and UI review |

### Manager Accounts (Dashboard Access)
| Username | Password | Purpose |
|----------|----------|---------|
| **manager** | Manager123! | Manager dashboard testing |
| **demo** | Demo123! | General demonstration |

### Viewer Account (Read-Only)
| Username | Password | Purpose |
|----------|----------|---------|
| **viewer** | Viewer123! | Public wallboard only |

---

## Server Status

### Currently Running
✅ **Server is ACTIVE and RUNNING**

**Process Details:**
- API Port: 9444
- Web Port: 9443
- Environment: Development
- Database: C:\Users\alex.campkin\Documents\Project\pentadashdemo\data\database\dashboard-demo.db
- Mode: Simulated data with live infrastructure feeds

### Server Control

**Start Server:**
```cmd
cd c:\Users\alex.campkin\Documents\Project\pentadashdemo
start-demo.bat
```

**Stop Server:**
Press `Ctrl+C` in the console window

**Restart Server:**
1. Stop current instance (Ctrl+C)
2. Run start-demo.bat again

---

## Dashboard Features Available

### 1. Public Wallboard
**URL:** http://localhost:9443/
**Login Required:** No

**Features:**
- Real-time KPI dashboard
- Queue status monitoring
- Agent status grid (12 agents)
- Call volume charts (24-hour view)
- Sentiment trend analysis
- Recent activity feed
- Top performers leaderboard
- System health indicators
- Dark/Light theme toggle

### 2. Manager Dashboard
**URL:** http://localhost:9443/manager
**Login:** manager / Manager123! (or demo / Demo123!)

**Tabs Available:**
1. **Overview** - Comprehensive KPI dashboard with charts
2. **Call Flow** - Interactive SVG call flow diagram showing:
   - Trunk connections
   - IVR routing
   - Queue distribution
   - Agent groups
   - Voicemail boxes
   - Drop rate visualization
3. **Recordings** - Call recording access and search
4. **Flagged Calls** - 5 demo calls with sentiment analysis:
   - DEMO-001: HIGH - TIO mention
   - DEMO-002: HIGH - Legal threat
   - DEMO-003: MEDIUM - Escalation
   - DEMO-004: MEDIUM - Cancellation
   - DEMO-005: POSITIVE - Satisfaction
5. **Agent Analytics** - Individual agent performance metrics
6. **Reports** - PDF report generation
7. **TIO Monitoring** - Compliance tracking

### 3. Admin Panel
**URL:** http://localhost:9443/admin
**Login:** admin / Admin123! (or qc / QC123!)

**Configuration Sections:**
1. Dashboard - Quick stats and health checks
2. 3CX API Config - API credentials testing
3. Email Settings - SMTP configuration
4. Branding & Colors - UI customization
5. User Management - CRUD operations for users
6. Permissions - Role-based access control
7. Keyword Management - Sentiment keywords (30+ configured)
8. Tower Locations - Infrastructure management
9. Alert Settings - Threshold configuration
10. Map Configuration - Layer visibility defaults
11. Widget Settings - Dashboard customization
12. System Settings - Global configuration
13. Audit Log - Complete audit trail

### 4. Infrastructure Map
**URL:** http://localhost:9443/map
**Login:** Any authenticated user

**Map Features:**
- **8 Pentanet Towers** with coverage radius visualization:
  1. Perth CBD Tower (5km radius)
  2. Fremantle Tower (8km radius)
  3. Joondalup Tower (6km radius)
  4. Morley Tower (5km radius)
  5. Rockingham Tower (7km radius)
  6. Midland Tower (6km radius)
  7. Armadale Tower (5.5km radius)
  8. Scarborough Tower (4.5km radius)

- **Live Infrastructure Feeds** (simulated, updates every 5 minutes):
  - NBN Outages (Perth metro area)
  - Western Power Outages
  - Fire Incidents (Emergency WA)
  - Flood Warnings

- **Interactive Features:**
  - Toggle layers on/off
  - Click markers for details
  - Address lookup tool
  - Real-time updates
  - Impact analysis (tower-incident proximity)

---

## Demo Data Populated

### Users (5 accounts)
- 2 Admin users (admin, qc)
- 2 Manager users (manager, demo)
- 1 Viewer user (viewer)

### Tower Locations (8 towers)
All located in Perth metropolitan area with realistic addresses and service types (Fiber, 5G, 4G, Fixed Wireless)

### Flagged Calls (5 samples)
Representative examples of:
- High severity compliance issues
- Legal threats
- Escalation requests
- Churn risk
- Positive feedback

### Keywords (30+ configured)
- High severity: lawsuit, lawyer, TIO, legal action (9 keywords)
- Medium severity: complaint, frustrated, manager, refund (10 keywords)
- Low severity: slow, expensive, confusing (4 keywords)
- Positive: thank you, excellent, helpful (7 keywords)

### Infrastructure Data
Simulated feeds provide realistic Perth-area outage and incident data

---

## Technical Specifications

### Technology Stack
- **Backend:** Node.js 20 LTS + Express.js 4.18.2
- **Database:** SQLite 3
- **Frontend:** HTML5 + Vanilla JavaScript (ES6+)
- **Charts:** Chart.js 4.4.0
- **Maps:** Leaflet 1.9.4
- **WebSocket:** ws 8.14.2
- **Authentication:** JWT + bcrypt

### Ports Used
- **9443** - Web interface (HTTP)
- **9444** - API server (HTTP)
- **WebSocket** - ws://localhost:9444/ws

### File Locations
**Demo Root:** `c:\Users\alex.campkin\Documents\Project\pentadashdemo`

**Key Files:**
- Database: `data/database/dashboard-demo.db`
- Server: `server/server.js`
- Config: `server/.env`
- Startup: `start-demo.bat` or `start-demo.ps1`

**Documentation:**
- `README_DEMO.md` - Quick start
- `DEMO_ACCESS_INSTRUCTIONS.md` - Complete guide
- `QUICK_REFERENCE.txt` - Quick reference card

---

## Network Configuration

### Firewall Rules
If accessing from other machines, add Windows Firewall rules:

```cmd
netsh advfirewall firewall add rule name="Pentadash Demo Web" dir=in action=allow protocol=TCP localport=9443
netsh advfirewall firewall add rule name="Pentadash Demo API" dir=in action=allow protocol=TCP localport=9444
```

### Host Information
- **Machine:** alex.campkin workstation
- **IP Address:** 10.71.40.52
- **Subnet:** 10.71.40.0/24
- **OS:** Windows

---

## QC Testing Checklist

### Authentication & Security
- [ ] Test login with all 5 accounts
- [ ] Verify role-based access (viewer can't access /admin)
- [ ] Test logout functionality
- [ ] Verify session timeout behavior
- [ ] Check password validation

### UI/UX Testing
- [ ] Test dark/light theme toggle
- [ ] Verify responsive design
- [ ] Check color scheme consistency
- [ ] Test navigation flow
- [ ] Verify all buttons are clickable
- [ ] Check form validation
- [ ] Test modal dialogs

### Public Wallboard
- [ ] Verify real-time KPI updates
- [ ] Check queue status display
- [ ] Test agent grid rendering
- [ ] Verify chart visualizations
- [ ] Check activity feed scrolling
- [ ] Test theme persistence

### Manager Dashboard
- [ ] Test all 7 tabs
- [ ] Verify call flow diagram interactivity
- [ ] Test flagged calls filtering
- [ ] Check report generation (PDF)
- [ ] Verify agent analytics charts
- [ ] Test recording table

### Admin Panel
- [ ] Test user creation/editing
- [ ] Verify keyword management
- [ ] Test tower CSV import
- [ ] Check branding changes
- [ ] Verify email config
- [ ] Test API connection testing
- [ ] Check audit log

### Infrastructure Map
- [ ] Verify all 8 towers display
- [ ] Test layer toggles
- [ ] Check marker popups
- [ ] Verify coverage circles
- [ ] Test address lookup
- [ ] Check simulated outages display

### Performance
- [ ] Test page load times
- [ ] Verify real-time updates (3-5 sec)
- [ ] Check WebSocket connectivity
- [ ] Test with multiple browser tabs
- [ ] Verify no memory leaks

### Cross-Browser
- [ ] Chrome
- [ ] Edge
- [ ] Firefox
- [ ] Safari (if available)

---

## Troubleshooting

### Server Not Accessible
1. Check server is running (console should show startup logs)
2. Verify ports 9443/9444 are listening: `netstat -an | findstr 944`
3. Check Windows Firewall settings
4. Try accessing via IP: http://10.71.40.52:9443/

### Login Issues
1. Verify username/password (case-sensitive)
2. Check browser console (F12) for errors
3. Clear browser cache and cookies
4. Try different browser

### Map Not Loading
1. Check internet connection (Leaflet tiles from CDN)
2. Verify user is logged in
3. Check browser console for JavaScript errors
4. Ensure WebGL is enabled

### No Infrastructure Data
1. Wait 5 minutes for first update cycle
2. Check server console for infrastructure service logs
3. Data is simulated in demo mode (expected behavior)

### Database Issues
Reset demo data:
```cmd
cd c:\Users\alex.campkin\Documents\Project\pentadashdemo\server
node init-demo-db.js
```

---

## Next Steps

### For QC Review
1. **Access the dashboard** at http://localhost:9443/
2. **Login with QC account:** qc / QC123!
3. **Test all features** using the checklist above
4. **Document any issues** found
5. **Provide feedback** on:
   - UI/UX design and layout
   - Feature functionality
   - Performance
   - Bugs or errors
   - Suggested improvements

### After Approval
1. Incorporate QC feedback
2. Deploy to production 3CX server
3. Configure real API credentials
4. Set up production SMTP
5. Import actual tower data
6. Enable live infrastructure APIs
7. Configure SSL certificates
8. Set up backup procedures

---

## Support

### Common Issues
See `DEMO_ACCESS_INSTRUCTIONS.md` for detailed troubleshooting guide

### Resetting Demo
To completely reset to initial state:
```cmd
cd server
node init-demo-db.js
```

### Logs
Server logs are displayed in the console window. Watch for:
- API requests (timestamps and endpoints)
- Database operations
- Infrastructure monitoring updates
- WebSocket connections
- Error messages

---

## Version Information

**Demo Version:** 1.0.0-DEMO
**Created:** October 22, 2025
**Purpose:** UI QC and Review
**Status:** Active and Running
**Environment:** Local Development
**Data Mode:** Simulated with live updates

---

## Summary

✅ **Demo instance successfully created and deployed**
✅ **Server running on ports 9443 (Web) and 9444 (API)**
✅ **5 user accounts created with different role levels**
✅ **8 tower locations populated across Perth metro**
✅ **5 flagged calls for sentiment analysis testing**
✅ **30+ keywords configured for monitoring**
✅ **Live infrastructure feeds enabled (simulated)**
✅ **Complete documentation provided**

**You can now access the demo at:**
- **Local:** http://localhost:9443/
- **Network:** http://10.71.40.52:9443/

**Login as QC Reviewer:**
- Username: **qc**
- Password: **QC123!**

---

*Happy Testing!*
