@echo off
echo Starting AccessAI - AI Service (FastAPI)
echo ==========================================
cd /d "%~dp0"

:: Check if venv exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt --quiet

:: Start FastAPI server
echo.
echo AI Service starting at http://localhost:8000
echo Press Ctrl+C to stop.
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
