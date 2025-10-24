# 3CX PentaDash - Version History & Updates

**Project:** 3CX V20 Live Call Centre Dashboard
**Repository:** 3CXPentaDash
**Maintainer:** Pentanet/3CX Development Team

---

## Table of Contents

1. [Version 2.0 - Complete Overhaul (October 2025)](#version-20---complete-overhaul-october-2025)
2. [Version 1.1 - Stylelint & Code Quality (October 2025)](#version-11---stylelint--code-quality-october-2025)
3. [Version 1.0 - Initial Release (Date Unknown)](#version-10---initial-release)
4. [Upcoming Releases](#upcoming-releases)
5. [Migration Notes](#migration-notes)

---

## Version 2.0 - Complete Overhaul (October 2025)

**Release Date:** October 25, 2025
**Commit:** `d513059` - docs: add comprehensive REST API relay service migration guide
**Status:** ✅ Production Ready
**Breaking Changes:** None (fully backward compatible)

### Major Features Added

#### 1. Emergency Map System - Complete Overhaul
**Files:** `emergency-overlays.js`, `emergency-map-full.js`, `emergency-map.css`, `perth-suburbs.js`

**Real Data Integration:**
- ✅ **Emergency WA (DFES)** - Live bushfire and incident feed
  - Source: https://emergency.wa.gov.au/data/map.incidents.json
  - Red markers with incident details
  - 5-minute auto-refresh

- ✅ **DEA Satellite Hotspots** - Fire detection from space
  - Source: https://hotspots.dea.ga.gov.au/geoserver/wfs (GeoJSON WFS)
  - Orange markers with fire radiative power
  - Confidence level filtering

- ✅ **NBN Outage Monitoring** - Network outage tracking
  - Simulated data (6 Perth suburbs)
  - Blue markers with ETA and status
  - Ready for real API integration

- ✅ **Western Power Outages** - Electricity outage monitoring
  - API with fallback simulation (5 metro areas)
  - Green markers with customer count
  - Cause and restore time tracking

**Perth Suburb Mapping (NEW):**
- 15 major Perth suburbs mapped with GeoJSON boundaries
- Geocoding service with search and autocomplete
- Distance calculations (Haversine formula)
- Suburb boundary overlays (semi-transparent polygons)
- API endpoints: `/api/perth-suburbs`, `/api/geocode`

**Interactive Features:**
- Custom pinpoint tool (add/remove markers with notes)
- Smart search with real-time autocomplete
- Layer toggles (show/hide incident types)
- Map controls (reset view, fit all incidents)
- GeoJSON export functionality
- Theme support (Dark/Light/Pentanet)

**New API Endpoints:**
```
GET  /api/emergency-overlays           # All emergency data
GET  /api/emergency-overlays/meta      # Layer metadata
GET  /api/perth-suburbs                # All suburbs GeoJSON
GET  /api/perth-suburbs/search?q=      # Search suburbs
GET  /api/perth-suburbs/nearby         # Find nearby suburbs
GET  /api/geocode?suburb=              # Geocode suburb name
```

#### 2. System Status Monitoring (NEW)
**Files:** `status-monitor.js`, `admin/status.html`

**Comprehensive Service Monitoring:**
- ✅ 9 service health checks:
  1. SQLite Database connectivity
  2. 3CX Phone System connection
  3. Emergency WA feed status
  4. DEA Hotspots feed status
  5. NBN service status
  6. Western Power service status
  7. Email/SMTP configuration
  8. Disk space monitoring
  9. Memory usage tracking

**Status Dashboard Features:**
- Overall system health indicator (green/yellow/red)
- Animated pulse for operational status
- Service grid view with individual cards
- Response time metrics (milliseconds)
- Last check timestamps
- Auto-refresh every 30 seconds
- Manual refresh button

**System Information Panel:**
- Node.js version
- Platform and uptime
- Environment (dev/production)
- Demo mode status
- Port configuration

**Troubleshooting Tools:**
- Test Emergency WA connection
- Test DEA Hotspots connection
- Test 3CX API connection
- Clear application cache
- View server logs
- Export status report (JSON)

**New API Endpoints:**
```
GET   /api/admin/status                # Full system status
POST  /api/admin/status/refresh        # Force immediate refresh
GET   /api/admin/status/:service       # Specific service status
GET   /api/health                      # Public health check (200/503)
```

#### 3. Demo Mode Protection (NEW)
**Files:** `demo-mode-protection.js`

**Protection System:**
- ✅ File write protection middleware
- ✅ Database write protection wrapper
- ✅ Protected resources configuration
- ✅ Comprehensive audit logging

**Protected Operations:**
- Settings modifications (read-only in demo)
- User creation/deletion (blocked)
- Configuration file changes (blocked)
- Database schema changes (blocked)

**Allowed Operations:**
- Read operations (all data)
- Audit logging (full write access)
- Flagged calls (QC operations)
- Call recordings metadata

**Audit Logging:**
- All blocked operations logged
- Timestamp, event type, user, IP
- Last 50 events available via API
- Log file: `data/demo-protection.log`

**Configuration:**
```bash
DEMO_MODE=true                    # Enable protection
USE_SIMULATED_DATA=true          # Use demo data
ENABLE_LIVE_FEEDS=true           # Allow live emergency feeds
```

**New API Endpoint:**
```
GET  /api/admin/demo-protection   # Protection status & audit log
```

#### 4. Enhanced Administration

**Admin Panel Updates:**
- ✅ System Status page link added to sidebar
- ✅ Demo protection status integration
- ✅ Protected operations with clear error messages
- ✅ Status monitoring tools

**Manager Dashboard:**
- ✅ All 8 tabs validated and functional
- ✅ Tower Alerts page enhanced
- ✅ Report generation improvements
- ✅ Flagged calls workflow refined

#### 5. Comprehensive Documentation

**New Documentation Files:**
- ✅ **FEATURES.md** - Complete feature documentation (50+ pages)
  - All user interfaces documented
  - API endpoint reference
  - Feature matrix by role
  - Browser compatibility

- ✅ **CLAUDE.md** - Enhanced developer guide
  - Migration readiness section
  - REST API relay service architecture
  - 6-week migration plan
  - Configuration management

- ✅ **IMPLEMENTATION-SUMMARY.md** - Implementation details
  - All changes documented
  - File structure
  - Testing checklist

- ✅ **QUICK-START.md** - Quick start guide
  - Installation instructions
  - Demo accounts
  - Common tasks

- ✅ **UPDATES.md** - This file (version history)

### Statistics

**Code Changes:**
- **21 files changed**
- **6,620 lines added**
- **~1,550 lines of new server/client code**
- **~150 lines of new CSS**

**New Files Created:**
- Server: 3 new services (status-monitor, demo-protection, perth-suburbs)
- Frontend: 2 new pages (admin/status.html, enhanced emergency-map)
- Documentation: 5 new markdown files

**API Endpoints Added:**
- **12 new endpoints** for emergency, suburbs, status, demo protection

**Data Sources:**
- **2 real-time government APIs** (Emergency WA, DEA)
- **2 simulated services** with real API fallback (NBN, Western Power)
- **15 Perth suburbs** mapped with GeoJSON boundaries

### Migration Notes

**Database Schema:**
- No breaking changes
- All existing tables unchanged
- New audit log functionality uses existing schema

**Configuration:**
- New environment variables for demo mode
- Backward compatible `.env` structure
- Optional SMTP settings

**API Changes:**
- All existing endpoints maintained
- New endpoints added without versioning
- Response formats unchanged

### Upgrade Instructions

**From v1.x to v2.0:**

1. **Backup Database:**
   ```bash
   cp pentadashdemo/data/database/dashboard-demo.db dashboard-demo.db.backup
   ```

2. **Update Server Dependencies:**
   ```bash
   cd pentadashdemo/server
   npm install
   ```

3. **Update Environment Variables:**
   Add to `.env`:
   ```bash
   DEMO_MODE=true
   USE_SIMULATED_DATA=true
   ENABLE_LIVE_FEEDS=true
   ```

4. **Restart Server:**
   ```bash
   node server.js
   ```

5. **Verify Installation:**
   - Visit `/admin/status.html` (login as admin)
   - Check all 9 services show status
   - Open `/emergency-map.html` and verify data layers

**No downtime required** - Can upgrade during maintenance window

---

## Version 1.1 - Stylelint & Code Quality (October 2025)

**Release Date:** October 24, 2025 (estimated)
**Commit:** `7ce9cd4` - chore(lint): add stylelint config & npm scripts; fix CSS issues
**Status:** ✅ Stable

### Changes

**Code Quality Improvements:**
- ✅ Added Stylelint for CSS linting
- ✅ Configured stylelint-config-standard
- ✅ Added npm scripts for linting:
  - `npm run lint:css` - Lint all CSS files
  - `npm run lint:css:fix` - Auto-fix CSS issues

**Files Modified:**
- Added `.stylelintrc.json` configuration
- Updated `package.json` with linting scripts
- Fixed CSS formatting issues across codebase

**Configuration:**
```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "indentation": 2,
    "selector-class-pattern": null
  }
}
```

### Statistics

- **CSS files linted:** All CSS files in public/css
- **Issues fixed:** Formatting and best practices
- **Breaking changes:** None

---

## Version 1.0 - Initial Release

**Release Date:** Unknown (estimated early October 2025)
**Commit:** `15d129b` - first commit
**Status:** ✅ Legacy Stable

### Features

**Core Dashboard:**
- ✅ Real-time call monitoring
- ✅ Agent status board
- ✅ Queue statistics
- ✅ Basic KPI display
- ✅ Public wallboard interface

**Manager Dashboard:**
- ✅ Call flow visualization
- ✅ Recording playback
- ✅ Basic analytics
- ✅ Report generation (PDF)

**Admin Panel:**
- ✅ User management
- ✅ System settings
- ✅ Basic configuration

**Authentication:**
- ✅ JWT token-based auth
- ✅ Role-based access control (admin/manager/viewer)
- ✅ Password hashing (bcrypt)

**3CX Integration:**
- ✅ OAuth 2.0 authentication
- ✅ XAPI integration
- ✅ Call Control API support
- ✅ WebSocket for real-time events

**Database:**
- ✅ SQLite database
- ✅ Schema with users, calls, recordings, settings

**Deployment Variants:**
- ✅ pentadashdemo (demo environment)
- ✅ pentanetdashboard (production)
- ✅ Root wallboard (basic standalone)

### Initial File Structure

```
3CXPentaDash/
├── index.html
├── app.js
├── config.js
├── styles.css
├── proxy-server.js
│
├── pentadashdemo/
│   ├── server/server.js
│   ├── public/index.html
│   ├── public/manager/index.html
│   └── public/admin/index.html
│
└── pentanetdashboard/
    └── (same structure)
```

### Statistics

- **Initial commit size:** Unknown
- **Files:** ~50+ files
- **Dependencies:** Express, SQLite3, bcrypt, JWT, WebSocket
- **Features:** ~20 core features

---

## Upcoming Releases

### Version 3.0 - REST API Relay Service (Planned)

**Target Date:** Q1 2026 (6-week migration timeline)
**Status:** 🚧 Planning Phase
**Documentation:** See `CLAUDE.md` → REST API Relay Service Migration

**Planned Features:**

#### Architecture Changes
- 🎯 Decoupled REST API relay service
- 🎯 Static frontend deployment (separate from API)
- 🎯 PostgreSQL database migration
- 🎯 Redis caching layer
- 🎯 Server-Sent Events (SSE) for real-time updates

#### New API Features
- 🎯 API versioning (/api/v2/*)
- 🎯 Enhanced rate limiting
- 🎯 API key management
- 🎯 WebHook support
- 🎯 GraphQL endpoint (optional)

#### Performance Improvements
- 🎯 Horizontal scaling support
- 🎯 Load balancing (nginx)
- 🎯 CDN integration for static assets
- 🎯 Database connection pooling
- 🎯 Response compression (brotli)

#### Monitoring & Observability
- 🎯 Prometheus metrics
- 🎯 Grafana dashboards
- 🎯 Distributed tracing (Jaeger)
- 🎯 Structured logging (Winston + ELK)
- 🎯 Error tracking (Sentry)

#### Security Enhancements
- 🎯 Two-factor authentication (2FA)
- 🎯 IP whitelisting
- 🎯 Enhanced CORS policies
- 🎯 Security headers (CSP, HSTS)
- 🎯 Automated security scanning

#### Testing & Quality
- 🎯 Unit test suite (Jest)
- 🎯 Integration tests
- 🎯 E2E tests (Playwright)
- 🎯 Load testing (k6)
- 🎯 CI/CD pipeline (GitHub Actions)

#### Developer Experience
- 🎯 OpenAPI/Swagger documentation
- 🎯 Postman collection
- 🎯 SDK for common languages (JS, Python)
- 🎯 Docker compose development environment
- 🎯 Hot reload for development

#### Migration Timeline

**Phase 1: Preparation (Week 1)**
- Set up new API relay service project
- Configure PostgreSQL and Redis
- Implement authentication endpoints
- Set up development environment

**Phase 2: Core API Development (Week 2-3)**
- Extract and refactor 3CX integration service
- Implement real-time endpoints (SSE)
- Create data aggregation layer
- Add caching service

**Phase 3: Analytics & Reporting (Week 4)**
- Migrate analytics endpoints
- Enhance report generation
- Implement recording endpoints
- Add emergency data endpoints

**Phase 4: Frontend Migration (Week 5)**
- Update frontend to consume new API
- Replace WebSocket with SSE
- Update authentication flow
- Comprehensive testing

**Phase 5: Deployment & Cutover (Week 6)**
- Deploy to staging environment
- Performance testing
- Load testing
- Production cutover
- Monitoring and iteration

### Version 3.1 - Advanced Analytics (Planned)

**Target Date:** Q2 2026
**Status:** 🔮 Conceptual

**Planned Features:**
- 🎯 ML-based sentiment analysis (TensorFlow.js)
- 🎯 Predictive analytics (call volume forecasting)
- 🎯 Anomaly detection
- 🎯 Custom dashboard builder
- 🎯 Advanced reporting with scheduled delivery
- 🎯 Real-time call transcription (Speech-to-Text)
- 🎯 Multi-language support

### Version 4.0 - Mobile & Multi-Tenant (Planned)

**Target Date:** Q3-Q4 2026
**Status:** 🔮 Conceptual

**Planned Features:**
- 🎯 React Native mobile app (iOS/Android)
- 🎯 Multi-tenant architecture
- 🎯 Tenant isolation and data segregation
- 🎯 White-labeling support
- 🎯 Marketplace for plugins/extensions
- 🎯 Advanced role customization
- 🎯 SSO integration (SAML, OAuth providers)

---

## Migration Notes

### Breaking Changes History

**v2.0 → v1.x:**
- ✅ None - Fully backward compatible

**v3.0 → v2.x (Planned):**
- ⚠️ API endpoint structure may change (versioning will maintain compatibility)
- ⚠️ Database migration required (SQLite → PostgreSQL)
- ⚠️ Configuration changes (new environment variables)
- ⚠️ Deployment architecture change (separate API + frontend)
- ✅ Legacy v2 endpoints will be maintained during transition period

### Database Schema Changes

**v2.0:**
- No schema changes
- All existing tables maintained
- Audit logging uses existing infrastructure

**v3.0 (Planned):**
- Migration to PostgreSQL
- New indexes for performance
- Partitioning for call history
- Full-text search indexes
- JSON columns for flexible data

### Configuration Migration

**v1.0 → v2.0:**
```bash
# No changes required
# Optional: Add demo mode flags
DEMO_MODE=true
USE_SIMULATED_DATA=true
ENABLE_LIVE_FEEDS=true
```

**v2.0 → v3.0 (Planned):**
```bash
# New database configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pentadash
DB_USER=pentadash
DB_PASSWORD=secure_password

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# API service configuration
API_VERSION=v2
CORS_ORIGIN=https://dashboard.example.com
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

---

## Deprecation Notices

### Currently Deprecated

**None** - All features in v2.0 are actively supported

### Future Deprecations (v3.0)

**Planned for Deprecation:**
- ⚠️ Direct SQLite database access (migrate to PostgreSQL)
- ⚠️ WebSocket real-time updates (migrate to SSE)
- ⚠️ Monolithic server architecture (migrate to API relay)
- ⚠️ Embedded frontend (migrate to static deployment)

**Sunset Timeline:**
- v3.0 release: Deprecation notice
- v3.0 + 6 months: Legacy support continues
- v3.0 + 12 months: Legacy endpoints removed

**Migration Support:**
- Compatibility layer during transition
- Automated migration tools provided
- Comprehensive migration guide
- Technical support during migration

---

## Support & Compatibility

### Current Support Status

| Version | Status | Support Level | End of Life |
|---------|--------|---------------|-------------|
| v2.0 | ✅ Current | Full support | TBD (12+ months) |
| v1.1 | ✅ Stable | Security updates only | Q1 2026 |
| v1.0 | ⚠️ Legacy | No support | Immediate |

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Internet Explorer ❌ Not supported

### Node.js Compatibility

**Supported Versions:**
- Node.js 18.x ✅ Recommended
- Node.js 16.x ✅ Supported
- Node.js 14.x ⚠️ Legacy (v1.x only)
- Node.js 12.x ❌ Not supported

### Database Compatibility

**v2.0:**
- SQLite 3.x ✅

**v3.0 (Planned):**
- PostgreSQL 13+ ✅ Recommended
- PostgreSQL 11-12 ✅ Supported
- SQLite 3.x ✅ Demo mode only

---

## Contribution History

### Major Contributors

**v2.0 Development:**
- Claude Opus 4 (claude-opus-4-1-20250805) - Primary developer
- Implementation date: October 24-25, 2025
- Contributions: Emergency map, status monitoring, demo protection, documentation

**v1.1 Development:**
- Automated assistant - Code quality improvements
- Stylelint configuration

**v1.0 Development:**
- Original development team (unknown)
- Initial architecture and implementation

### Commit Statistics

| Version | Commits | Files Changed | Lines Added | Lines Removed |
|---------|---------|---------------|-------------|---------------|
| v2.0 | 1 | 21 | 6,620 | 18 |
| v1.1 | 1 | Multiple | Unknown | Unknown |
| v1.0 | 2 | 50+ | Unknown | Unknown |

---

## Release Process

### Current Process (v2.0)

1. **Development**
   - Feature development in main branch
   - Manual testing
   - Documentation updates

2. **Release**
   - Version bump in documentation
   - Commit with descriptive message
   - Tag release (future)

3. **Deployment**
   - Manual deployment to demo/production
   - Smoke testing
   - Monitoring

### Future Process (v3.0+)

1. **Development**
   - Feature branches
   - Pull requests with code review
   - Automated testing (CI)
   - Integration tests

2. **Staging**
   - Deploy to staging environment
   - Automated E2E tests
   - Performance testing
   - Security scanning

3. **Release**
   - Semantic versioning (semver)
   - Automated changelog generation
   - Git tag with release notes
   - Docker image build

4. **Deployment**
   - Blue-green deployment
   - Automated rollback capability
   - Health checks
   - Monitoring alerts

---

## Changelog Format

### Standard Format (Future Releases)

```markdown
## [Version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing features

### Deprecated
- Features marked for removal

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security patches
```

---

## Version Numbering

**Semantic Versioning:** MAJOR.MINOR.PATCH

- **MAJOR** - Incompatible API changes (v2.0 → v3.0)
- **MINOR** - Backward-compatible new features (v2.0 → v2.1)
- **PATCH** - Backward-compatible bug fixes (v2.0 → v2.0.1)

**Current Version:** 2.0.0

---

## Documentation Version History

| Document | Created | Last Updated | Version |
|----------|---------|--------------|---------|
| UPDATES.md | 2025-10-25 | 2025-10-25 | 1.0 |
| FEATURES.md | 2025-10-25 | 2025-10-25 | 1.0 |
| CLAUDE.md | Unknown | 2025-10-25 | 3.0 |
| IMPLEMENTATION-SUMMARY.md | 2025-10-24 | 2025-10-24 | 1.0 |
| QUICK-START.md | 2025-10-24 | 2025-10-24 | 1.0 |

---

**Maintained By:** 3CX PentaDash Development Team
**Last Updated:** October 25, 2025
**Next Review:** December 2025 (or upon v3.0 release planning)
**Related Docs:** CLAUDE.md, FEATURES.md, IMPLEMENTATION-SUMMARY.md, QUICK-START.md
