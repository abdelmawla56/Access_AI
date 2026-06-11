# Symbio Tech Orchestrator for PowerShell
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Symbio Tech - Starting All Services (Local Windows Run)" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js."
    return
}

# Check for Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH. Please install Python."
    return
}

Write-Host "[1/3] Launching AI Service (FastAPI) in a new window..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\ai-service`" && call start.bat"

Write-Host "[2/3] Launching Backend (Express) in a new window..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\backend`" && echo Installing dependencies... && npm install && echo Starting Backend... && npm run dev"

Write-Host "[3/3] Launching Frontend (Next.js) in a new window..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\frontend`" && echo Installing dependencies... && npm install && echo Starting Frontend... && npm run dev"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Services are starting up in separate terminal windows!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  - AI Service:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "  - Backend:     http://localhost:5000" -ForegroundColor Yellow
Write-Host "  - Frontend:    http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To stop a service, simply close its terminal window." -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
