@echo off
echo Starting local web server for 3CX Wallboard...
echo.
echo Open your browser to: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8000

pause
