# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

3CX V20 Live Call Centre Wallboard - A comprehensive real-time dashboard system for monitoring 3CX V20 call centers with multiple deployment variants:

1. **Root Wallboard** - Basic standalone wallboard (`index.html`, `app.js`, `config.js`, `styles.css`)
2. **Pentadashdemo** - Full-featured demo version with backend server
3. **Pentanetdashboard** - Production-ready deployment for Pentanet
4. **Wallboard** - Alternative wallboard implementation

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Grid/Flexbox)
- **Charts**: Chart.js for visualizations
- **Backend**: Node.js + Express + SQLite3
- **Authentication**: JWT + bcrypt, OAuth 2.0 client credentials for 3CX
- **Real-time**: WebSocket for live updates
- **Email**: Nodemailer for alerts
- **Reports**: PDFKit for report generation

## Development Commands

### Root Wallboard (Basic)
```bash
# Start simple HTTP server for basic wallboard
python -m http.server 8000
# Or use the provided script:
./start-server.bat  # Windows

# Start CORS proxy for 3CX API during development
node proxy-server.js
# Runs on http://localhost:8080
```

### Pentadashdemo (Full Demo Server)
```bash
cd pentadashdemo/server
npm install
node server.js
# Or use the startup script:
cd pentadashdemo && ./start-demo.bat
```

**Demo Server Ports:**
- Web Interface: `https://localhost:9443`
- API Server: `https://localhost:9444`

**Demo Accounts:**
- Admin: `admin / Admin123!`
- Manager: `manager / Manager123!`
- QC: `qc / QC123!`
- Demo: `demo / Demo123!`
- Viewer: `viewer / Viewer123!`

### Pentanetdashboard (Production)
```bash
cd pentanetdashboard/server
npm install
node server.js
```

**Production Server Ports:**
- API: Port 8444 (configurable via `PORT` env var)
- Web: Port 8443 (configurable via `WEB_PORT` env var)

### Code Quality
```bash
# Lint CSS files
npm run lint:css

# Auto-fix CSS issues
npm run lint:css:fix
```

## Architecture Overview

### Root Wallboard Architecture

**Entry Point:** `index.html` loads `config.js` → `app.js` → `styles.css`

**Key Components:**
- `WallboardApp` class (`app.js`) - Main application controller
  - OAuth 2.0 authentication with 3CX XAPI (Configuration API)
  - Real-time data polling (default: 3 second intervals)
  - Metrics history tracking (last 20 data points for sparklines)
  - Sentiment analysis engine
- `config.js` - Central configuration (API credentials, branding, SLA targets)
- CORS proxy (`proxy-server.js`) - Bridges CORS restrictions during development

**Authentication Flow:**
1. OAuth 2.0 Client Credentials flow with 3CX Configuration API (XAPI)
2. Token managed in `WallboardApp.accessToken` with expiry tracking
3. Automatic token refresh before expiry
4. Falls back to demo mode if authentication fails

**Demo Mode:** Set `window.DEMO_MODE = true` in `config.js` to use simulated data

### Full Dashboard Architecture (Pentadashdemo/Pentanetdashboard)

**Server Components:**
- `server.js` - Main Express server with WebSocket integration
- `demo-data-generator.js` - Generates realistic call center data
- `threecx-api-client.js` - 3CX API integration layer
- `email-service.js` - Alert and notification emails
- `report-generator.js` - PDF report generation
- `emergency-overlays.js` - Emergency incident tracking
- `au-infrastructure-service.js` - Australian infrastructure monitoring (NBN, Western Power)

**Database:**
- SQLite3 database (`data/database/dashboard.db`)
- Schema defined in `server/database-schema.sql`
- Stores: users, calls, recordings, flagged calls, settings

**Frontend Structure:**
- `public/` - Static files (HTML, CSS, JS)
- `public/index.html` - Public dashboard (real-time call monitoring)
- `public/manager/` - Manager dashboard (analytics, recordings, reports)
- `public/admin/` - Admin interface (user management, settings)
- `public/emergency-map.html` - GIS map for emergency incidents

**Client-Side Services:**
- `js/api-client.js` - REST API client
- `js/data-service.js` - Data management and caching
- `js/websocket-client.js` - Real-time WebSocket connection
- `js/sentiment-service.js` - Client-side sentiment analysis

**Three-Theme System:**
- Dark Theme (default)
- Light Theme
- Pentanet Brand Theme (dark charcoal #1a1a1a with orange #FF6600 accents)
- Theme persistence via localStorage

### 3CX API Integration

3CX V20 Update 7 provides two main APIs:

**1. Configuration API (XAPI) - OData v4 REST API**
- Base URL: `https://{PBX_FQDN}/xapi/v1/`
- Purpose: System configuration (users, departments, settings)
- Used for: User provisioning, system configuration, administrative tasks

**2. Call Control API - REST + WebSocket**
- Base URL: `https://{PBX_FQDN}/callcontrol/`
- Purpose: Real-time call control and monitoring
- Used for: Wallboard applications, click-to-call, IVR systems

**OAuth 2.0 Authentication (Both APIs):**
```bash
POST https://{PBX_FQDN}/connect/token
Content-Type: application/x-www-form-urlencoded

client_id={SERVICE_PRINCIPAL_DN}
client_secret={API_KEY}
grant_type=client_credentials
```

**Response:**
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGci..."
}
```

**Token Management:**
- Tokens expire after 60 minutes
- Refresh token before expiry (at ~55 minutes)
- Include in Authorization header: `Bearer {access_token}`

**XAPI Endpoints Used in Wallboard:**
- `/xapi/v1/Defs?$select=Id` - Validate authentication
- `/xapi/v1/Users` - Get users/extensions
- `/xapi/v1/Groups` - Get call queues/departments
- `/xapi/v1/CallLogRecords` - Get call history

**Call Control Endpoints Used:**
- `/callcontrol/ws` - WebSocket for real-time events
- `/callcontrol/{dn}` - Get extension state
- `/callcontrol/{dn}/participants` - Get active participants

**Setup in 3CX Admin Console:**
1. Navigate to **Integrations > API**
2. Click **Add**
3. Configure Service Principal:
   - Client ID (extension number, e.g., 900)
   - Check **3CX Configuration API Access** and/or **Call Control API Access**
   - Department: **System Wide** (for full access)
   - Role: **System Owner** (for full permissions)
4. Save and copy API Key (shown only once!)

**License Requirement:**
- Requires **8SC+ Enterprise license**
- Standard/Professional licenses do not include API access

See `3CX_V20_U7_API_Overview.md` for detailed setup instructions and complete API documentation.

## Configuration Files

### Root `config.js`
Central configuration for basic wallboard:
- **apiUrl**: 3CX server URL (use `http://localhost:8080` for CORS proxy)
- **clientId/clientSecret**: OAuth credentials
- **authMethod**: `'xapi'` or `'oauth'`
- **branding**: Company logo, name, colors
- **sla**: Service level targets (percentage, answer time)
- **display**: Show/hide sections, max call display
- **endpoints**: XAPI OData endpoints (rarely needs modification)

### Server `.env` Files
Both pentadashdemo and pentanetdashboard use `.env` for configuration:
- 3CX connection details (FQDN, ports, IPs)
- Database path
- JWT secret
- SMTP settings for email alerts
- Session timeout

## Key Features

### Real-Time Monitoring
- Active call tracking with live timers
- Agent status board (Available/On Call/Offline)
- Queue statistics (waiting calls, abandoned, wait times)
- KPI dashboard (active calls, answer rate, sentiment scores)
- WebSocket-powered live updates

### Analytics & Reporting
- Call volume trends (hourly/daily/weekly/monthly)
- Sentiment analysis (Positive/Neutral/Negative)
- Agent performance metrics
- Department performance comparison
- Exportable PDF reports

### Manager Features
- Call recordings with search/filter
- Call flow visualization (interactive SVG diagram)
- Flagged call management
- Performance analytics
- Custom report generation

### Emergency Monitoring
- WA emergency incidents map integration
- Multiple data layers:
  - Bushfires (Emergency WA) - Red markers
  - Satellite hotspots (DEA) - Orange markers
  - NBN outages - Blue markers
  - Western Power outages - Green markers
- Auto-refresh every 5 minutes
- Full-screen GIS view

## Important Patterns

### Data Flow
1. Backend polls/subscribes to 3CX API
2. Data stored in SQLite for historical tracking
3. WebSocket broadcasts to connected clients
4. Frontend updates UI reactively
5. Charts re-render with new data

### Authentication Middleware
Server uses JWT tokens for session management. All admin/manager routes require valid JWT in Authorization header.

### Demo Data Generation
`DemoDataGenerator` creates realistic simulated data for testing:
- Agent states with realistic transitions
- Call generation with duration/sentiment
- Queue dynamics
- Historical trends

## Common Tasks

### Adding a New KPI
1. Update `WallboardApp.metricsHistory` structure in `app.js`
2. Add calculation method in `WallboardApp` class
3. Update `updateKPIs()` method
4. Add HTML element in `index.html`
5. Style in `styles.css`

### Adding a New Chart
1. Create canvas element in HTML
2. Initialize Chart.js instance in `WallboardApp.init()`
3. Store chart reference in `this.charts`
4. Update chart in data refresh cycle

### Modifying 3CX Integration
1. Update endpoint paths in `config.js` endpoints section
2. Modify `WallboardApp.authenticate()` for auth changes
3. Update `threecx-api-client.js` for backend changes
4. Test with demo mode first before connecting to live 3CX

### Adding Emergency Data Layer
1. Add new data source in `emergency-overlays.js`
2. Create fetch method with appropriate API endpoint
3. Add layer toggle in `emergency-map.html`
4. Style markers with unique color in map CSS

## File Organization

```
3CXPentaDash/
├── index.html              # Basic wallboard UI
├── app.js                  # Main wallboard application
├── config.js               # Configuration and credentials
├── styles.css              # Main stylesheet
├── proxy-server.js         # Development CORS proxy
├── package.json            # CSS linting dependencies
├── .stylelintrc.json       # Stylelint configuration
│
├── pentadashdemo/          # Full demo implementation
│   ├── server/             # Node.js backend
│   │   ├── server.js       # Main Express server
│   │   ├── demo-data-generator.js
│   │   ├── threecx-api-client.js
│   │   ├── email-service.js
│   │   ├── report-generator.js
│   │   ├── emergency-overlays.js
│   │   ├── database-schema.sql
│   │   └── .env            # Environment configuration
│   ├── public/             # Frontend assets
│   │   ├── index.html      # Public dashboard
│   │   ├── manager/        # Manager interface
│   │   ├── admin/          # Admin interface
│   │   ├── js/             # Client-side scripts
│   │   └── css/            # Stylesheets
│   └── start-demo.bat      # Demo startup script
│
├── pentanetdashboard/      # Production implementation
│   └── (same structure as pentadashdemo)
│
├── wallboard/              # Alternative wallboard
│   ├── js/
│   │   ├── api-client.js
│   │   ├── data-service.js
│   │   ├── sentiment-service.js
│   │   └── websocket-client.js
│   └── config.pentanet.js
│
└── 3CX API Documentation/  # API reference docs
    ├── 3CX_V20_U7_API_Overview.md
    ├── 3CX_V20_U7_Quick_Reference.md
    ├── 3CX_V20_U7_Configuration_API.md
    └── 3CX_V20_U7_Call_Control_API.md
```

## REST API Relay Service Migration

### Migration Overview

**Purpose:** Extract Pentadash backend functionality into a standalone REST API relay service to simplify data access, improve scalability, and enable multi-client support.

**Target Architecture:**
```
┌─────────────────┐
│  Dashboard UI   │ ← Pentadash/Pentanet frontend (static files)
│  (Static HTML)  │
└────────┬────────┘
         │ HTTPS/REST
         ↓
┌─────────────────────────────────────┐
│   REST API Relay Service            │
│   ┌─────────────────────────────┐   │
│   │  Express REST API Server    │   │
│   │  - JWT Authentication       │   │
│   │  - Rate Limiting           │   │
│   │  - Request Validation      │   │
│   └──────────┬──────────────────┘   │
│              │                       │
│   ┌──────────┴──────────────────┐   │
│   │  Service Layer              │   │
│   │  - 3CX Integration         │   │
│   │  - Emergency Data          │   │
│   │  - Email Service           │   │
│   │  - Report Generation       │   │
│   └──────────┬──────────────────┘   │
│              │                       │
│   ┌──────────┴──────────────────┐   │
│   │  Data Layer                 │   │
│   │  - SQLite/PostgreSQL       │   │
│   │  - Cache Layer (Redis)     │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │ OAuth 2.0
         ↓
┌─────────────────┐
│   3CX V20 API   │
│  - XAPI         │
│  - Call Control │
└─────────────────┘
```

### Key Benefits

1. **Separation of Concerns**: Frontend decoupled from 3CX API logic
2. **Multi-Client Support**: Multiple dashboards/apps can consume same API
3. **Simplified Deployment**: Static frontend + standalone API service
4. **Enhanced Security**: API credentials isolated in backend service
5. **Better Caching**: Centralized caching reduces 3CX API load
6. **Easier Testing**: API endpoints can be tested independently
7. **Scalability**: API service can be horizontally scaled

### REST API Relay Service Structure

```
api-relay-service/
├── src/
│   ├── index.js                    # Express app entry point
│   ├── config/
│   │   ├── env.js                  # Environment configuration
│   │   ├── database.js             # Database connection
│   │   └── redis.js                # Redis cache configuration
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication
│   │   ├── rate-limit.js           # Rate limiting
│   │   ├── validation.js           # Request validation
│   │   ├── error-handler.js        # Global error handling
│   │   └── cors.js                 # CORS configuration
│   ├── routes/
│   │   ├── auth.routes.js          # /api/auth/*
│   │   ├── calls.routes.js         # /api/calls/*
│   │   ├── agents.routes.js        # /api/agents/*
│   │   ├── queues.routes.js        # /api/queues/*
│   │   ├── analytics.routes.js     # /api/analytics/*
│   │   ├── recordings.routes.js    # /api/recordings/*
│   │   ├── reports.routes.js       # /api/reports/*
│   │   ├── emergency.routes.js     # /api/emergency/*
│   │   ├── settings.routes.js      # /api/settings/*
│   │   └── realtime.routes.js      # /api/realtime/* (SSE)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── calls.controller.js
│   │   ├── agents.controller.js
│   │   ├── queues.controller.js
│   │   ├── analytics.controller.js
│   │   ├── recordings.controller.js
│   │   ├── reports.controller.js
│   │   ├── emergency.controller.js
│   │   └── settings.controller.js
│   ├── services/
│   │   ├── threecx-service.js      # 3CX API client wrapper
│   │   ├── cache-service.js        # Redis caching layer
│   │   ├── data-aggregation.js     # Data transformation/aggregation
│   │   ├── sentiment-analysis.js   # Sentiment scoring
│   │   ├── email-service.js        # Email notifications
│   │   ├── report-service.js       # PDF generation
│   │   ├── emergency-service.js    # Emergency data aggregation
│   │   ├── infrastructure-service.js # NBN/Power outages
│   │   └── demo-data-service.js    # Demo mode data
│   ├── models/
│   │   ├── call.model.js
│   │   ├── agent.model.js
│   │   ├── queue.model.js
│   │   ├── recording.model.js
│   │   ├── user.model.js
│   │   └── setting.model.js
│   ├── utils/
│   │   ├── logger.js               # Winston logging
│   │   ├── validators.js           # Input validation schemas
│   │   ├── formatters.js           # Data formatting utilities
│   │   └── constants.js            # Application constants
│   └── websocket/
│       ├── ws-server.js            # WebSocket server (alternative to SSE)
│       └── ws-handlers.js          # WebSocket event handlers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── Dockerfile
└── README.md
```

### REST API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/login           # User login (JWT token)
POST   /api/auth/logout          # Invalidate token
POST   /api/auth/refresh         # Refresh JWT token
GET    /api/auth/me              # Get current user info
```

#### Real-Time Data Endpoints
```
GET    /api/realtime/stream      # SSE stream for live updates
GET    /api/realtime/dashboard   # Current dashboard snapshot
GET    /api/realtime/calls       # Active calls
GET    /api/realtime/agents      # Agent status
GET    /api/realtime/queues      # Queue statistics
GET    /api/realtime/kpis        # Current KPIs
```

#### Call Management Endpoints
```
GET    /api/calls                # List calls (with filtering)
GET    /api/calls/:id            # Get call details
GET    /api/calls/active         # Get active calls
GET    /api/calls/history        # Call history with pagination
POST   /api/calls/:id/flag       # Flag a call for review
DELETE /api/calls/:id/flag       # Unflag a call
```

#### Agent Endpoints
```
GET    /api/agents               # List all agents
GET    /api/agents/:id           # Get agent details
GET    /api/agents/:id/status    # Get agent status
GET    /api/agents/:id/metrics   # Agent performance metrics
GET    /api/agents/:id/calls     # Agent call history
```

#### Queue Endpoints
```
GET    /api/queues               # List all queues
GET    /api/queues/:id           # Get queue details
GET    /api/queues/:id/stats     # Queue statistics
GET    /api/queues/:id/calls     # Calls in queue
```

#### Analytics Endpoints
```
GET    /api/analytics/overview   # Dashboard overview stats
GET    /api/analytics/trends     # Time-series trends (hour/day/week/month)
GET    /api/analytics/sentiment  # Sentiment analysis data
GET    /api/analytics/performance # Performance metrics by agent/queue
POST   /api/analytics/custom     # Custom analytics query
```

#### Recording Endpoints
```
GET    /api/recordings           # List recordings (paginated)
GET    /api/recordings/:id       # Get recording metadata
GET    /api/recordings/:id/audio # Stream audio file
GET    /api/recordings/search    # Search recordings
```

#### Report Endpoints
```
GET    /api/reports              # List available reports
POST   /api/reports/generate     # Generate custom report
GET    /api/reports/:id          # Get report metadata
GET    /api/reports/:id/download # Download PDF report
```

#### Emergency Endpoints
```
GET    /api/emergency/incidents  # All emergency incidents
GET    /api/emergency/bushfires  # Bushfire data
GET    /api/emergency/hotspots   # Satellite hotspot data
GET    /api/emergency/nbn        # NBN outages
GET    /api/emergency/power      # Power outages
```

#### Settings Endpoints
```
GET    /api/settings             # Get all settings
GET    /api/settings/:key        # Get specific setting
PUT    /api/settings/:key        # Update setting
POST   /api/settings/bulk        # Bulk update settings
```

### Data Models

#### Standardized Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-25T10:30:00Z",
    "cached": false,
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "pages": 5
    }
  },
  "error": null
}
```

#### Error Response Format
```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2025-10-25T10:30:00Z"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "startDate",
        "message": "Must be a valid ISO 8601 date"
      }
    ]
  }
}
```

### Authentication Strategy

**JWT Token-Based Authentication:**

1. **Login Flow:**
   - User submits credentials to `/api/auth/login`
   - Server validates against database
   - Returns JWT access token (15 min expiry) + refresh token (7 days)
   - Client stores tokens securely

2. **Token Structure:**
```json
{
  "sub": "user123",
  "username": "admin",
  "role": "admin",
  "permissions": ["read:calls", "write:settings", "admin:users"],
  "iat": 1698234567,
  "exp": 1698235467
}
```

3. **Authorization Middleware:**
   - Extract token from `Authorization: Bearer <token>` header
   - Verify JWT signature
   - Check expiry
   - Validate permissions for route
   - Attach user info to `req.user`

4. **Role-Based Access Control (RBAC):**
   - **admin**: Full access
   - **manager**: Analytics, reports, recordings, flagged calls
   - **qc**: View calls, flag calls, view recordings
   - **viewer**: Read-only dashboard access
   - **demo**: Limited demo mode access

### Real-Time Data Handling

#### Option 1: Server-Sent Events (SSE) - Recommended

**Benefits:**
- Native browser support
- Automatic reconnection
- Simple implementation
- One-way server-to-client (sufficient for dashboard)

**Implementation:**
```javascript
// Server-side (realtime.controller.js)
const streamDashboardData = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = generateClientId();
  const intervalId = setInterval(() => {
    const data = getDashboardSnapshot();
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 3000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
};

// Client-side (dashboard.js)
const eventSource = new EventSource('/api/realtime/stream', {
  headers: { 'Authorization': `Bearer ${token}` }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateDashboard(data);
};
```

#### Option 2: WebSocket - For Bidirectional Needs

Use WebSocket if clients need to send commands (call control, agent status updates).

**Implementation:**
```javascript
// Server-side (ws-server.js)
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const token = extractToken(req);
  const user = verifyToken(token);

  ws.user = user;

  ws.on('message', (message) => {
    const { type, payload } = JSON.parse(message);
    handleWSMessage(ws, type, payload);
  });
});

// Broadcast updates
const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};
```

#### Option 3: Polling - Fallback

Simple polling for clients that can't use SSE/WebSocket.

```javascript
// Poll every 3 seconds
setInterval(async () => {
  const data = await fetch('/api/realtime/dashboard');
  updateDashboard(await data.json());
}, 3000);
```

### Caching Strategy

**Redis Cache Layers:**

1. **Hot Data Cache (TTL: 3-5 seconds)**
   - Active calls
   - Agent status
   - Queue stats
   - Current KPIs

2. **Warm Data Cache (TTL: 30-60 seconds)**
   - Call history (recent)
   - Agent metrics (hourly)
   - Queue trends

3. **Cold Data Cache (TTL: 5-15 minutes)**
   - Historical analytics
   - Report data
   - Emergency incidents

**Cache Key Patterns:**
```
dashboard:realtime:{timestamp}
calls:active:{queueId}
agent:status:{agentId}
analytics:trends:{metric}:{period}:{date}
emergency:incidents:{type}:{region}
```

### Service Modules to Extract

#### From `server.js` → Service Layer

1. **threecx-api-client.js** → `threecx-service.js`
   - OAuth token management
   - XAPI queries (users, groups, call logs)
   - Call Control API integration
   - Error handling and retries

2. **demo-data-generator.js** → `demo-data-service.js`
   - Realistic call simulation
   - Agent state management
   - Queue dynamics
   - Keep as-is for demo mode

3. **email-service.js** → `email-service.js`
   - Keep as-is, add queue support
   - Template system for alerts
   - Batch notification support

4. **report-generator.js** → `report-service.js`
   - Keep PDFKit integration
   - Add template system
   - Queue long-running reports
   - Store generated reports in DB

5. **emergency-overlays.js** → `emergency-service.js`
   - Extract data fetching logic
   - Add caching layer
   - Normalize data formats
   - Add webhook support for real-time updates

6. **au-infrastructure-service.js** → `infrastructure-service.js`
   - NBN outage monitoring
   - Western Power outage tracking
   - Telstra status
   - Add notification triggers

#### New Services to Create

1. **cache-service.js**
   - Redis client wrapper
   - Cache invalidation patterns
   - Pub/sub for distributed cache

2. **data-aggregation.js**
   - Transform 3CX data to dashboard format
   - Calculate KPIs and metrics
   - Sentiment analysis aggregation
   - Historical trend calculation

3. **sentiment-analysis.js**
   - Move from frontend to backend
   - Keyword-based sentiment scoring
   - Store sentiment with call records
   - Aggregate sentiment metrics

### Migration Steps

#### Phase 1: Preparation (Week 1)
1. Create API relay service project structure
2. Set up Express server with basic middleware
3. Implement authentication endpoints
4. Create database migrations
5. Set up Redis cache
6. Configure logging and monitoring

#### Phase 2: Core API Development (Week 2-3)
1. Extract and refactor 3CX integration service
2. Implement real-time data endpoints (SSE)
3. Create call management endpoints
4. Implement agent and queue endpoints
5. Add caching layer
6. Write unit tests for services

#### Phase 3: Analytics & Reporting (Week 4)
1. Implement analytics endpoints
2. Migrate report generation service
3. Create recording endpoints
4. Add emergency data endpoints
5. Implement settings management
6. Write integration tests

#### Phase 4: Frontend Migration (Week 5)
1. Update frontend to use new API endpoints
2. Replace WebSocket client with SSE client
3. Update authentication flow
4. Test all dashboard features
5. Update admin and manager interfaces
6. End-to-end testing

#### Phase 5: Deployment & Cutover (Week 6)
1. Deploy API relay service to staging
2. Update frontend build process
3. Configure reverse proxy (nginx)
4. Performance testing and optimization
5. Production deployment
6. Monitor and iterate

### Database Considerations

#### Migration to PostgreSQL (Recommended for Production)

**Why PostgreSQL over SQLite:**
- Better concurrency for multi-client access
- Advanced indexing and query optimization
- JSON column support for flexible data
- Better backup and replication
- Horizontal scaling support

**Schema Changes:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_calls_timestamp ON calls(start_time DESC);
CREATE INDEX idx_calls_queue ON calls(queue_id, start_time DESC);
CREATE INDEX idx_calls_agent ON calls(agent_id, start_time DESC);
CREATE INDEX idx_calls_sentiment ON calls(sentiment_score);

-- Add full-text search for recordings
CREATE INDEX idx_recordings_search ON recordings
  USING gin(to_tsvector('english', transcript));

-- Add partitioning for call history
CREATE TABLE calls_partitioned (LIKE calls INCLUDING ALL)
  PARTITION BY RANGE (start_time);
```

#### Keep SQLite for Demo Mode
- Maintain SQLite for pentadashdemo
- Use environment variable to switch DB driver
- Ensure queries work on both databases

### Backward Compatibility

**Support Old Endpoints During Transition:**

1. **Create compatibility layer:**
```javascript
// Legacy endpoint wrapper
app.use('/legacy', legacyRoutes);

// Map old endpoints to new
app.get('/api/dashboard/data', (req, res) => {
  res.redirect(307, '/api/realtime/dashboard');
});
```

2. **Version API endpoints:**
```
/api/v1/calls  ← Old format
/api/v2/calls  ← New format with enhanced features
```

3. **Deprecation headers:**
```javascript
res.setHeader('X-API-Deprecated', 'true');
res.setHeader('X-API-Sunset', '2026-01-01');
res.setHeader('X-API-Migration', 'https://docs.example.com/migration');
```

### Configuration Management

**Environment Variables:**
```bash
# API Service
PORT=8444
NODE_ENV=production
API_VERSION=v2

# Database
DB_TYPE=postgresql  # or sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pentadash
DB_USER=pentadash
DB_PASSWORD=secure_password

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 3CX Integration
THREECX_FQDN=pentanet.3cx.com.au
THREECX_PORT=5001
THREECX_CLIENT_ID=900
THREECX_CLIENT_SECRET=your_api_key
THREECX_OAUTH_URL=https://pentanet.3cx.com.au/connect/token

# JWT Authentication
JWT_SECRET=your_random_secret_key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://dashboard.example.com
CORS_CREDENTIALS=true

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASSWORD=smtp_password
EMAIL_FROM=Pentadash Alerts <alerts@example.com>

# Emergency Services
EMERGENCY_WA_API_KEY=
DEA_HOTSPOTS_API_KEY=
NBN_API_KEY=
WESTERN_POWER_API_KEY=

# Logging
LOG_LEVEL=info  # debug, info, warn, error
LOG_FORMAT=json
LOG_FILE=/var/log/pentadash/api.log

# Demo Mode
DEMO_MODE=false
DEMO_DATA_INTERVAL=3000
```

### Testing Strategy

**Unit Tests:**
- Test individual services in isolation
- Mock external dependencies (3CX API, Redis)
- Target 80%+ code coverage

**Integration Tests:**
- Test API endpoints end-to-end
- Use test database
- Test authentication flows
- Test caching behavior

**Load Tests:**
- Use Apache Bench or k6
- Test concurrent SSE connections
- Test API throughput
- Identify bottlenecks

**E2E Tests:**
- Use Playwright or Cypress
- Test full dashboard workflows
- Test real-time updates
- Test error scenarios

### Deployment Architecture

```
┌────────────────────────────────────────┐
│  Load Balancer (nginx)                 │
│  - SSL Termination                     │
│  - Rate Limiting                       │
│  - Request Routing                     │
└────────┬──────────────────┬────────────┘
         │                  │
         ↓                  ↓
┌─────────────────┐  ┌─────────────────┐
│  Static Files   │  │  API Service    │
│  (Dashboard UI) │  │  (Node.js)      │
│                 │  │  - Multiple     │
│  nginx          │  │    instances    │
│                 │  │  - PM2 cluster  │
└─────────────────┘  └────────┬────────┘
                              │
         ┌────────────────────┴────────────────┐
         ↓                                      ↓
┌─────────────────┐                   ┌─────────────────┐
│  PostgreSQL     │                   │  Redis Cache    │
│  - Primary DB   │                   │  - Hot data     │
│  - Replica (RO) │                   │  - Pub/Sub      │
└─────────────────┘                   └─────────────────┘
```

### Monitoring & Observability

**Essential Metrics:**
- API response times (p50, p95, p99)
- Error rates by endpoint
- 3CX API latency
- Cache hit/miss ratio
- Active SSE connections
- Database query performance
- Memory and CPU usage

**Logging:**
- Structured JSON logging (Winston)
- Log aggregation (ELK stack or Loki)
- Error tracking (Sentry)
- Request tracing (correlation IDs)

**Health Checks:**
```
GET /health              # Basic health check
GET /health/ready        # Readiness probe (K8s)
GET /health/live         # Liveness probe (K8s)
GET /health/detailed     # Detailed component status
```

### Security Best Practices

1. **API Security:**
   - Rate limiting per user/IP
   - Request validation (Joi/Yup)
   - SQL injection prevention (parameterized queries)
   - XSS prevention (sanitize inputs)
   - CSRF protection for cookies

2. **Authentication:**
   - Strong JWT secrets (256-bit minimum)
   - Token rotation
   - Refresh token blacklisting
   - Password hashing (bcrypt, cost factor 12+)

3. **Data Protection:**
   - Encrypt sensitive data at rest
   - TLS 1.3 for all connections
   - Secure headers (Helmet.js)
   - CORS whitelisting
   - Content Security Policy

4. **3CX Credentials:**
   - Store in environment variables
   - Never log credentials
   - Rotate API keys regularly
   - Use separate credentials per environment

### Performance Optimization

1. **Caching:**
   - Aggressive caching of 3CX data
   - ETags for conditional requests
   - CDN for static assets
   - Redis for session storage

2. **Database:**
   - Connection pooling
   - Query optimization
   - Proper indexing
   - Materialized views for analytics

3. **API:**
   - Response compression (gzip/brotli)
   - Pagination for large datasets
   - Field filtering (?fields=id,name)
   - Batch endpoints

4. **Real-Time:**
   - SSE connection pooling
   - Broadcast optimization
   - Client-side data diffing
   - Throttle/debounce updates

## Security Notes

- Never commit `.env` files with real credentials
- JWT_SECRET should be cryptographically random in production
- Use HTTPS for all 3CX API communication in production
- API tokens/credentials in `config.js` are client-side visible - use backend proxy for production
- CORS proxy (`proxy-server.js`) is for development only - not for production use

## 3CX Server Details (Reference)

**Pentanet 3CX Configuration:**
- FQDN: `pentanet.3cx.com.au`
- Port: `5001`
- Version: V20 Update 7 (20.0.7.1057)
- External IP: 175.45.85.203
- Internal IP: 10.71.80.223

## Troubleshooting

**"Disconnected from 3CX" Error:**
1. Verify `apiUrl`, `clientId`, `clientSecret` in `config.js`
2. Check 3CX API is enabled (Settings > Advanced > API)
3. Confirm network connectivity to 3CX server
4. Try demo mode to isolate frontend vs backend issues
5. Check browser console for detailed error messages
6. Use CORS proxy for development: `node proxy-server.js`

**Demo Mode Not Working:**
1. Ensure `window.DEMO_MODE = true` in `config.js`
2. Check browser console for JavaScript errors
3. Verify all JS files are loading correctly

**Server Won't Start:**
1. Check port conflicts (8443, 8444, 9443, 9444)
2. Verify Node.js dependencies installed (`npm install`)
3. Check `.env` file exists and has required variables
4. Ensure SQLite database directory exists and is writable

## 3CX V20 Update 7 API Documentation

The repository includes comprehensive API documentation for 3CX Version 20.0 Update 7. **Always refer to these documents** for accurate API information:

### 1. `3CX_V20_U7_API_Overview.md`
**Purpose:** Complete overview and quick start guide

**Contents:**
- API ecosystem overview (Configuration API vs Call Control API)
- Prerequisites and license requirements (8SC+ Enterprise required)
- OAuth 2.0 authentication flow and token management
- Quick start guides for both APIs
- Best practices for error handling, rate limiting, WebSocket reconnection
- Common use cases (user provisioning, click-to-call, wallboard)
- Troubleshooting guide

**Use this when:** Starting a new integration, understanding the big picture, or troubleshooting authentication issues.

### 2. `3CX_V20_U7_Quick_Reference.md`
**Purpose:** Fast lookup reference for developers

**Contents:**
- Quick authentication commands
- Common API endpoints (users, departments, call control)
- OData query parameters and filters
- WebSocket event types and structures
- Audio streaming formats
- Participant status values and error codes
- Copy-paste code snippets for Python and JavaScript
- cURL command examples

**Use this when:** You need to quickly look up an endpoint, status code, or code snippet.

### 3. `3CX_V20_U7_Configuration_API.md`
**Purpose:** Complete reference for XAPI (Configuration API)

**Contents:**
- Detailed OData v4 query capabilities
- User management (create, update, delete, batch operations)
- Department/group management
- System extensions (parking, etc.)
- Live Chat configuration
- Complete code examples with Python XAPIClient class
- Error handling and validation

**Use this when:** Working with user provisioning, department management, or any system configuration tasks.

### 4. `3CX_V20_U7_Call_Control_API.md`
**Purpose:** Complete reference for Call Control API

**Contents:**
- REST API endpoints for call control
- WebSocket real-time events (connection, subscription, event types)
- Audio streaming (bidirectional PCM, format conversion)
- Complete call flow examples
- Participant actions (drop, answer, transfer, divert)
- Device-specific operations
- DTMF detection
- Complete code examples with CallControlClient class

**Use this when:** Building wallboard applications, implementing click-to-call, IVR systems, or any real-time call monitoring/control.

### Important Notes

**DO NOT use older API documentation:**
- `3CX-API-SETUP.md` - Archived, outdated
- `3CX-XAPI-SETUP.md` - Archived, outdated
- Any other non-V20 documentation in the repository

**API Version:** These docs are for 3CX Version 20.0 Update 7 (Build 979+)

**Key Differences from Older Versions:**
- V20 introduced the Configuration API (XAPI) with OData v4
- Unified OAuth 2.0 authentication for both APIs
- Enhanced Call Control API with improved WebSocket support
- Legacy WebAPI still exists but should not be used for new projects
