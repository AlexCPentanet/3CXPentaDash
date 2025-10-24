# 3CX PentaDash - Feature Documentation

**Version:** 2.0
**Last Updated:** October 25, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [User Interfaces](#user-interfaces)
3. [Core Features](#core-features)
4. [Emergency Monitoring](#emergency-monitoring)
5. [System Administration](#system-administration)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Security](#authentication--security)
8. [Data Services](#data-services)
9. [Reporting & Analytics](#reporting--analytics)
10. [Feature Matrix by Role](#feature-matrix-by-role)

---

## Overview

3CX PentaDash is a comprehensive real-time call center dashboard system for 3CX V20, providing:

- **Real-time call monitoring** with live updates every 3 seconds
- **Emergency incident tracking** from multiple government data sources
- **System health monitoring** with 9+ service checks
- **Advanced analytics** with sentiment analysis and performance metrics
- **Demo mode protection** for safe demonstration environments
- **Multi-role access control** (Admin, Manager, QC, Viewer, Demo)

**Deployment Variants:**
- **pentadashdemo** - Full-featured demo with simulated data (ports 9443/9444)
- **pentanetdashboard** - Production deployment with live 3CX integration (ports 8443/8444)
- **Root wallboard** - Lightweight standalone wallboard (basic HTML/JS)
- **wallboard/** - Alternative wallboard implementation

---

## User Interfaces

### 1. Public Dashboard
**URL:** `/` (root)
**Access:** Public (no authentication required)
**Purpose:** Real-time call center monitoring wallboard

#### Features:
- ✅ **Live Call Feed** - Active calls with duration timers
- ✅ **Agent Status Board** - Available/On Call/Offline status
- ✅ **Queue Statistics** - Waiting calls, average wait time, abandoned calls
- ✅ **KPI Dashboard** - Active calls, answer rate, sentiment score
- ✅ **Sentiment Analysis** - Real-time call sentiment tracking (Positive/Neutral/Negative)
- ✅ **Performance Charts** - Call volume trends, queue performance
- ✅ **Theme Switcher** - Dark/Light/Pentanet themes
- ✅ **Auto-refresh** - 3-second polling interval

**File:** `pentadashdemo/public/index.html`

---

### 2. Emergency Map
**URL:** `/emergency-map.html`
**Access:** Public
**Purpose:** Real-time emergency incident monitoring with GIS mapping

#### Features:
- 🔥 **Emergency WA Integration** - Live bushfire and incident data
  - Source: https://emergency.wa.gov.au/data/map.incidents.json
  - Red markers (#FF3232)
  - Incident details: name, severity, status, location, timestamps

- 🛰️ **DEA Satellite Hotspots** - Fire detection from Digital Earth Australia
  - Source: https://hotspots.dea.ga.gov.au/geoserver/wfs
  - Orange markers (#FF8800)
  - Fire radiative power and confidence levels

- 📡 **NBN Outages** - Network outage tracking
  - Simulated data (6 Perth suburbs)
  - Blue markers (#3388ff)
  - Status, ETA, affected services, customer count

- ⚡ **Western Power Outages** - Electricity outage monitoring
  - API with fallback simulation (5 metro areas)
  - Green markers (#6BC143)
  - Cause, customer count, restore time

#### Interactive Tools:
- ✅ **Suburb Search** - Real-time search with autocomplete (15 Perth suburbs)
- ✅ **Custom Pinpoints** - Add custom markers with title/notes (purple markers)
- ✅ **Layer Toggles** - Show/hide incident types
- ✅ **Suburb Boundaries** - GeoJSON polygon overlays
- ✅ **Map Controls** - Reset view, fit all incidents, zoom controls
- ✅ **Data Export** - Export all incidents as GeoJSON
- ✅ **Theme Support** - Consistent theme across all pages

**Mapped Perth Suburbs (15):**
Perth CBD, Fremantle, Joondalup, Rockingham, Mandurah, Midland, Subiaco, South Perth, Victoria Park, Scarborough, Cannington, Armadale, Ellenbrook, Canning Vale, Baldivis

**Files:**
- `pentadashdemo/public/emergency-map.html`
- `pentadashdemo/public/js/emergency-map-full.js`
- `pentadashdemo/public/css/emergency-map.css`
- `pentadashdemo/server/emergency-overlays.js`
- `pentadashdemo/server/perth-suburbs.js`

---

### 3. Manager Dashboard
**URL:** `/manager`
**Access:** Manager, QC, Admin roles
**Purpose:** Advanced analytics, recordings, and management tools

#### Tabs:

##### 3.1 Overview
- Real-time KPIs and performance metrics
- Call volume summary
- Agent performance overview
- Queue performance summary

##### 3.2 Call Flow Visualization
- Interactive SVG call flow diagram
- Real-time call routing display
- Extension and queue mapping

##### 3.3 Call Recordings
**Features:**
- ✅ Audio playback with controls
- ✅ Search and filter recordings
- ✅ Pagination (50 per page)
- ✅ Download recordings
- ✅ Transcript display (if available)
- ✅ Call metadata (duration, date, participants)

##### 3.4 Flagged Calls
**Features:**
- ✅ View flagged calls for review
- ✅ Flag calls for quality control
- ✅ Add review notes and comments
- ✅ Mark as reviewed
- ✅ Filter by status (pending/reviewed)
- ✅ Assign to QC team members

**API Endpoints:**
- `GET /api/flagged-calls` - List all flagged calls
- `POST /api/flagged-calls` - Flag a call
- `PUT /api/flagged-calls/:id/review` - Update review status

##### 3.5 Agent Analytics
- Agent performance metrics
- Call statistics per agent
- Average handle time
- Sentiment scores by agent
- Daily/weekly/monthly trends

##### 3.6 Reports
**Features:**
- ✅ PDF report generation
- ✅ Custom date ranges
- ✅ Multiple report types:
  - Call volume reports
  - Agent performance reports
  - Queue performance reports
  - Sentiment analysis reports
- ✅ Download reports
- ✅ Email reports (via email service)

**API Endpoints:**
- `POST /api/reports/generate` - Generate PDF report
- `GET /api/reports/download/:filename` - Download report

##### 3.7 TIO Monitoring
- TIO (Telecommunications Industry Ombudsman) complaint tracking
- Complaint categorization
- Resolution tracking
- Trend analysis

##### 3.8 Tower Alerts
**URL:** `/manager/tower-alerts.html`
- Infrastructure monitoring alerts
- Network tower status
- Service degradation notifications

**File:** `pentadashdemo/public/manager/index.html`

---

### 4. Admin Panel
**URL:** `/admin`
**Access:** Admin role only
**Purpose:** System configuration and user management

#### Features:

##### 4.1 User Management
- ✅ View all users
- ✅ Create new users
- ✅ Edit user details (username, email, role)
- ✅ Delete users
- ✅ Password reset
- ✅ Role assignment (admin/manager/qc/viewer/demo)

**API Endpoints:**
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

##### 4.2 System Settings
- ✅ Email/SMTP configuration
- ✅ 3CX integration settings
- ✅ SLA target configuration
- ✅ Display preferences
- ✅ Auto-refresh intervals
- ✅ Alert thresholds

**API Endpoints:**
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

**Protected in Demo Mode:**
- Settings modifications blocked
- User creation/deletion restricted
- Configuration changes prevented

##### 4.3 System Status Monitor
**URL:** `/admin/status.html`
**NEW FEATURE**

**Purpose:** Real-time system health monitoring dashboard

**Service Checks (9):**
1. ✅ **SQLite Database** - Connection and query performance
2. ✅ **3CX Phone System** - Connection status and API availability
3. ✅ **Emergency WA Feed** - DFES incident data availability
4. ✅ **DEA Hotspots Feed** - Satellite hotspot data status
5. ✅ **NBN Service** - NBN outage service status
6. ✅ **Western Power** - Power outage service status
7. ✅ **Email/SMTP** - Email service configuration
8. ✅ **Disk Space** - Server disk usage monitoring
9. ✅ **Memory Usage** - Server RAM utilization

**Features:**
- ✅ Overall system health indicator (green/yellow/red)
- ✅ Pulse animation for operational status
- ✅ Service grid view with individual cards
- ✅ Response time tracking (ms)
- ✅ Last check timestamps
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh button
- ✅ Detailed service information expandable panels

**System Information Panel:**
- Node.js version
- Platform (OS)
- Server uptime
- Environment (dev/production)
- Demo mode status
- Port configuration (API/Web)

**Troubleshooting Tools:**
- Test Emergency WA feed connection
- Test DEA Hotspots connection
- Test 3CX API connection
- Clear application cache
- View server logs (last 100 lines)
- Export status report as JSON

**API Endpoints:**
- `GET /api/admin/status` - Full system status
- `POST /api/admin/status/refresh` - Force immediate refresh
- `GET /api/admin/status/:service` - Specific service status
- `GET /api/health` - Public health check

**Status Categories:**
- **Operational** (green) - Service fully functional
- **Degraded** (yellow) - Service working with issues
- **Error** (red) - Service unavailable or failing
- **Unknown** (gray) - Service not configured

**File:** `pentadashdemo/public/admin/status.html`

##### 4.4 Demo Protection Status
**URL:** `/api/admin/demo-protection`
**Access:** Admin only

**Features:**
- ✅ View demo mode protection status
- ✅ Protected paths list
- ✅ Protected settings list
- ✅ Audit log of blocked operations
- ✅ Recent events (last 50)

**File:** `pentadashdemo/public/admin/index.html`

---

### 5. Setup Wizard
**URL:** `/setup`
**Access:** First-time setup (no users in database)
**Purpose:** Initial system configuration

#### Features:
- ✅ 3CX connection setup
- ✅ Admin user creation
- ✅ SMTP configuration
- ✅ Database initialization
- ✅ Default settings

**File:** `pentadashdemo/public/setup/index.html`

---

### 6. Alternate Map View
**URL:** `/map`
**Access:** Public
**Purpose:** Alternative map interface

**File:** `pentadashdemo/public/map/index.html`

---

## Core Features

### Real-Time Call Monitoring

**Update Interval:** 3 seconds (WebSocket + polling hybrid)

**Data Points:**
- Active call count
- Call duration timers (live)
- Agent status (Available/On Call/Offline/Away)
- Queue statistics (waiting, abandoned, avg wait time)
- Answer rate percentage
- Sentiment scores (real-time analysis)

**Technologies:**
- WebSocket for push updates
- Polling fallback for reliability
- Chart.js for visualizations
- Moment.js for time handling

---

### Sentiment Analysis

**Engine:** Keyword-based sentiment scoring

**Categories:**
- 😊 **Positive** - Helpful, thank you, great, excellent, satisfied
- 😐 **Neutral** - Default for calls without strong indicators
- 😟 **Negative** - Angry, frustrated, complaint, unhappy, terrible

**Features:**
- Real-time sentiment tracking
- Per-call sentiment scores
- Aggregated sentiment metrics
- Sentiment trends over time
- Agent sentiment performance

**Algorithm:**
- Keyword matching on call notes/transcripts
- Weighted scoring system
- Configurable keyword lists
- Context-aware analysis

---

### Theme System

**Three Built-in Themes:**

1. **Dark Mode** (default)
   - Background: #1a1a1a (dark charcoal)
   - Text: #ffffff
   - Accent: #FF6600 (Pentanet orange)
   - Best for: Wallboard displays, low light

2. **Light Mode**
   - Background: #f5f5f5 (light gray)
   - Text: #333333
   - Accent: #FF6600
   - Best for: Office environments, daytime

3. **Pentanet Brand Theme**
   - Background: #1a1a1a
   - Primary: #FF6600 (orange)
   - Secondary: #ffffff
   - Best for: Branded presentations

**Features:**
- ✅ Instant theme switching (no page reload)
- ✅ Persistence via localStorage
- ✅ Consistent across all pages
- ✅ Accessible color contrasts
- ✅ Toggle button in navigation

---

### Demo Mode Protection

**NEW FEATURE** - Comprehensive protection system for demo environments

**Purpose:** Allow safe demonstration without risk of data corruption or configuration changes

#### Protection Layers:

##### 1. File Write Protection
**Middleware:** `demoProtection.protectFileWrites()`

**Protected Operations:**
- File uploads blocked
- Configuration file modifications prevented
- Log file writes allowed (audit trail)

##### 2. Database Write Protection
**Wrapper:** `demoProtection.protectDatabaseWrites(db)`

**Protected Tables:**
- `settings` - System configuration (read-only)
- `users` - User management (limited operations)
- `ip_whitelist` - Security configuration

**Allowed Operations:**
- `audit_log` - Full write access for logging
- `flagged_calls` - QC operations allowed
- `call_recordings` - Metadata updates allowed
- Read operations - Always allowed

##### 3. Protected Resources
- Database files (`*.db`)
- Environment variables (`.env`)
- Server configuration files
- SMTP/API credentials
- SSL certificates

#### Audit Logging

**Features:**
- All blocked operations logged
- Timestamp and event type
- User and IP address tracking
- Operation details (table, action, data)
- Last 50 events available via API

**Log Format:**
```json
{
  "timestamp": "2025-10-25T10:30:00Z",
  "event": "database_write_blocked",
  "table": "settings",
  "operation": "UPDATE",
  "user": "demo",
  "ip": "192.168.1.100",
  "details": "Attempted to modify system settings in demo mode"
}
```

**Log File:** `data/demo-protection.log`

#### Configuration

**Environment Variables:**
```bash
DEMO_MODE=true                    # Enable demo mode protection
USE_SIMULATED_DATA=true          # Use simulated call data
ENABLE_LIVE_FEEDS=true           # Allow live emergency feeds
```

**Status API:** `GET /api/admin/demo-protection`

**Files:**
- `pentadashdemo/server/demo-mode-protection.js`

---

## Emergency Monitoring

### Emergency WA (DFES) Integration

**Data Source:** Department of Fire and Emergency Services WA
**URL:** https://emergency.wa.gov.au/data/map.incidents.json
**Update Frequency:** 5 minutes
**Data Format:** JSON

**Incident Types:**
- Bushfires
- Structure fires
- Hazmat incidents
- Rescue operations
- Marine incidents
- Storm damage

**Data Fields:**
- Incident name and ID
- Location (lat/lon)
- Severity level (Advice/Watch and Act/Emergency Warning)
- Status (Active/Contained/Controlled)
- Start time and last updated
- Affected areas
- Recommended actions

**Marker Color:** Red (#FF3232)

---

### DEA Satellite Hotspots

**Data Source:** Digital Earth Australia (Geoscience Australia)
**URL:** https://hotspots.dea.ga.gov.au/geoserver/wfs
**Update Frequency:** 4 hours (satellite pass-dependent)
**Data Format:** GeoJSON (WFS service)

**Hotspot Data:**
- Fire radiative power (MW)
- Confidence level (0-100%)
- Detection timestamp
- Satellite (MODIS/VIIRS)
- Coordinates (lat/lon)
- Temperature (Kelvin)

**Filtering:**
- Last 24 hours only
- Western Australia region
- Confidence > 50%

**Marker Color:** Orange (#FF8800)

---

### NBN Outage Monitoring

**Status:** Simulated (no public NBN API available)
**Update Frequency:** Real-time (5 min simulated updates)
**Coverage:** 6 major Perth suburbs

**Simulated Data:**
- Outage ID and status
- Affected suburb
- Service type (FTTP/FTTC/FTTN/HFC/Fixed Wireless)
- Estimated restoration time
- Affected customer count
- Cause (planned maintenance, fault, weather)

**Suburbs Covered:**
- Perth CBD
- Fremantle
- Joondalup
- Midland
- Rockingham
- Cannington

**Marker Color:** Blue (#3388ff)

**Ready for Real API:** Service structure designed for easy integration when NBN provides public API

---

### Western Power Outages

**Data Source:** Western Power API (with fallback simulation)
**Update Frequency:** 5 minutes
**Coverage:** 5 Perth metro areas

**Outage Data:**
- Outage ID
- Location/suburb
- Cause (equipment failure, planned maintenance, weather, vehicle impact)
- Start time
- Estimated restoration time
- Affected customers
- Status (investigating/repairing/restored)

**Metro Areas:**
- Perth CBD
- Fremantle
- Rockingham
- Joondalup
- Mandurah

**Marker Color:** Green (#6BC143)

**Fallback:** Graceful degradation to simulated data if API unavailable

---

### Perth Suburb Mapping

**NEW SERVICE**

**Purpose:** Geocoding, search, and distance calculation for Perth suburbs

**Mapped Suburbs (15):**
1. Perth CBD (6000)
2. Fremantle (6160)
3. Joondalup (6027)
4. Rockingham (6168)
5. Mandurah (6210)
6. Midland (6056)
7. Subiaco (6008)
8. South Perth (6151)
9. Victoria Park (6100)
10. Scarborough (6019)
11. Cannington (6107)
12. Armadale (6112)
13. Ellenbrook (6069)
14. Canning Vale (6155)
15. Baldivis (6171)

**Data Per Suburb:**
- Name and postcode
- Center coordinates (lat/lon)
- GeoJSON polygon boundaries
- Population estimate
- Major landmarks

**Features:**
- ✅ **Search** - Real-time autocomplete search
- ✅ **Geocoding** - Suburb name → coordinates
- ✅ **Reverse Geocoding** - Coordinates → suburb
- ✅ **Distance Calculation** - Haversine formula
- ✅ **Nearby Suburbs** - Find suburbs within radius
- ✅ **GeoJSON Export** - Export suburb boundaries

**API Endpoints:**
```
GET /api/perth-suburbs              - All suburbs as GeoJSON FeatureCollection
GET /api/perth-suburbs/search?q=    - Search suburbs by name (fuzzy)
GET /api/perth-suburbs/nearby?lat=&lon=&radius=  - Find nearby suburbs (km)
GET /api/geocode?suburb=            - Get coordinates for suburb name
```

**File:** `pentadashdemo/server/perth-suburbs.js`

---

## System Administration

### User Management

**Roles:**
- **admin** - Full system access
- **manager** - Analytics, reports, recordings, user management
- **qc** - View/flag calls, view recordings
- **viewer** - Read-only dashboard access
- **demo** - Limited demo mode access

**User Fields:**
- Username (unique)
- Email address
- Password (bcrypt hashed, cost factor 12)
- Role
- Created/updated timestamps

**Operations:**
- Create user
- Edit user (username, email, role)
- Reset password
- Delete user
- View user list

**Protected in Demo Mode:**
- User creation blocked
- User deletion blocked
- Password changes restricted
- Role changes blocked

---

### Settings Management

**Setting Categories:**

1. **3CX Integration**
   - FQDN, port, IP addresses
   - API credentials (client ID, secret)
   - Connection timeout
   - Retry settings

2. **Email/SMTP**
   - SMTP host, port, security
   - Authentication credentials
   - From address
   - Alert recipients

3. **SLA Targets**
   - Answer time threshold (seconds)
   - Answer rate target (%)
   - Abandonment rate target (%)

4. **Display Preferences**
   - Auto-refresh interval
   - Max calls to display
   - Show/hide sections
   - Default theme

5. **Alert Thresholds**
   - Queue wait time alerts
   - Abandonment rate alerts
   - Agent availability alerts

**Storage:** SQLite database (`settings` table)

**Protected in Demo Mode:** All settings modifications blocked

---

### System Status Monitoring

**Service:** `StatusMonitor` class
**File:** `pentadashdemo/server/status-monitor.js`

**Check Functions:**

1. **checkDatabase()** - SQLite connectivity and query test
2. **check3CX()** - 3CX API connection and authentication
3. **checkEmergencyWA()** - DFES feed availability
4. **checkDEAHotspots()** - DEA satellite data availability
5. **checkNBN()** - NBN service status (simulated)
6. **checkWesternPower()** - Western Power API status
7. **checkEmail()** - SMTP configuration validation
8. **checkDiskSpace()** - Server disk usage (critical < 90%)
9. **checkMemory()** - Server RAM usage (critical > 90%)

**Health Status:**
- `operational` - Service fully functional
- `degraded` - Service working with issues
- `error` - Service unavailable or failing
- `unknown` - Service not configured or unable to check

**Response Time Tracking:**
- Each check measures response time in milliseconds
- Average response times calculated
- Slow response warnings (> 2000ms)

**Auto-refresh:** Status checks run every 60 seconds in background

---

## API Endpoints

### Public Endpoints (No Authentication)

```
GET  /                              - Public dashboard HTML
GET  /emergency-map.html            - Emergency map interface
GET  /api/health                    - Health check (200/503)
GET  /api/dashboard/live            - Live dashboard data
GET  /api/queues                    - Queue statistics
GET  /api/agents                    - Agent status list
GET  /api/calls/active              - Active calls
GET  /api/calls/recent              - Recent call history
GET  /api/emergency-overlays        - All emergency incidents (JSON)
GET  /api/emergency-overlays/meta   - Emergency layer metadata
GET  /api/perth-suburbs             - Perth suburbs GeoJSON
GET  /api/perth-suburbs/search      - Search suburbs
GET  /api/perth-suburbs/nearby      - Find nearby suburbs
GET  /api/geocode                   - Geocode suburb name
```

---

### Authentication Endpoints

```
POST /api/auth/login                - Login (returns JWT token)
     Body: { username, password }
     Response: { token, user: { id, username, role } }

GET  /api/auth/verify               - Verify JWT token
     Headers: Authorization: Bearer <token>
     Response: { valid: true, user: {...} }

POST /api/auth/logout               - Logout (invalidate token)
     Headers: Authorization: Bearer <token>
```

---

### Manager+ Endpoints (Requires Authentication)

**Role Required:** Manager, QC, or Admin

```
GET  /api/flagged-calls             - List flagged calls
     Query: ?status=pending|reviewed&limit=50&offset=0

POST /api/flagged-calls             - Flag a call for review
     Body: { call_id, reason, notes }

PUT  /api/flagged-calls/:id/review  - Update review status
     Body: { status, notes, reviewed_by }

POST /api/reports/generate          - Generate PDF report
     Body: { type, start_date, end_date, filters }
     Response: { filename, download_url }

GET  /api/reports/download/:filename - Download generated report
     Response: PDF file stream
```

---

### Admin-Only Endpoints

**Role Required:** Admin

```
GET  /api/users                     - List all users
GET  /api/users/:id                 - Get user details
POST /api/users                     - Create new user
     Body: { username, email, password, role }

PUT  /api/users/:id                 - Update user
     Body: { username, email, role }

DELETE /api/users/:id               - Delete user

GET  /api/settings                  - Get all settings
PUT  /api/settings                  - Update settings
     Body: { key: value, ... }

GET  /api/admin/status              - Full system status
     Response: { overall, services: [...], system: {...} }

POST /api/admin/status/refresh      - Force status refresh
     Response: Updated status immediately

GET  /api/admin/status/:service     - Specific service status
     Params: :service = database|3cx|emergency_wa|dea|nbn|power|email|disk|memory

GET  /api/admin/demo-protection     - Demo protection status
     Response: { enabled, protected_paths, audit_log: [...] }
```

---

### Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 234,
    "limit": 50,
    "offset": 0,
    "pages": 5,
    "current_page": 1
  }
}
```

---

## Authentication & Security

### JWT Authentication

**Token Generation:**
- Algorithm: HS256
- Secret: Configurable via `JWT_SECRET` env var
- Expiry: 60 minutes (3600 seconds)
- Payload: `{ id, username, role, iat, exp }`

**Token Usage:**
- Include in `Authorization` header: `Bearer <token>`
- Automatically refreshed on activity
- Invalidated on logout (blacklist)

**Middleware:** `verifyToken(req, res, next)`

---

### Role-Based Access Control (RBAC)

**Middleware:** `requireRole(role)`

**Permission Hierarchy:**
```
viewer < demo < qc < manager < admin
```

**Access Rules:**
- `/api/users/*` - Admin only
- `/api/settings/*` - Admin only
- `/api/admin/*` - Admin only
- `/api/flagged-calls/*` - Manager+ (manager, admin)
- `/api/reports/*` - Manager+
- `/manager/*` - Manager+
- Public endpoints - No authentication

---

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Cost factor: 12 (2^12 rounds)
- Salt: Automatically generated per password

**Password Requirements:**
- Minimum 8 characters (recommended)
- Mix of uppercase, lowercase, numbers, symbols (recommended)
- Not enforced in demo mode for convenience

**Default Passwords (Demo Only):**
- admin: Admin123!
- manager: Manager123!
- qc: QC123!
- demo: Demo123!
- viewer: Viewer123!

**Production:** All default passwords must be changed

---

### CORS Configuration

**Development:**
```javascript
origin: '*'  // Allow all origins
```

**Production:**
```javascript
origin: [`https://${TCX_CONFIG.fqdn}:${TCX_CONFIG.port}`]
credentials: true
```

---

### HTTPS/TLS

**Certificates:**
- Self-signed certificates for development
- Production requires valid SSL certificates

**Ports:**
- Demo: 9443 (web), 9444 (API)
- Production: 8443 (web), 8444 (API)

**Configuration:**
```javascript
const server = https.createServer({
    key: fs.readFileSync('path/to/private.key'),
    cert: fs.readFileSync('path/to/certificate.crt')
}, app);
```

---

## Data Services

### 3CX Integration Service

**File:** `pentadashdemo/server/threecx-api-client.js` (not created yet in migration)

**Features:**
- OAuth 2.0 authentication
- Token management (auto-refresh at 55 min)
- XAPI queries (users, departments, call logs)
- Call Control API integration
- WebSocket event handling
- Error handling and retry logic

**Endpoints Used:**
- `/connect/token` - OAuth token
- `/xapi/v1/Users` - User list
- `/xapi/v1/Groups` - Call queues
- `/xapi/v1/CallLogRecords` - Call history
- `/callcontrol/ws` - WebSocket events
- `/callcontrol/{dn}` - Extension state

---

### Demo Data Generator

**File:** `pentadashdemo/server/demo-data-generator.js`

**Purpose:** Generate realistic simulated call center data for testing and demonstration

**Features:**
- ✅ Realistic agent state transitions (Available → On Call → Available)
- ✅ Call generation with varied durations (30s - 20min)
- ✅ Queue dynamics (calls enter/leave queues)
- ✅ Sentiment variation (positive/neutral/negative)
- ✅ Abandoned call simulation
- ✅ Multiple queues (Sales, Support, Billing, General)
- ✅ 10-15 simulated agents
- ✅ Time-based patterns (higher volume during business hours)

**Data Generated:**
- Active calls with live timers
- Agent status changes
- Queue statistics
- Call history records
- Sentiment scores
- Performance metrics

**Update Interval:** 3 seconds (matches real-time polling)

---

### Email Service

**File:** `pentadashdemo/server/email-service.js`

**Features:**
- SMTP email sending via Nodemailer
- Template support (HTML emails)
- Attachment support
- Queue for batch sends
- Error retry logic

**Email Types:**
- Alert notifications (SLA breaches, system errors)
- Report delivery (PDF attachments)
- User account notifications
- Admin notifications

**Configuration:**
```javascript
{
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass }
  },
  from: 'Pentadash Alerts <alerts@example.com>',
  recipients: ['manager@example.com', 'admin@example.com']
}
```

---

### Report Generator

**File:** `pentadashdemo/server/report-generator.js`

**Library:** PDFKit

**Report Types:**
1. **Call Volume Report**
   - Total calls by period
   - Inbound/outbound breakdown
   - Peak hours analysis
   - Charts and graphs

2. **Agent Performance Report**
   - Calls handled per agent
   - Average handle time
   - Sentiment scores
   - Performance rankings

3. **Queue Performance Report**
   - Queue statistics
   - Average wait times
   - Abandonment rates
   - SLA compliance

4. **Sentiment Analysis Report**
   - Overall sentiment trends
   - Sentiment by agent/queue
   - Keyword analysis
   - Time-based patterns

**Features:**
- ✅ Custom date ranges
- ✅ Multiple export formats (PDF primary)
- ✅ Charts and visualizations
- ✅ Logo and branding
- ✅ Email delivery option
- ✅ Download via API

**Output:** `data/reports/{report_name}_{timestamp}.pdf`

---

## Reporting & Analytics

### Real-Time Analytics

**Metrics:**
- Active calls (current count)
- Calls answered (today)
- Calls abandoned (today)
- Average wait time (seconds)
- Longest wait time (seconds)
- Answer rate (%)
- Service level compliance (%)
- Agent availability (%)
- Sentiment score (average)

**Update Frequency:** 3 seconds

---

### Historical Analytics

**Time Ranges:**
- Hourly (last 24 hours)
- Daily (last 7 days)
- Weekly (last 4 weeks)
- Monthly (last 12 months)

**Metrics:**
- Call volume trends
- Agent performance over time
- Queue performance trends
- Sentiment trends
- SLA compliance rates

**Visualization:** Chart.js line/bar charts

---

### Sentiment Analysis

**Methodology:**
- Keyword-based analysis
- Positive/neutral/negative classification
- Weighted scoring system
- Context consideration

**Positive Keywords:**
helpful, thank you, thanks, great, excellent, amazing, satisfied, pleased, happy, perfect, wonderful, fantastic

**Negative Keywords:**
angry, frustrated, upset, complaint, terrible, awful, worst, useless, disappointed, unhappy, unacceptable, horrible

**Scoring:**
- Positive: +1 per keyword
- Negative: -1 per keyword
- Final score: Sum of all keyword scores
- Classification: Score > 0 (positive), < 0 (negative), = 0 (neutral)

**Application:**
- Per-call sentiment
- Agent sentiment averages
- Queue sentiment trends
- Time-based sentiment patterns
- Alert on negative sentiment spikes

---

## Feature Matrix by Role

### Viewer Role
- ✅ Public dashboard (read-only)
- ✅ Emergency map (read-only)
- ✅ View active calls
- ✅ View agent status
- ✅ View queue statistics
- ❌ No admin access
- ❌ No manager tools
- ❌ Cannot flag calls
- ❌ Cannot generate reports

---

### Demo Role
- ✅ All viewer features
- ✅ Limited demo environment access
- ✅ View system status (limited)
- ❌ Settings changes blocked
- ❌ User management blocked
- ❌ Cannot modify configuration

---

### QC (Quality Control) Role
- ✅ All demo features
- ✅ View flagged calls
- ✅ Flag calls for review
- ✅ Add review notes
- ✅ View call recordings
- ✅ Search recordings
- ❌ Cannot generate reports
- ❌ Cannot manage users
- ❌ Limited analytics

---

### Manager Role
- ✅ All QC features
- ✅ Full manager dashboard access
- ✅ Call flow visualization
- ✅ Agent analytics
- ✅ Generate reports (all types)
- ✅ Download reports
- ✅ Email reports
- ✅ TIO monitoring
- ✅ Tower alerts
- ✅ Review flagged calls
- ✅ User management (view only)
- ❌ Cannot modify system settings
- ❌ Cannot create/delete users (demo mode)

---

### Admin Role
- ✅ All manager features
- ✅ Full system access
- ✅ User management (create/edit/delete)
- ✅ System settings configuration
- ✅ System status monitoring
- ✅ Demo protection status
- ✅ View audit logs
- ✅ Troubleshooting tools
- ✅ All API endpoints
- ✅ Database access (via API)

**Note:** In demo mode, some admin operations are restricted (settings changes, user creation/deletion)

---

## Browser Compatibility

**Tested Browsers:**
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Required Features:**
- ES6 JavaScript support
- WebSocket support
- LocalStorage
- Fetch API
- CSS Grid and Flexbox

**Not Supported:**
- Internet Explorer (any version)
- Legacy browsers without ES6

---

## Performance Characteristics

### Real-Time Updates
- **Polling Interval:** 3 seconds
- **WebSocket:** Available for push updates
- **Fallback:** Automatic polling if WebSocket fails

### Caching
- **Client-Side:** LocalStorage for themes, preferences
- **Server-Side:** In-memory caching for frequently accessed data
- **Emergency Data:** 5-minute cache TTL

### Optimization
- ✅ Minified CSS/JS in production
- ✅ Gzip compression
- ✅ Lazy loading for non-critical resources
- ✅ Debounced search inputs
- ✅ Throttled real-time updates
- ✅ Efficient Chart.js rendering

---

## Future Enhancements

### Planned Features (Migration to REST API Relay)
- [ ] PostgreSQL migration for better concurrency
- [ ] Redis caching layer
- [ ] Server-Sent Events (SSE) for real-time updates
- [ ] Enhanced analytics with ML-based sentiment
- [ ] Real-time call transcription
- [ ] Advanced reporting with custom dashboards
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] Enhanced security (2FA, IP whitelisting)
- [ ] Mobile app (React Native)

See `CLAUDE.md` → **REST API Relay Service Migration** section for detailed migration plan.

---

## Dependencies

### Backend (Node.js)
```json
{
  "express": "^4.18.0",
  "ws": "^8.13.0",
  "sqlite3": "^5.1.6",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "nodemailer": "^6.9.0",
  "pdfkit": "^0.13.0",
  "moment": "^2.29.4",
  "axios": "^1.4.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3"
}
```

### Frontend
```json
{
  "chart.js": "^4.3.0",
  "leaflet": "^1.9.4",
  "moment.js": "^2.29.4"
}
```

### Development
```json
{
  "stylelint": "^15.10.0",
  "stylelint-config-standard": "^34.0.0"
}
```

---

## File Structure Summary

```
pentadashdemo/
├── server/
│   ├── server.js                    # Main server (Express + WebSocket)
│   ├── demo-data-generator.js       # Simulated data generation
│   ├── email-service.js             # Email/SMTP service
│   ├── report-generator.js          # PDF report generation
│   ├── emergency-overlays.js        # Emergency data aggregation
│   ├── perth-suburbs.js             # Suburb geocoding service
│   ├── status-monitor.js            # System health monitoring
│   ├── demo-mode-protection.js      # Demo protection middleware
│   └── database-schema.sql          # SQLite schema
│
├── public/
│   ├── index.html                   # Public dashboard
│   ├── emergency-map.html           # Emergency GIS map
│   │
│   ├── manager/
│   │   ├── index.html               # Manager dashboard (8 tabs)
│   │   └── tower-alerts.html        # Tower monitoring
│   │
│   ├── admin/
│   │   ├── index.html               # Admin panel
│   │   └── status.html              # System status monitor
│   │
│   ├── setup/
│   │   └── index.html               # First-time setup wizard
│   │
│   ├── map/
│   │   └── index.html               # Alternate map view
│   │
│   ├── js/
│   │   ├── emergency-map-full.js    # Emergency map logic
│   │   ├── api-client.js            # REST API client
│   │   ├── data-service.js          # Data management
│   │   ├── websocket-client.js      # WebSocket connection
│   │   └── sentiment-service.js     # Sentiment analysis
│   │
│   └── css/
│       ├── emergency-map.css        # Emergency map styles
│       └── (theme CSS files)
│
└── data/
    ├── database/
    │   └── dashboard-demo.db        # SQLite database
    ├── reports/                     # Generated PDF reports
    └── demo-protection.log          # Demo mode audit log
```

---

**Documentation Status:** ✅ Complete and up-to-date
**Last Review:** October 25, 2025
**Maintained By:** 3CX PentaDash Development Team
**Related Docs:** CLAUDE.md, IMPLEMENTATION-SUMMARY.md, QUICK-START.md, UPDATES.md
