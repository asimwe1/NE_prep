@echo off
REM FireShield Database Management Script
REM This script provides options for database setup and management

:menu
cls
echo ========================================
echo FireShield Database Management
echo ========================================
echo.
echo Please select an option:
echo.
echo 1. Setup Database (Migrate + Seed)
echo 2. Truncate All Tables (Delete All Data)
echo 3. Reset Database (Truncate + Migrate + Seed)
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto truncate
if "%choice%"=="3" goto reset
if "%choice%"=="4" goto end
echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

:setup
cls
echo ========================================
echo Setting Up Database
echo ========================================
echo.
node scripts\seed-database.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup failed. Please check the error above.
    pause
    goto menu
)
pause
goto menu

:truncate
cls
echo ========================================
echo Truncate All Tables
echo ========================================
echo.
echo WARNING: This will DELETE ALL DATA!
echo.
node scripts\truncate-database.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Truncation failed. Please check the error above.
    pause
    goto menu
)
pause
goto menu

:reset
cls
echo ========================================
echo Reset Database
echo ========================================
echo.
echo This will:
echo 1. Delete all data (truncate tables)
echo 2. Run migrations
echo 3. Seed admin users
echo.
set /p confirm="Are you sure? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo.
    echo Operation cancelled.
    timeout /t 2 >nul
    goto menu
)

echo.
echo Step 1: Truncating tables...
node scripts\truncate-database.js --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Truncation failed. Please check the error above.
    pause
    goto menu
)

echo.
echo Step 2: Running migrations and seeding...
node scripts\seed-database.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup failed. Please check the error above.
    pause
    goto menu
)

echo.
echo ========================================
echo Database reset complete!
echo ========================================
pause
goto menu

:end
echo.
echo Exiting...
exit /b 0
