#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Start ALL three Symbio Tech services (without Docker)
# Usage: ./start.sh
# Stop:  Press Ctrl+C (sends SIGTERM to all child processes)
# ─────────────────────────────────────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS=()

cleanup() {
    echo ""
    echo "[orchestrator] Shutting down all services..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null
    echo "[orchestrator] All services stopped."
}
trap cleanup EXIT INT TERM

echo "═══════════════════════════════════════════════════════════════"
echo "  Symbio Tech — Starting All Services"
echo "═══════════════════════════════════════════════════════════════"

# ── 1. AI Service (FastAPI on port 8000) ──────────────────────────────────────
echo ""
echo "[1/3] Starting AI Service (FastAPI)..."
(
    cd "$ROOT_DIR/ai-service"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt --quiet 2>&1
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | sed 's/^/  [ai-service] /'
) &
PIDS+=($!)

# Give AI service a head start (backend depends on it)
sleep 3

# ── 2. Backend (Node.js/Express on port 5000) ─────────────────────────────────
echo "[2/3] Starting Backend (Express)..."
(
    cd "$ROOT_DIR/backend"
    npm install --silent 2>&1
    npm start 2>&1 | sed 's/^/  [backend]    /'
) &
PIDS+=($!)

sleep 2

# ── 3. Frontend (Next.js on port 3000) ────────────────────────────────────────
echo "[3/3] Starting Frontend (Next.js)..."
(
    cd "$ROOT_DIR/frontend"
    npm install --silent 2>&1
    npm run dev 2>&1 | sed 's/^/  [frontend]   /'
) &
PIDS+=($!)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ All services launching..."
echo "  • AI Service:  http://localhost:8000"
echo "  • Backend:     http://localhost:5000"
echo "  • Frontend:    http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop all services."
echo "═══════════════════════════════════════════════════════════════"

# Wait for all background processes
wait
