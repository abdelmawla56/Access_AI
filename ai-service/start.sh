#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Start the AI Service (FastAPI) on macOS / Linux
# Equivalent of start.bat for Unix systems
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "Starting AccessAI — AI Service (FastAPI)"
echo "=========================================="

cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Start FastAPI server
echo ""
echo "AI Service starting at http://localhost:8000"
echo "Press Ctrl+C to stop."
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
