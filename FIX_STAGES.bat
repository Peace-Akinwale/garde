@echo off
echo ================================
echo  FIXING STAGES ANIMATION ISSUE
echo ================================
echo.

echo Step 1: Checking files...
cd C:\AKINWALE\Garde

if exist "client\components\StageProgressTracker.js" (
    echo [OK] StageProgressTracker.js exists
) else (
    echo [ERROR] StageProgressTracker.js missing!
    pause
    exit
)

if exist "server\services\jobProcessor.js" (
    echo [OK] jobProcessor.js exists
) else (
    echo [ERROR] jobProcessor.js missing!
    pause
    exit
)

echo.
echo Step 2: Database Migration
echo ================================
echo IMPORTANT: You need to run this in Supabase SQL Editor:
echo.
echo ALTER TABLE public.processing_jobs
echo ADD COLUMN IF NOT EXISTS stages JSONB DEFAULT NULL;
echo.
echo Press any key after you've run the migration in Supabase...
pause

echo.
echo Step 3: Restarting servers...
echo ================================
echo.
echo Please do the following:
echo.
echo 1. Stop backend (Ctrl+C in backend terminal)
echo 2. Stop frontend (Ctrl+C in frontend terminal)
echo 3. Run start-app.bat again
echo.
echo 4. In browser, press Ctrl+Shift+R (hard refresh)
echo 5. Process a new video
echo.
echo The stages should now animate!
echo.
pause
