@echo off
title Push GolfApp naar GitHub
cd /d "%~dp0"

echo ===================================================
echo     GolfApp publiceren naar GitHub Pages
echo ===================================================
echo.
echo Zorg ervoor dat je eerst op github.com een NIEUWE repository hebt aangemaakt
echo (bijvoorbeeld met de naam 'golfapp', ingesteld op Public).
echo.
set /p REPO_URL="Plak hier de URL van je GitHub repository (bijv. https://github.com/gebruiker/golfapp.git): "

if "%REPO_URL%"=="" (
    echo Geen URL ingevuld. Het script stopt.
    pause
    exit /b
)

echo.
echo Koppelen aan GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Bestanden uploaden (push naar GitHub)...
git push -u origin main

echo.
echo ===================================================
echo Klaar! Ga nu op GitHub naar je repository:
echo 1. Klik op 'Settings' (bovenin).
echo 2. Klik links op 'Pages'.
echo 3. Kies bij Branch: 'main' en klik op 'Save'.
echo.
echo Binnen 1 a 2 minuten is je app live via HTTPS!
echo ===================================================
pause
