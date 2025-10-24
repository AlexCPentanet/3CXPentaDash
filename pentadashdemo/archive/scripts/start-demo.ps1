#!/usr/bin/env pwsh
# Pentadash Demo Startup Script (PowerShell)
# Starts the demo server on ports 9443 (Web) and 9444 (API)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PENTADASH DEMO - UI QC REVIEW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting demo server..." -ForegroundColor Green
Write-Host ""
Write-Host "Web Interface: " -NoNewline -ForegroundColor Yellow
Write-Host "https://localhost:9443" -ForegroundColor White
Write-Host "API Server:    " -NoNewline -ForegroundColor Yellow
Write-Host "https://localhost:9444" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "   Admin:   admin / Admin123!" -ForegroundColor White
Write-Host "   Manager: manager / Manager123!" -ForegroundColor White
Write-Host "   QC:      qc / QC123!" -ForegroundColor White
Write-Host "   Demo:    demo / Demo123!" -ForegroundColor White
Write-Host "   Viewer:  viewer / Viewer123!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "server"
node server.js
