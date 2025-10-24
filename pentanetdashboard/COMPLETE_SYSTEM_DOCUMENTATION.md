# Pentanet 3CX Dashboard - Complete System Documentation

**Version:** 1.0.0
**Date:** October 21, 2025
**System:** Production-Ready for Pentanet (Perth, WA, Australia)

---

## Executive Summary

The Pentanet 3CX Dashboard is a comprehensive call center monitoring and management system specifically designed for Pentanet, an Australian ISP based in Perth, Western Australia. The system provides real-time call monitoring, sentiment analysis, infrastructure monitoring (NBN, power, fires), and complete administrative control.

### Key Features

✅ **Real-Time Call Monitoring** - Live WebSocket integration with 3CX
✅ **Interactive Call Flow Diagram** - Visual call routing with drop rate indicators
✅ **Sentiment Analysis** - 60+ keyword detection with TIO compliance
✅ **Australian Infrastructure Monitoring** - NBN, power outages, fire/flood alerts
✅ **Tower Impact Analysis** - Automated tower incident detection and email alerts
✅ **Comprehensive Admin Panel** - Full system configuration
✅ **Modular Widget System** - Customizable dashboards
✅ **3-Tier Permissions** - Public/Manager/Admin roles
✅ **Automated Installation** - One-command deployment on 3CX server

---

## System Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend Runtime | Node.js 20 LTS | Server-side JavaScript execution |
| Web Framework | Express.js 4.18 | REST API and routing |
| Database | SQLite 3 | Lightweight embedded database |
| Authentication | JWT + bcrypt | Secure token-based auth |
| WebSocket | ws library | Real-time bidirectional communication |
| Charts | Chart.js 4.4 | Interactive data visualization |
| Maps | Leaflet 1.9 | Interactive maps with custom markers |
| PDF Generation | PDFKit | Report generation |
| Email | nodemailer | SMTP email delivery |
| 3CX Integration | Custom API Client | XAPI + Call Control API |

### File Structure

```
pentanetdashboard/
├── server/
│   ├── server.js                      # Main Express application
│   ├── threecx-api-client.js          # 3CX XAPI & Call Control client
│   ├── au-infrastructure-service.js   # NBN/Power/Fire monitoring
│   ├── email-service.js               # Email alerts
│   ├── report-generator.js            # PDF reports
│   ├── sentiment-service.js           # Sentiment analysis
│   ├── database-schema.sql            # Database structure
│   └── package.json                   # Node.js dependencies
├── public/
│   ├── index.html                     # Public wallboard
│   ├── manager/
│   │   └── index.html                 # Manager dashboard
│   ├── admin/
│   │   └── index.html                 # Admin panel
│   ├── setup/
│   │   └── index.html                 # Setup wizard
│   ├── map/
│   │   └── index.html                 # Infrastructure map
│   ├── css/
│   │   ├── wallboard.css              # Main styles
│   │   ├── manager.css                # Manager styles
│   │   └── admin.css                  # Admin styles
│   └── js/
│       ├── wallboard-app.js           # Public wallboard logic
│       ├── manager-app.js             # Manager dashboard logic
│       ├── admin-app.js               # Admin panel logic
│       ├── call-flow.js               # Interactive call flow diagram
│       └── infrastructure-map.js      # Map functionality
├── config.pentanet.js                 # Pentanet system configuration
├── install.sh                         # Automated installation script
├── examples/
│   └── towers-example.csv             # Example tower CSV import
└── docs/
    ├── SYSTEM_VALIDATION.md           # API compliance validation
    ├── PENTANET_INSTALLATION.md       # Installation guide
    └── COMPLETE_SYSTEM_DOCUMENTATION.md  # This file
```

---

## Dashboards

### 1. Public Wallboard (`/`)

**Purpose:** Live call center monitoring visible to all employees
**Access:** Public (no login required)
**Features:**
- Real-time KPIs (Active Calls, Waiting, Available Agents, Avg Wait Time, Sentiment)
- Sparkline charts showing trends
- Queue status monitoring (Investor Line, NOC, Delivery)
- Agent status grid (12 agents with color-coded badges)
- Call volume chart (24-hour view)
- Sentiment trends chart
- Recent call activity feed
- Top performers leaderboard (positive focus, no shaming)
- System status indicators
- Today's statistics
- Dark/Light theme toggle
- Login button (top right) for managers/admins

**Design:** Grafana-inspired modern interface, fully responsive

### 2. Manager Dashboard (`/manager`)

**Purpose:** Enhanced monitoring and call management
**Access:** Manager role required
**Features:**

**Overview Tab:**
- Performance KPIs with comparisons
- Call volume by hour chart
- Department performance chart
- Agent performance table with confidence scores

**Call Flow Tab:**
- Interactive SVG call flow diagram
- Live call animations (pulsing active calls)
- Drop rate indicators (>20% = high alert, red; >10% = medium, orange)
- Real-time stats (active calls, queued, dropped, drop rate)
- Pentanet-specific flow (Virtutel trunk → IVR → 3 queues → 12 agents → voicemail)
- Hover tooltips with detailed information
- Export to PDF capability
- Toggle to show/hide live calls

**Recordings Tab:**
- Filterable recording table (date range, extension, caller, department)
- Play/download recordings from SMB share
- CSV export

**Flagged Calls Tab:**
- Flagged calls statistics (high/medium/low severity)
- Trend chart
- Filterable table
- Review interface with notes
- PDF/CSV export
- Individual call reports

**Agents Tab:**
- Agent selection dropdown
- Individual agent analytics
- Confidence scores
- Sentiment history
- Call duration trends
- 3CX AI coaching integration

**Reports Tab:**
- Weekly performance report generator
- Custom date range reports
- Performance summary
- Department analysis
- Agent performance

**TIO Monitoring Tab:**
- TIO (Telecommunications Industry Ombudsman) specific tracking
- Australian telecom compliance
- Automatic severe flagging on "TIO" keyword
- Date range filtering
- Status tracking (under review/complete)
- PDF report generation per TIO incident
- Long-term storage
- Charts showing frequency

### 3. Admin Panel (`/admin`)

**Purpose:** Complete system configuration and management
**Access:** Admin role required
**Features:**

**Dashboard Tab:**
- Quick stats (users, flagged calls, towers, alerts)
- Recent admin activity timeline
- System health checks (3CX, WebSocket, Database, Email)

**3CX API Config Tab:**
- XAPI configuration (FQDN, port, client ID/secret)
- Call Control API configuration
- Extension monitoring list
- Recording storage (SMB server, share, credentials)
- Connection testing for each component

**Email Settings Tab:**
- SMTP configuration (host, port, username, password)
- Alert recipients management
- Alert settings (high/medium severity, TIO, tower incidents)
- Attachment options (recording, transcript, sentiment)
- Weekly report settings (day, time)
- Test email functionality

**Branding & Colors Tab:**
- Company information (name, title, support email/phone)
- Logo upload (PNG/SVG)
- Color scheme customization (6 colors)
- Preview and reset to defaults

**User Management Tab:**
- Create/edit/delete users
- Search and filter users
- Role assignment (viewer/manager/admin)
- Department restrictions for managers
- 2FA enforcement per user
- Password reset utility
- Account lockout management
- Last login tracking

**Permissions Tab:**
- Visual role permissions display
- IP whitelist management
- Enable/disable IP restrictions
- Add/remove whitelisted IPs

**Keyword Management Tab:**
- High severity keywords (immediate email alerts)
- Medium severity keywords (daily digest)
- Low severity keywords (log only)
- Positive keywords (coaching tool)
- Import/export CSV
- TIO keyword auto-configured

**Towers Tab:**
- Tower locations management
- CSV import (name, services, lat/lon, address, alert radius)
- Map view of towers
- Alert radius configuration
- Services list per tower

**Alerts Tab:**
- Configure alert thresholds
- Tower incident notification settings
- Email alert templates
- Alert history

**Maps Tab:**
- Default map center and zoom
- Layer visibility defaults
- Toggle NBN/power/fire/flood feeds

**Widgets Tab:**
- Configure public wallboard widgets
- Drag-and-drop positioning
- Widget visibility toggles
- Size adjustments

**System Settings Tab:**
- Session timeout
- Auto-logout settings
- Database maintenance
- Log retention
- Performance tuning

**Audit Log Tab:**
- Complete audit trail
- Filter by user, action, date
- Export audit logs
- IP address tracking

### 4. Infrastructure Map (`/map`)

**Purpose:** Monitor Australian infrastructure impacting Pentanet services
**Access:** All authenticated users
**Features:**

**Map Display:**
- Interactive Leaflet map centered on Perth, WA
- Dark theme for consistency
- Real-time data updates every 5 minutes

**Layers (toggle on/off):**
- 📡 Pentanet Towers (blue markers with coverage radius circles)
- 🌐 NBN Outages (orange markers)
- ⚡ Power Outages (red markers, pulsing for critical)
- 🔥 Fire Incidents (pink markers, pulsing)
- 💧 Flood Warnings (blue markers, pulsing)

**Features:**
- Address lookup tool (search Perth addresses)
- Filter controls (show/hide each layer)
- Refresh button for manual updates
- Legend explaining marker colors
- Statistics panel (tower count, outage counts)
- Critical alert banner (when towers affected)

**Popups:**
- Tower details (name, services, address, alert radius)
- Outage details (description, affected users, ETA restoration, severity)
- Incident details (description, location, status, severity)

**Tower Impact Analysis:**
- Automatic detection when incident within tower alert radius
- Email alerts for critical/high severity impacts
- Distance calculation from tower
- Visual indication on map

### 5. Setup Wizard (`/setup`)

**Purpose:** First-run configuration after installation
**Access:** First-time only, automatically redirects if completed
**Features:**

**5-Step Process:**

1. **Welcome** - System information, pre-installation checklist
2. **Admin Account** - Set admin password and email
3. **3CX Connection** - Enter API credentials, test connection
4. **Diagnostics** - 5 automated checks:
   - Database connectivity
   - Backend API health
   - 3CX authentication
   - WebSocket connectivity
   - File permissions
5. **Complete** - Summary, access URLs, next steps

**Design:** Modern, guided interface with progress indicator

---

## Australian Infrastructure Monitoring

### Data Sources

The system monitors three critical infrastructure sources affecting Perth, WA:

#### 1. NBN Outages
- **Source:** NBN Co API (or simulated data)
- **Coverage:** Perth metropolitan area
- **Update Frequency:** 5 minutes
- **Data Points:**
  - Suburb affected
  - Number of services impacted
  - Estimated restoration time
  - Severity (high/medium/low)

#### 2. Western Power Outages
- **Source:** Western Power outage map API (or simulated data)
- **Coverage:** Perth and surrounding areas
- **Update Frequency:** 5 minutes
- **Data Points:**
  - Number of customers affected
  - Cause (equipment failure, maintenance, weather)
  - Estimated restoration time
  - Severity (critical/high/medium/low)

#### 3. Emergency Incidents (Fires & Floods)
- **Source:** Emergency WA / DFES API (or simulated data)
- **Coverage:** Perth and Western Australia
- **Update Frequency:** 5 minutes
- **Data Points:**
  - Incident type (fire/flood)
  - Location
  - Status (active/contained/resolved)
  - Severity

### Tower Impact Analysis

**Algorithm:**
1. Load all active Pentanet towers from database
2. For each tower, check all active incidents
3. Calculate distance from tower to incident (Haversine formula)
4. If distance ≤ tower alert radius (default 5km):
   - Flag tower as impacted
   - Record incident details
   - Calculate overall severity
5. If severity is critical or high:
   - Send email alert to configured recipients
   - Display alert banner on dashboards
   - Add to tower incidents database table

**Email Alerts Include:**
- Tower name and location
- Incident type and description
- Distance from tower
- Severity level
- Estimated impact duration
- Recommended actions

### Tower CSV Import Format

```csv
tower_name,services,latitude,longitude,address,alert_radius_km
Perth CBD Tower,"Fiber,5G,Fixed Wireless",-31.9505,115.8605,"123 St Georges Terrace, Perth WA 6000",5
```

**Fields:**
- `tower_name` - Unique tower identifier
- `services` - Comma-separated services (quotes required if contains commas)
- `latitude` - Decimal degrees (negative for south)
- `longitude` - Decimal degrees (positive for east in Australia)
- `address` - Full street address
- `alert_radius_km` - Alert radius in kilometers (default: 5)

---

## Call Flow Diagram

### Design

The interactive call flow diagram uses SVG rendering to show Pentanet's complete call routing in real-time.

### Structure

**Layer 1: Trunk/DIDs**
- Virtutel Trunk (main incoming)
- Direct DIDs:
  - 1300 855 897 (Investor Line)
  - (08) 6465 0000 (NOC Support)
  - (08) 6118 9001 (Delivery Receiving)

**Layer 2: IVR**
- Main IVR (Digital Receptionist)
- Routes calls based on DTMF input

**Layer 3: Queues**
- Investor Queue
- NOC Queue
- Delivery Queue
- Each shows: waiting count, longest wait time, available agents

**Layer 4: Agent Groups**
- Investor Agents (3 agents)
- NOC Agents (5 agents)
- Delivery Agents (4 agents)
- Shows available/oncall/total

**Layer 5: Voicemail**
- Per-queue voicemail boxes
- Message counts

### Visual Features

**Node Types:**
- 📞 Trunk (blue) - Incoming calls
- 🤖 IVR (purple) - Automated menus
- ⏳ Queue (orange) - Waiting calls
- 👤 Agent (green) - Available agents
- 📧 Voicemail (grey) - Messages

**Connection Styles:**
- Normal: Grey line, 2px width
- Active: Blue line, 3px width, animated dashes (moving)
- High Drop (>20%): Red line, 3px width, warning label
- Medium Drop (>10%): Orange line, 2.5px width

**Interactivity:**
- Click nodes for detailed stats modal
- Hover for border highlight and shadow
- Real-time updates every 3 seconds
- Export to PDF/SVG
- Zoom and pan support

### Drop Rate Calculation

```
Drop Rate = (Dropped Calls / Total Calls) × 100
```

**Thresholds:**
- > 20% = High (red alert, thick line)
- > 10% = Medium (orange warning)
- ≤ 10% = Normal (grey)

---

## Sentiment Analysis

### Keyword Categories

**High Severity (Immediate Email Alert):**
- Legal terms: lawsuit, lawyer, attorney, legal action, sue
- Compliance: TIO, telecommunications industry ombudsman, ombudsman, regulatory
- **Total:** 9 keywords

**Medium Severity (Daily Digest):**
- Negative: complaint, frustrated, disappointed, terrible, awful
- Escalation: manager, supervisor, escalate
- Financial: refund
- Churn: cancel
- **Total:** 10+ keywords

**Low Severity (Log Only):**
- Quality: slow
- Pricing: expensive
- Usability: confusing, difficult
- **Total:** 4+ keywords

**Positive (Coaching Tool):**
- Gratitude: thank you, appreciate
- Satisfaction: excellent, great, helpful, satisfied, happy
- **Total:** 7+ keywords

### TIO (Telecommunications Industry Ombudsman) Handling

**Special Handling:**
- Keyword: "TIO" or "telecommunications industry ombudsman"
- Severity: Always HIGH (critical)
- Action: Immediate email alert + separate TIO monitoring page
- Report: Automatic PDF generation with:
  - Call recording
  - Full transcript
  - Sentiment analysis
  - Flagged keywords
  - Agent information
- Compliance: Australian telecom regulatory requirement
- Storage: Long-term retention in separate TIO table
- Workflow: Under Review → Complete (manager approval required)

---

## Database Schema

### Tables

1. **users** - User accounts with 2FA and lockout
2. **flagged_calls** - Calls flagged by sentiment analysis
3. **ip_whitelist** - Allowed IP addresses
4. **settings** - Key-value configuration store
5. **audit_log** - Complete audit trail
6. **towers** - Pentanet tower locations
7. **tower_incidents** - Tower impact tracking
8. **widgets** - Dashboard widget configuration
9. **keywords** - Sentiment analysis keywords

### Key Indexes

- Flagged calls by severity and date
- Audit log by user and date
- Active towers
- Tower incidents by tower and date
- Keywords by severity and active status

---

## Installation

### Prerequisites

- Debian Linux server (3CX running)
- Root access
- Internet connection
- 3CX V20 Update 7 or later

### Quick Installation

```bash
# SSH to 3CX server
ssh root@pentanet.3cx.com.au

# Download installer
cd /opt
wget https://github.com/pentanet/dashboard/releases/latest/install.sh
chmod +x install.sh

# Run installer
./install.sh

# Follow prompts:
# 1. Confirm snapshot/backup taken
# 2. Installer auto-detects available ports (default: 8443/8444)
# 3. Installs Node.js 20 LTS
# 4. Installs dependencies
# 5. Configures nginx snippet
# 6. Creates systemd service
# 7. Generates admin password
# 8. Runs verification

# Access setup wizard
https://pentanet.3cx.com.au:5001/pentanet-dashboard/setup
```

### Manual Installation Steps

See [PENTANET_INSTALLATION.md](PENTANET_INSTALLATION.md) for detailed manual installation instructions.

---

## Configuration

### 3CX API Setup

1. **Create Service Principal for XAPI:**
   - Login to 3CX Web Client as admin
   - Navigate to Integrations → API
   - Click Add
   - Client ID: 900 (or available extension)
   - Name: "Pentanet Dashboard XAPI"
   - Enable: "3CX Configuration API Access"
   - Department: System Wide
   - Role: System Owner
   - Copy API Key (shown once!)

2. **Create Service Principal for Call Control:**
   - Integrations → API → Add
   - Client ID: 901
   - Name: "Pentanet Dashboard Call Control"
   - Enable: "3CX Call Control API Access"
   - Extensions to Monitor: 100,101,102,103,104,105,106,107,108,109,110,111
   - Copy API Key

3. **Configure in Dashboard:**
   - Login to Admin Panel
   - Navigate to 3CX API Config
   - Enter both sets of credentials
   - Test connections
   - Save

### Email Configuration

**Gmail Example:**
- SMTP Host: smtp.gmail.com
- SMTP Port: 587
- Username: your-email@gmail.com
- Password: App-specific password (not regular password)
- Enable 2-Step Verification in Google Account first
- Generate App Password: Google Account → Security → 2-Step Verification → App passwords

**Microsoft 365 Example:**
- SMTP Host: smtp.office365.com
- SMTP Port: 587
- Username: your-email@pentanet.com.au
- Password: Account password

### Tower Import

1. Prepare CSV file (see `examples/towers-example.csv`)
2. Admin Panel → Towers → Import CSV
3. Select file
4. Review preview
5. Confirm import
6. Towers appear on map immediately

---

## API Endpoints

### Public Wallboard API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/status` | GET | System status |
| `/ws` | WebSocket | Real-time updates |

### Authenticated API (Manager+)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/verify` | GET | Token verification |
| `/api/flagged-calls` | GET | List flagged calls |
| `/api/flagged-calls` | POST | Add flagged call |
| `/api/flagged-calls/:id/review` | PUT | Review flagged call |
| `/api/reports/generate` | POST | Generate PDF report |
| `/api/reports/download/:file` | GET | Download report |
| `/api/infrastructure` | GET | Get infra data (NBN/power/fire/flood/towers) |

### Admin-Only API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users` | GET | List users |
| `/api/users` | POST | Create user |
| `/api/users/:id` | PUT | Update user |
| `/api/users/:id` | DELETE | Delete user |
| `/api/settings` | GET | Get settings |
| `/api/settings` | PUT | Update setting |
| `/api/towers` | GET | List towers |
| `/api/towers` | POST | Create tower |
| `/api/towers/:id` | PUT | Update tower |
| `/api/towers/:id` | DELETE | Delete tower |
| `/api/towers/import` | POST | Import towers CSV |
| `/api/keywords` | GET | List keywords |
| `/api/keywords` | POST | Create keyword |
| `/api/keywords/:id` | PUT | Update keyword |
| `/api/keywords/:id` | DELETE | Delete keyword |
| `/api/audit-log` | GET | View audit log |

---

## Security

### Authentication
- JWT tokens with 60-minute expiry
- bcrypt password hashing (10 rounds)
- Account lockout after 5 failed attempts (30-minute lock)
- 2FA support (TOTP) - optional or enforced

### Authorization
- 3-tier role system (viewer/manager/admin)
- Department restrictions for managers
- IP whitelisting capability
- Audit logging for all admin actions

### Data Protection
- All passwords hashed with bcrypt
- Secrets stored in .env file (600 permissions)
- Database encrypted at rest (optional)
- HTTPS required in production
- CORS configured for same-origin only

### Audit Trail
- User login/logout
- Configuration changes
- User management actions
- Failed login attempts
- IP address logging

---

## Maintenance

### Daily
- Monitor system health dashboard
- Review flagged calls
- Check tower incident alerts

### Weekly
- Review audit log
- Generate performance report
- Check disk space
- Review email delivery

### Monthly
- Update keywords based on trends
- Review user access
- Database backup verification
- Software updates check

### Quarterly
- Full system backup
- Tower location review
- Permission audit
- Performance optimization

---

## Troubleshooting

### Dashboard Not Loading

1. Check systemd service:
```bash
systemctl status pentanet-dashboard
journalctl -u pentanet-dashboard -n 50
```

2. Check nginx:
```bash
systemctl status nginx
nginx -t
```

3. Check database:
```bash
ls -lh /var/lib/pentanet-dashboard/database/dashboard.db
```

### 3CX Connection Failed

1. Verify credentials in Admin → 3CX API Config
2. Test connection using Test button
3. Check 3CX Service Principal:
   - Login to 3CX Web Client
   - Integrations → API
   - Verify Service Principal is active
   - Regenerate API key if needed

4. Check logs:
```bash
journalctl -u pentanet-dashboard | grep "3CX"
```

### Email Alerts Not Sending

1. Check SMTP configuration in Admin → Email Settings
2. Send test email
3. Check logs:
```bash
journalctl -u pentanet-dashboard | grep "email"
```

4. Verify firewall allows outbound SMTP (port 587/465)

### Map Not Showing Data

1. Check infrastructure service:
```bash
journalctl -u pentanet-dashboard | grep "Infrastructure"
```

2. Verify towers imported:
```sql
sqlite3 /var/lib/pentanet-dashboard/database/dashboard.db
SELECT COUNT(*) FROM towers WHERE active = 1;
```

3. Check API endpoint:
```bash
curl http://localhost:8444/api/infrastructure
```

---

## Support

### Documentation
- Installation Guide: `PENTANET_INSTALLATION.md`
- API Validation: `SYSTEM_VALIDATION.md`
- Complete Docs: This file

### Logs
- Application: `/var/log/pentanet-dashboard/app.log`
- systemd: `journalctl -u pentanet-dashboard`
- nginx: `/var/log/nginx/error.log`

### Contact
- Email: stephen@pentanet.com.au
- System Admin: Pentanet IT Team

---

## Changelog

### Version 1.0.0 (October 21, 2025)
- Initial production release
- Full 3CX integration (XAPI + Call Control API)
- Australian infrastructure monitoring (NBN, power, fires, floods)
- Tower impact analysis and alerting
- Complete admin panel
- Interactive call flow diagram
- Sentiment analysis with TIO compliance
- Manager dashboard with all features
- Setup wizard
- Automated installation

---

## License

**Proprietary Software**
© 2025 Pentanet
All Rights Reserved

This software is proprietary to Pentanet and is not licensed for distribution, modification, or use by any third party without explicit written permission.

---

**End of Documentation**
**System Status:** ✅ Production Ready
**Next Action:** Deploy to pentanet.3cx.com.au

