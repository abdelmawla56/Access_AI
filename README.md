# AccessAI — Voice-First Accessibility Application

A voice-controlled AI assistant for visually impaired users featuring **OCR**, **Object Detection**, and **Navigation Assistance**.

---

## Project Structure

```
senior project/
├── frontend/          # Next.js + Tailwind CSS UI
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           ← Main orchestration page
│   ├── components/
│   │   ├── MicButton.tsx      ← Animated mic with ripple
│   │   ├── FeatureSelector.tsx
│   │   ├── CameraFeed.tsx
│   │   └── ResultPanel.tsx
│   ├── hooks/
│   │   ├── useVoiceRecognition.ts
│   │   ├── useTTS.ts
│   │   └── useCamera.ts
│   └── lib/
│       └── api.ts             ← All backend API calls
│
├── backend/           # Node.js + Express + WebSockets
│   └── src/
│       ├── index.js           ← Server + WS hub
│       ├── middleware/upload.js
│       └── routes/
│           ├── ocr.js
│           ├── detection.js
│           ├── navigation.js
│           └── status.js
│
└── ai-service/        # Python FastAPI
    ├── main.py                ← FastAPI app
    ├── ocr_service.py         ← Tesseract OCR
    ├── detection_service.py   ← YOLOv8 detection
    ├── requirements.txt
    └── start.bat              ← Windows startup script
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Tesseract OCR | 5.x | https://github.com/UB-Mannheim/tesseract/wiki |

> **Tesseract on Windows**: After installing, add `C:\Program Files\Tesseract-OCR` to your PATH.  
> Or set the path in `ai-service/ocr_service.py` line 12.

---

## Quick Start

### 1. AI Service (Python)
```bash
cd ai-service
start.bat          # Creates venv, installs deps, starts FastAPI on :8000
```

### 2. Backend (Node.js)
```bash
cd backend
npm install
npm run dev        # Express + WebSocket server on :5000
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install        # Already done
npm run dev        # UI on http://localhost:3000
```

---

## Voice Commands

| Command | Action |
|---------|--------|
| `"Start OCR"` | Switch to text reading mode |
| `"Detect objects"` | Switch to object detection |
| `"Navigate"` | Switch to navigation mode |
| `"Scan"` / `"Go"` | Capture frame & analyze |
| `"Stop"` | Return to standby |
| `"Repeat"` | Replay last TTS result |
| `"Debug on/off"` | Toggle debug panel (FPS, confidence) |

---

## Architecture

```
Browser (Next.js)
  │
  ├── Web Speech API (Voice Recognition)
  ├── Speech Synthesis API (TTS)
  ├── MediaStream API (Camera)
  │
  ├── REST POST /api/ocr/scan        ──► Node Backend ──► Python /ocr
  ├── REST POST /api/detection/analyze ─► Node Backend ──► Python /detect
  ├── REST POST /api/navigation/guide ──► Node Backend ──► Python /detect
  └── WebSocket ws://localhost:5000/ws  (real-time state sync)
```

---

## Debug Mode

Enable via voice `"Debug on"` or the button in the top-right.  
Shows: **FPS**, **Confidence %**, **Latency (ms)** below results.

---

## Performance Tips

- YOLOv8 **nano** (`yolov8n.pt`) is used by default — fastest model.  
  Swap to `yolov8s.pt` (small) for better accuracy on better hardware.
- For GPU acceleration, change `device="cpu"` → `device="0"` in `detection_service.py`.
- Tesseract accuracy improves with better lighting and held-steady camera.
