@echo off
title Shiksha AI • ShikkhokSathi Runner
cls

echo ===================================================
echo     Shiksha AI • ShikkhokSathi Project Runner
echo ===================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js ^(v18.x or later^) and try again.
    pause
    exit /b 1
)

:: Check if node_modules folders exist
set "INSTALL_NEEDED=0"
if not exist "backend\node_modules\" set "INSTALL_NEEDED=1"
if not exist "student-ui\node_modules\" set "INSTALL_NEEDED=1"

if "%INSTALL_NEEDED%"=="1" (
    echo [INFO] Dependencies appear to be missing. Installing now...
    call npm run install:all
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

echo [INFO] Starting the application...
echo Press Ctrl+C in this terminal window to stop the servers.
echo ---------------------------------------------------
echo.

call npm start

pause
