@echo off
title Symbio Tech Orchestrator
cls
echo ==============================================================
echo   Symbio Tech - Starting All Services (Local Windows Run)
echo ==============================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python.
    pause
    exit /b 1
)

echo [1/3] Launching AI Service (FastAPI) in a new window...
start "AI Service (Port 8000)" cmd /k "cd /d "%~dp0ai-service" && call start.bat"

echo [2/3] Launching Backend (Express) in a new window...
start "Backend Service (Port 5000)" cmd /k "cd /d "%~dp0backend" && echo Installing dependencies... && npm install && echo Starting Backend... && npm run dev"

echo [3/3] Launching Frontend (Next.js) in a new window...
start "Frontend Service (Port 3000)" cmd /k "cd /d "%~dp0frontend" && echo Installing dependencies... && npm install && echo Starting Frontend... && npm run dev"

echo.
echo ==============================================================
echo   Services are starting up in separate terminal windows!
echo.
echo   - AI Service:  http://localhost:8000
echo   - Backend:     http://localhost:5000
echo   - Frontend:    http://localhost:3000
echo.
echo   To stop a service, simply close its terminal window.
echo ==============================================================
pause
