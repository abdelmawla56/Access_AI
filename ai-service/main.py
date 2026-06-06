"""
AI Service — FastAPI
Exposes:
  POST /ocr     — Tesseract OCR on uploaded image
  POST /detect  — YOLOv8 object detection on uploaded image
  POST /scene   — Scene understanding (detect + describe)
  POST /search  — Object search (detect + filter by target label)
  GET  /health  — health check
"""

import time
import io
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from ocr_service import run_ocr
from detection_service import run_detection
from scene_service import run_scene

app = FastAPI(title="Accessibility AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"ok": True, "ts": time.time()}


# ─── OCR ──────────────────────────────────────────────────────────────────────
@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    """
    Accepts an image file, runs Tesseract OCR, returns extracted text.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = run_ocr(image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Detection ────────────────────────────────────────────────────────────────
@app.post("/detect")
async def detect_endpoint(
    file: UploadFile = File(...),
    confidence: float = Form(0.4),
):
    """
    Accepts an image file, runs YOLOv8 detection, returns bounding boxes.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = run_detection(image, confidence_threshold=confidence)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Scene Understanding ──────────────────────────────────────────────────────
@app.post("/scene")
async def scene_endpoint(
    file: UploadFile = File(...),
    confidence: float = Form(0.35),
):
    """
    Accepts an image, runs detection + scene NLG, returns natural language description.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = run_scene(image, confidence_threshold=confidence)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Smart Object Search ──────────────────────────────────────────────────────
@app.post("/search")
async def search_endpoint(
    file: UploadFile = File(...),
    target: str = Form(...),
    confidence: float = Form(0.35),
):
    """
    Accepts an image + target label, runs detection, returns whether target was found
    and its position in the frame.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        det_result = run_detection(image, confidence_threshold=confidence)
        detections = det_result["detections"]
        image_width = det_result["image_width"]
        image_height = image.height

        target_lower = target.lower().strip()
        # Find all detections matching the target (fuzzy: label contains target word)
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
            hint = f"Found! {target.capitalize()} is {position}, {dist}, with {round(best['confidence']*100)}% confidence."

        return {
            "found": found,
            "target": target,
            "matches": matches,
            "position": position,
            "hint": hint,
            "fps": det_result["fps"],
            "processingMs": round((det_result.get("processingMs") or 0)),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
