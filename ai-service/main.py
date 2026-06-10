"""
AI Service — FastAPI
Exposes:
  POST /ocr          — Tesseract OCR on uploaded image (?lang=eng|ara|eng+ara)
  POST /detect       — YOLOv8 object detection on uploaded image
  POST /scene        — Scene understanding (detect + describe)
  POST /search       — Object search (detect + filter by target label)
  GET  /health       — Comprehensive health check
"""

import os
import time
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# Load environment variables from .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from ocr_service import OCRService
from detection_service import DetectionService
from scene_service import run_scene

# ─── Service instances (pre-loaded at startup) ────────────────────────────────
detection_svc: DetectionService = None
ocr_svc: OCRService = None
start_time = time.time()

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "5")) * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


# ─── Input validation dependency ──────────────────────────────────────────────
async def validate_image_upload(file: UploadFile = File(...)) -> UploadFile:
    """
    Reusable dependency that validates image uploads:
      1. MIME type must be JPEG, PNG, or WebP
      2. File size re-checked as defense-in-depth (middleware is first line)
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}.",
        )
    # Read and re-check size (defense-in-depth — middleware may be bypassed by streaming)
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(contents)} bytes). Maximum: {MAX_UPLOAD_BYTES // (1024*1024)}MB.",
        )
    # Seek back so downstream handlers can re-read
    await file.seek(0)
    return file


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all ML models at startup to eliminate cold-start latency."""
    global detection_svc, ocr_svc

    print("[startup] Loading YOLOv8 model...")
    detection_svc = DetectionService()

    print("[startup] Initializing Tesseract OCR...")
    ocr_svc = OCRService()

    print("[startup] ✅ All models ready. Service accepting requests.\n")
    yield
    print("[shutdown] Cleaning up.")


app = FastAPI(
    title="Accessibility AI Service",
    version="2.0.0",
    lifespan=lifespan,
)


# ─── Upload size guard middleware ─────────────────────────────────────────────
@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_UPLOAD_BYTES:
        return JSONResponse(
            {"error": f"File too large. Maximum allowed size is {MAX_UPLOAD_BYTES // (1024*1024)}MB."},
            status_code=413,
        )
    return await call_next(request)


# ─── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    os.getenv("FRONTEND_URL", ""),
    os.getenv("BACKEND_URL", ""),
]
allowed_origins = [o for o in allowed_origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["http://localhost:3000"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - start_time),
        "models_loaded": detection_svc is not None and ocr_svc is not None,
        "yolo_model": os.getenv("YOLO_MODEL", "yolov8n.pt"),
        "ocr_languages": os.getenv("OCR_LANGUAGES", "eng+ara"),
        "version": "2.0.0",
    }


# ─── OCR ──────────────────────────────────────────────────────────────────────
@app.post("/ocr")
async def ocr_endpoint(
    file: UploadFile = Depends(validate_image_upload),
    lang: str = Query(default=None, description="Tesseract language, e.g. eng, ara, eng+ara"),
):
    """
    Accepts an image file, runs Tesseract OCR, returns extracted text.
    Query param ?lang=ara to select language (defaults to OCR_LANGUAGES env var).
    """
    try:
        contents = await file.read()
        return ocr_svc.read(contents, lang=lang)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Detection ────────────────────────────────────────────────────────────────
@app.post("/detect")
async def detect_endpoint(
    file: UploadFile = Depends(validate_image_upload),
    confidence: float = Form(0.4),
):
    """
    Accepts an image file, runs YOLOv8 detection, returns bounding boxes.
    """
    try:
        contents = await file.read()
        return detection_svc.analyze(contents, confidence_threshold=confidence)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Scene Understanding ──────────────────────────────────────────────────────
@app.post("/scene")
async def scene_endpoint(
    file: UploadFile = Depends(validate_image_upload),
    confidence: float = Form(0.35),
):
    """
    Accepts an image, runs detection + scene NLG, returns natural language description.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        return run_scene(image, confidence_threshold=confidence)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Smart Object Search ──────────────────────────────────────────────────────
@app.post("/search")
async def search_endpoint(
    file: UploadFile = Depends(validate_image_upload),
    target: str = Form(...),
    confidence: float = Form(0.35),
):
    """
    Accepts an image + target label, returns whether target was found and its position.
    """
    try:
        contents = await file.read()
        det_result = detection_svc.analyze(contents, confidence_threshold=confidence)
        detections = det_result["detections"]
        image_width = det_result["image_width"]

        # Re-open for height
        image = Image.open(io.BytesIO(contents))
        image_height = image.height

        target_lower = target.lower().strip()
        matches = [
            d for d in detections
            if target_lower in d["label"].lower() or d["label"].lower() in target_lower
        ]

        found = len(matches) > 0
        position = None
        hint = f"No {target} found in the current view. Keep scanning."

        if found:
            best = max(matches, key=lambda d: d["confidence"])
            cx = (best["bbox"][0] + best["bbox"][2]) / 2
            frac = cx / image_width
            if frac < 0.33:
                position = "to your left"
            elif frac < 0.67:
                position = "directly ahead"
            else:
                position = "to your right"
            h = best["bbox"][3] - best["bbox"][1]
            dist_ratio = h / image_height
            dist = "very close" if dist_ratio > 0.5 else "nearby" if dist_ratio > 0.25 else "at a distance"
            hint = f"Found! {target.capitalize()} is {position}, {dist}, with {round(best['confidence'] * 100)}% confidence."

        return {
            "found": found,
            "target": target,
            "matches": matches,
            "position": position,
            "hint": hint,
            "fps": det_result["fps"],
            "processingMs": round(det_result.get("processingMs") or 0),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
