@echo off
echo ========================================
echo   Starting Garde Application
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if FFmpeg is installed
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: FFmpeg is not installed!
    echo Video processing will not work without FFmpeg.
    echo Please install from https://ffmpeg.org/
    echo.
)

echo Starting Backend Server...
start "Garde Backend" cmd /k "cd server && npm run dev"
timeout /t 3 >nul

echo Starting Frontend...
start "Garde Frontend" cmd /k "cd client && npm run dev"
timeout /t 2 >nul

echo.
echo ========================================
echo   Garde is starting!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Wait 10-20 seconds, then open:
echo http://localhost:3000
echo.
echo Press any key to open the app in your browser...
pause >nul

REM Open default browser
start http://localhost:3000

echo.
echo To stop the servers, close the two terminal windows.
echo.
pause
