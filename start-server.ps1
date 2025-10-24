# PowerShell script to start a local web server
Write-Host "Starting local web server for 3CX Wallboard..." -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser to: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Try Python first
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8000
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server 8000
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    # Try npx http-server if node is available
    npx http-server -p 8000
} else {
    Write-Host "Error: Python or Node.js required to run local server" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Yellow
    pause
}
