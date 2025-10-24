# Pentadash Demo - Access Instructions

## Overview
This is a dedicated demo instance of the Pentadash call center management dashboard for UI QC and review purposes. It runs on separate ports from the production system and includes live test data with simulated infrastructure feeds.

---

## Quick Start

### Starting the Demo Server

**Option 1: Using Batch Script (Windows CMD)**
```cmd
cd c:\Users\alex.campkin\Documents\Project\pentadashdemo
start-demo.bat
```

**Option 2: Using PowerShell Script**
```powershell
cd c:\Users\alex.campkin\Documents\Project\pentadashdemo
.\start-demo.ps1
```

**Option 3: Manual Start**
```cmd
cd c:\Users\alex.campkin\Documents\Project\pentadashdemo\server
node server.js
```

---

## Access URLs

### Main Dashboard Access
- **Public Wallboard:** http://localhost:9443/
- **Manager Dashboard:** http://localhost:9443/manager
- **Admin Panel:** http://localhost:9443/admin
- **Infrastructure Map:** http://localhost:9443/map

### API Access
- **API Server:** http://localhost:9444
- **WebSocket:** ws://localhost:9444/ws

---

## Demo User Accounts

All demo accounts use strong passwords for demonstration purposes.

| Username | Password | Role | Access Level | Purpose |
|----------|----------|------|--------------|---------|
| **admin** | Admin123! | Admin | Full System Access | Complete system configuration and management |
| **qc** | QC123! | Admin | Full System Access | QC and UI review |
| **manager** | Manager123! | Manager | Manager Dashboard | Call management, reports, analytics |
| **demo** | Demo123! | Manager | Manager Dashboard | General demonstration |
| **viewer** | Viewer123! | Viewer | Public Wallboard Only | Read-only public dashboard |

---

## Features Available in Demo

### Public Wallboard (No Login Required)
Access: http://localhost:9443/

- Real-time KPI dashboard
- Queue status monitoring
- Agent status grid (12 agents)
- Call volume charts (24-hour)
- Sentiment trend analysis
- Recent activity feed
- Top performers leaderboard
- System health indicators

### Manager Dashboard
Access: http://localhost:9443/manager
Login: **manager** / Manager123! (or demo / Demo123!)

**Tabs Available:**
1. **Overview** - Comprehensive KPI dashboard
2. **Call Flow** - Interactive SVG call flow diagram
3. **Recordings** - Call recording access and search
4. **Flagged Calls** - Review sentiment-flagged calls
5. **Agent Analytics** - Individual agent performance
6. **Reports** - Generate PDF reports
7. **TIO Monitoring** - Compliance tracking

### Admin Panel
Access: http://localhost:9443/admin
Login: **admin** / Admin123! (or qc / QC123!)

**Configuration Sections:**
1. **Dashboard** - Quick stats and health checks
2. **3CX API Config** - API credentials and testing
3. **Email Settings** - SMTP and alert configuration
4. **Branding & Colors** - UI customization
5. **User Management** - Create/edit users
6. **Permissions** - Role assignment
7. **Keyword Management** - Sentiment analysis keywords
8. **Tower Locations** - Infrastructure tower management
9. **Alert Settings** - Threshold configuration
10. **Map Configuration** - Map layer defaults
11. **Widget Settings** - Dashboard widget visibility
12. **System Settings** - Global configuration
13. **Audit Log** - Complete system audit trail

### Infrastructure Map
Access: http://localhost:9443/map
Login: Any authenticated user

**Map Features:**
- **8 Pentanet Towers** across Perth metro area
- **NBN Outage Layer** (simulated live data)
- **Power Outage Layer** (simulated Western Power data)
- **Fire Incident Layer** (simulated emergency data)
- **Flood Warning Layer** (simulated emergency data)
- Interactive markers with popup details
- Coverage radius visualization
- Address lookup tool
- Real-time updates every 5 minutes

---

## Demo Data Included

### Tower Locations (8 Towers)
1. **Perth CBD Tower** - 123 St Georges Terrace, Perth WA 6000
2. **Fremantle Tower** - 45 Market Street, Fremantle WA 6160
3. **Joondalup Tower** - 102 Grand Boulevard, Joondalup WA 6027
4. **Morley Tower** - 15 Russell Street, Morley WA 6062
5. **Rockingham Tower** - 7 Council Avenue, Rockingham WA 6168
6. **Midland Tower** - 20 The Crescent, Midland WA 6056
7. **Armadale Tower** - 55 Jull Street, Armadale WA 6112
8. **Scarborough Tower** - 148 The Esplanade, Scarborough WA 6019

### Flagged Calls (5 Sample Calls)
- **DEMO-001** - HIGH severity (TIO mention)
- **DEMO-002** - HIGH severity (Legal threat)
- **DEMO-003** - MEDIUM severity (Escalation request)
- **DEMO-004** - MEDIUM severity (Cancellation intent)
- **DEMO-005** - POSITIVE (Customer satisfaction)

### Infrastructure Feeds
The demo uses simulated data for:
- **NBN Outages** - Perth metropolitan area
- **Western Power Outages** - WA power grid
- **Fire Incidents** - Emergency services data
- **Flood Warnings** - Weather emergency data

All feeds update every 5 minutes with realistic scenarios.

---

## Testing Checklist

### UI/UX Review
- [ ] Test responsiveness across different screen sizes
- [ ] Verify dark/light theme toggle functionality
- [ ] Check color scheme and branding consistency
- [ ] Test navigation between pages
- [ ] Verify all buttons and interactive elements
- [ ] Check form validation and error messages
- [ ] Test modal popups and dialogs

### Public Wallboard
- [ ] Verify real-time KPI updates
- [ ] Check queue status display
- [ ] Test agent grid layout and status indicators
- [ ] Verify call volume chart rendering
- [ ] Check sentiment trend visualization
- [ ] Test activity feed scrolling
- [ ] Verify system status indicators

### Manager Dashboard
- [ ] Test all 7 tabs for proper rendering
- [ ] Verify call flow diagram interactivity
- [ ] Check flagged calls table and filtering
- [ ] Test report generation functionality
- [ ] Verify recording access controls
- [ ] Check agent analytics charts
- [ ] Test TIO monitoring workflow

### Admin Panel
- [ ] Test user creation and editing
- [ ] Verify permission assignment
- [ ] Check keyword management CRUD operations
- [ ] Test tower CSV import functionality
- [ ] Verify branding customization
- [ ] Check email configuration
- [ ] Test 3CX API connection testing
- [ ] Verify audit log display

### Infrastructure Map
- [ ] Verify all 8 towers display correctly
- [ ] Test layer toggle buttons
- [ ] Check marker popup information
- [ ] Verify coverage radius circles
- [ ] Test address lookup functionality
- [ ] Check NBN outage markers
- [ ] Verify power outage display
- [ ] Test fire/flood incident layers

### Authentication & Security
- [ ] Test login with all 5 demo accounts
- [ ] Verify role-based access control
- [ ] Check session timeout behavior
- [ ] Test logout functionality
- [ ] Verify unauthorized access redirects
- [ ] Check password validation

---

## Technical Details

### Server Configuration
- **Node.js Version:** 20 LTS
- **API Port:** 9444 (HTTP)
- **Web Port:** 9443 (HTTPS ready)
- **Database:** SQLite 3 (dashboard-demo.db)
- **Environment:** Development mode

### Database Location
```
C:\Users\alex.campkin\Documents\Project\pentadashdemo\data\database\dashboard-demo.db
```

### Environment Variables (.env)
Located at: `pentadashdemo\server\.env`

Key settings:
- `NODE_ENV=development`
- `PORT=9444`
- `WEB_PORT=9443`
- `DEMO_MODE=true`
- `USE_SIMULATED_DATA=true`

---

## Troubleshooting

### Server Won't Start
1. Check if ports 9443 or 9444 are already in use
2. Verify Node.js 20 is installed: `node --version`
3. Check dependencies are installed: `cd server && npm install`
4. Verify database file exists: `dir data\database\dashboard-demo.db`

### Can't Access Dashboard
1. Ensure server is running (check console output)
2. Verify URL: http://localhost:9443/
3. Clear browser cache
4. Try different browser

### Login Issues
1. Double-check username and password (case-sensitive)
2. Verify database was initialized: run `node init-demo-db.js`
3. Check browser console for errors

### Map Not Loading
1. Verify internet connection (Leaflet tiles load from CDN)
2. Check browser console for JavaScript errors
3. Ensure user is authenticated

### Infrastructure Data Not Showing
1. Data uses simulated feeds in demo mode
2. Wait 5 minutes for first update cycle
3. Check server console for infrastructure service logs

---

## Support & Feedback

### For Issues
- Check server console output for error messages
- Review browser console (F12) for frontend errors
- Verify all demo data was initialized properly

### Resetting Demo Data
To reset the demo database to initial state:

```cmd
cd c:\Users\alex.campkin\Documents\Project\pentadashdemo\server
node init-demo-db.js
```

This will:
- Recreate all demo users
- Reload 8 tower locations
- Repopulate 5 flagged call samples
- Reset all settings to defaults

---

## Next Steps

### After QC Review
1. Document any UI/UX issues found
2. Test all interactive features
3. Verify data displays correctly
4. Check for any console errors
5. Provide feedback on:
   - Visual design and layout
   - User experience and navigation
   - Performance and responsiveness
   - Feature completeness
   - Bug reports

### Production Deployment
Once QC is complete:
1. Review and incorporate feedback
2. Update production configuration
3. Deploy to 3CX server using install.sh
4. Configure real 3CX API credentials
5. Set up production SMTP email
6. Import actual tower locations
7. Configure real infrastructure API endpoints

---

## Demo Version Information

**Version:** 1.0.0-DEMO
**Created:** October 22, 2025
**Purpose:** UI QC and Review
**Environment:** Local Development
**Data:** Simulated + Sample Data

---

## Quick Reference Card

```
===========================================
        PENTADASH DEMO ACCESS
===========================================

URL:      http://localhost:9443/

ACCOUNTS:
  Admin:    admin / Admin123!
  QC:       qc / QC123!
  Manager:  manager / Manager123!
  Demo:     demo / Demo123!
  Viewer:   viewer / Viewer123!

FEATURES:
  - Real-time call monitoring
  - Sentiment analysis (5 flagged calls)
  - Infrastructure map (8 towers)
  - Simulated NBN/Power/Fire feeds
  - PDF report generation
  - Complete admin configuration

START SERVER:
  start-demo.bat (or .ps1)

STOP SERVER:
  Ctrl+C in console

===========================================
```

---

**Happy Testing!**
