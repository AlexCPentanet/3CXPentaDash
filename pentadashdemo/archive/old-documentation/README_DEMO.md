# Pentadash Demo - UI QC Review Instance

This is a dedicated demo version of the Pentanet 3CX Dashboard for UI quality control and review purposes.

## Quick Start

### 1. Start the Server
```cmd
start-demo.bat
```
or
```powershell
.\start-demo.ps1
```

### 2. Access the Dashboard
Open your browser and go to:
**http://localhost:9443/**

### 3. Login Credentials

| Account | Username | Password | Use Case |
|---------|----------|----------|----------|
| Admin | admin | Admin123! | Full system access |
| QC Reviewer | qc | QC123! | QC testing |
| Manager | manager | Manager123! | Manager features |
| Demo | demo | Demo123! | General demo |
| Viewer | viewer | Viewer123! | Public view only |

## What's Included

- **8 Tower Locations** - Perth metro area coverage
- **5 Flagged Calls** - Sample sentiment analysis data
- **Live Infrastructure Feeds** - Simulated NBN, Power, Fire, and Flood data
- **Complete UI** - All dashboards, maps, and admin panels
- **Real-time Updates** - WebSocket-based live data

## Key Features to Review

1. **Public Wallboard** - http://localhost:9443/
2. **Manager Dashboard** - http://localhost:9443/manager
3. **Admin Panel** - http://localhost:9443/admin
4. **Infrastructure Map** - http://localhost:9443/map

## Documentation

See [DEMO_ACCESS_INSTRUCTIONS.md](DEMO_ACCESS_INSTRUCTIONS.md) for complete documentation including:
- Detailed feature descriptions
- Testing checklist
- Troubleshooting guide
- Technical specifications

## Support

If you encounter any issues:
1. Check server console for errors
2. Verify browser console (F12) for frontend issues
3. Ensure Node.js 20 is installed
4. Reset demo data: `cd server && node init-demo-db.js`

---

**Demo Server Ports:**
- Web Interface: 9443
- API Server: 9444

**Database:**
`data/database/dashboard-demo.db`

**Environment:**
Development mode with simulated data feeds
