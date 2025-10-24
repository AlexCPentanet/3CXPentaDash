@echo off
echo ========================================
echo Starting 3CX Wallboard with CORS Proxy
echo ========================================
echo.

echo Step 1: Starting CORS Proxy Server...
start "3CX CORS Proxy" cmd /k "node proxy-server.js"
timeout /t 2 /nobreak >nul

echo Step 2: Starting Web Server...
start "Wallboard Web Server" cmd /k "python -m http.server 8000"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo Servers Started Successfully!
echo ========================================
echo.
echo Proxy Server:  http://localhost:8080
echo Web Server:    http://localhost:8000
echo.
echo Open your browser to:
echo   http://localhost:8000/index.html
echo.
echo Press any key to STOP all servers...
echo ========================================
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WINDOWTITLE eq 3CX CORS Proxy*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Wallboard Web Server*" /T /F >nul 2>&1
echo Servers stopped.
pause
