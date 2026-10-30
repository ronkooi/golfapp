@echo off
title Zeegersloot Griendbaan Scorekaart App
cd /d "%~dp0"

echo ===================================================
echo   Golfclub Zeegersloot - Griendbaan Scorekaart
echo ===================================================
echo.
echo Lokale server wordt gestart...

:: Start the Python HTTP server in a separate background window
start "GolfApp Server" /B python -m http.server 8000

:: Wait 1 second to ensure server is listening
timeout /t 1 /nobreak >nul

:: Open default browser cleanly
start "" "http://localhost:8000"

echo.
echo ===================================================
echo   De browser is geopend op: http://localhost:8000
echo.
echo   Om op je telefoon te openen (in hetzelfde Wi-Fi netwerk):
echo   Kijk naar je IPv4-adres hieronder:
echo ===================================================
ipconfig | findstr /i "IPv4"
echo.
echo Sluit dit venster niet zolang je de app wilt gebruiken.
echo Druk op een toets om de server te stoppen.
pause >nul
