@echo off
echo ====================================
echo Murdoch Survey System - Starting...
echo ====================================

cd /d "%~dp0"

echo.
echo [1/3] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies...
echo Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Installing client dependencies...
cd client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Starting development servers...
echo.
echo ====================================
echo Server will start shortly...
echo ====================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo Admin:    http://localhost:5173/admin
echo.
echo Default login:
echo   Email:    admin@murdoch.edu.au
echo   Password: Admin@2024!
echo ====================================
echo.

npm run dev

pause
