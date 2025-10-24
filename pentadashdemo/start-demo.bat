@echo off
REM Pentadash Demo Startup Script
REM Starts the demo server on ports 9443 (Web) and 9444 (API)

echo ========================================
echo    PENTADASH DEMO - UI QC REVIEW
echo ========================================
echo.
echo Starting demo server...
echo.
echo Web Interface: https://localhost:9443
echo API Server:    https://localhost:9444
echo.
echo Demo Accounts:
echo   Admin:   admin / Admin123!
echo   Manager: manager / Manager123!
echo   QC:      qc / QC123!
echo   Demo:    demo / Demo123!
echo   Viewer:  viewer / Viewer123!
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd server
node server.js

pause
