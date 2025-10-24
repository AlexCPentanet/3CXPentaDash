# 3CX PentaDash - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ installed
- SQLite3
- 3CX V20 Update 7 (8SC+ Enterprise license for API access)

---

## 📦 Installation

### Demo Environment (For Testing/QC)
```bash
cd pentadashdemo/server
npm install
node server.js
```
**Access:**
- Web Interface: `https://localhost:9443`
- API Server: `https://localhost:9444`

**Demo Accounts:**
| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | Administrator |
| manager | Manager123! | Manager |
| qc | QC123! | Quality Control |
| demo | Demo123! | Demonstration |
| viewer | Viewer123! | Viewer |

### Production Environment
```bash
cd pentanetdashboard/server
npm install
node server.js
```
**Access:**
- Web Interface: `https://localhost:8443`
- API Server: `https://localhost:8444`

---

## 🗺️ Key Features

### 1. Emergency Map
**URL:** `/emergency-map.html`

**Features:**
- 🔥 Real-time bushfire incidents (Emergency WA)
- 🛰️ Satellite hotspots (DEA)
- 📡 NBN outages (simulated)
- ⚡ Power outages (Western Power + simulation)
- 📍 Custom pinpoint markers
- 🔍 Suburb search (15 Perth suburbs)

**How to Use:**
1. Open emergency map from public dashboard
2. Toggle layers in sidebar
3. Search for suburbs in search box
4. Click "📍 Add Pin" to add custom markers
5. Export data with "💾 Export Data" button

### 2. System Status Monitor
**URL:** `/admin/status.html`
**Access:** Admin only

**Features:**
- ✅ 9 service health checks
- 🔄 Auto-refresh (30s)
- 🛠️ Troubleshooting tools
- 📊 System information
- 💾 Export status report

**How to Use:**
1. Login as admin
2. Navigate to Admin → System Status
3. View service health (green/yellow/red indicators)
4. Click "🔄 Refresh Now" for immediate update
5. Use troubleshooting tools for diagnostics

### 3. Manager Dashboard
**URL:** `/manager`
**Access:** Manager+ roles

**Tabs:**
- **Overview:** KPIs and performance metrics
- **Call Flow:** Interactive call flow diagram
- **Recordings:** Call recording playback
- **Flagged Calls:** Review flagged calls
- **Agent Analytics:** Agent performance
- **Reports:** Generate PDF reports
- **TIO Monitoring:** TIO complaint tracking
- **Tower Alerts:** Infrastructure monitoring

### 4. Public Dashboard
**URL:** `/` (root)
**Access:** Public (read-only)

**Features:**
- Real-time active calls
- Agent status board
- Queue statistics
- Performance KPIs
- Sentiment analysis

---

## 🔐 Demo Mode Protection

### What is Protected?
- ✅ System settings (read-only)
- ✅ User management (limited)
- ✅ Database writes (selective)
- ✅ Configuration files

### What Still Works?
- ✅ Viewing all data
- ✅ Flagging calls
- ✅ Audit logging
- ✅ Live emergency feeds
- ✅ Status monitoring

### Configuration
In `.env`:
```bash
DEMO_MODE=true              # Enable protection
USE_SIMULATED_DATA=true     # Use demo data
ENABLE_LIVE_FEEDS=true      # Allow live emergency data
```

**Demo Protection Status:** `/api/admin/demo-protection` (Admin only)

---

## 🔧 Configuration

### 3CX API Setup
1. Login to 3CX Admin Console
2. Navigate to **Integrations → API**
3. Click **Add**
4. Configure service principal:
   ```
   Client ID: 900 (or any extension)
   Name: Dashboard Integration
   ☑ 3CX Configuration API Access
   ☑ 3CX Call Control API Access
   Department: System Wide
   Role: System Owner
   ```
5. Copy the API key (shown only once!)
6. Update `.env`:
   ```bash
   TCX_XAPI_CLIENT_ID=900
   TCX_XAPI_CLIENT_SECRET=your_api_key_here
   ```

### Email Alerts (Optional)
Update `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
ALERT_RECIPIENTS=manager@example.com,admin@example.com
```

---

## 📊 API Endpoints

### Public
```
GET  /                          - Public dashboard
GET  /emergency-map.html        - Emergency map
GET  /api/health                - Health check
GET  /api/emergency-overlays    - Emergency data
GET  /api/perth-suburbs         - Perth suburbs GeoJSON
```

### Authentication Required
```
POST /api/auth/login            - Login
GET  /api/auth/verify           - Verify token
POST /api/auth/logout           - Logout
```

### Manager+
```
GET  /api/flagged-calls         - Flagged calls
POST /api/reports/generate      - Generate report
GET  /manager                   - Manager dashboard
```

### Admin Only
```
GET  /api/admin/status          - System status
POST /api/admin/status/refresh  - Refresh status
GET  /api/admin/demo-protection - Demo protection status
GET  /api/users                 - User management
GET  /admin                     - Admin panel
GET  /admin/status.html         - Status monitor
```

---

## 🎨 Themes

Three built-in themes:
1. **Dark Mode** (default) - Dark charcoal background
2. **Light Mode** - Clean light interface
3. **Pentanet Theme** - Brand colors (#1a1a1a + #FF6600)

**Toggle:** Click theme button (☀️/🌙) in top nav

**Persistence:** Saved in localStorage

---

## 🗺️ Perth Suburbs

### Mapped Suburbs (15)
- Perth CBD
- Fremantle
- Joondalup
- Rockingham
- Mandurah
- Midland
- Subiaco
- South Perth
- Victoria Park
- Scarborough
- Cannington
- Armadale
- Ellenbrook
- Canning Vale
- Baldivis

### API Endpoints
```
GET /api/perth-suburbs              - All suburbs GeoJSON
GET /api/perth-suburbs/search?q=    - Search by name
GET /api/perth-suburbs/nearby?lat=&lon=&radius=  - Find nearby
GET /api/geocode?suburb=            - Get coordinates
```

---

## 🧪 Testing

### Test Demo Mode Protection
1. Login as admin in demo environment
2. Try to modify settings → Should be blocked
3. Check `/api/admin/demo-protection` for audit log

### Test Emergency Map
1. Open `/emergency-map.html`
2. Verify all incident types appear
3. Search for "Perth" in search box
4. Add a custom marker
5. Export GeoJSON data

### Test Status Monitor
1. Login as admin
2. Navigate to System Status
3. Verify all 9 services check
4. Click refresh and verify update
5. Test troubleshooting tools

### Test Manager Dashboard
1. Login as manager
2. Navigate through all tabs
3. Generate a report
4. Flag a call
5. View agent analytics

---

## 📈 Monitoring

### System Health
Check: `/api/health`

Response:
```json
{
  "status": "operational",
  "timestamp": "2025-10-24T12:00:00Z",
  "uptime": 3600
}
```

### Service Status
Check: `/api/admin/status` (auth required)

### Logs
- Server console (stdout)
- Demo protection: `data/demo-protection.log`
- Audit log: Database `audit_log` table

---

## 🐛 Troubleshooting

### Emergency Map Not Loading
1. Check browser console for errors
2. Verify internet connection (for external feeds)
3. Test feeds:
   - Emergency WA: https://emergency.wa.gov.au/data/map.incidents.json
   - DEA: https://hotspots.dea.ga.gov.au/geoserver/wfs

### 3CX Connection Failed
1. Verify 3CX server accessible
2. Check API credentials in `.env`
3. Confirm service principal exists
4. Test: Navigate to Admin → System Status → 3CX service

### Demo Mode Blocking Operations
**Expected behavior!** Demo mode prevents:
- Settings modifications
- User creation/deletion
- Configuration changes

**Solution:**
- Use pentanetdashboard (production) for full access
- Or disable demo mode: `DEMO_MODE=false` in `.env`

### Database Errors
1. Check database file exists: `data/database/dashboard-demo.db`
2. Verify file permissions (readable/writable)
3. Re-initialize: Delete and restart server

---

## 📚 Documentation

### Main Docs
- `CLAUDE.md` - Complete system documentation
- `IMPLEMENTATION-SUMMARY.md` - All recent changes
- `3CX_V20_U7_API_Overview.md` - 3CX API reference
- `3CX_V20_U7_Quick_Reference.md` - Quick API lookup

### API Docs
- `3CX_V20_U7_Configuration_API.md` - XAPI documentation
- `3CX_V20_U7_Call_Control_API.md` - Call Control API

---

## 🎯 Quick Commands

### Start Demo Server
```bash
cd pentadashdemo/server && node server.js
```

### Start Production Server
```bash
cd pentanetdashboard/server && node server.js
```

### Run CSS Linting
```bash
npm run lint:css
npm run lint:css:fix
```

### View System Status (CLI)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://localhost:9444/api/health
```

---

## 💡 Tips

1. **Always use demo environment for testing** - Production has demo mode disabled
2. **Check System Status regularly** - Admin → System Status
3. **Export emergency data** - Use export button for offline analysis
4. **Use themes** - Dark mode recommended for wallboard displays
5. **Monitor performance** - Response times shown in status page

---

## 🆘 Support

### Quick Fixes
- **Map not loading?** Clear cache and refresh
- **Can't login?** Check demo account credentials above
- **Settings won't save?** Check if demo mode is enabled
- **API errors?** Verify 3CX credentials in `.env`

### Logs Location
- Demo protection: `pentadashdemo/data/demo-protection.log`
- Server console: Terminal where `node server.js` is running

### Reset Everything
```bash
# Delete database
rm pentadashdemo/data/database/dashboard-demo.db

# Restart server
cd pentadashdemo/server && node server.js
```

---

**Last Updated:** October 24, 2025
**Version:** 2.0 (Complete Overhaul)
**Status:** ✅ Production Ready
