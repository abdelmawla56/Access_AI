"""
Detection Service — YOLOv8 via Ultralytics
Refactored into DetectionService class with:
  - Eager model loading at startup (no cold-start latency per request)
  - Image resize to 640x640 before inference
  - Class-based design matching OCRService pattern
"""

import time
import io
import os
import numpy as np
from PIL import Image


class DetectionService:
    """
    Encapsulates YOLOv8 with the model loaded once at startup.
    Call analyze() for each request.
    """

    def __init__(self):
        import torch

        # PyTorch 2.6 compatibility: allow loading YOLO weights
        original_load = torch.load

        def safe_load(*args, **kwargs):
            kwargs["weights_only"] = False
            return original_load(*args, **kwargs)

        torch.load = safe_load

        from ultralytics import YOLO

        model_path = os.getenv("YOLO_MODEL", "yolov8n.pt")
        self.model = YOLO(model_path)
        print(f"[DetectionService] YOLO model '{model_path}' loaded.")

    @staticmethod
    def preprocess(image_bytes: bytes) -> Image.Image:
        """
        Open raw bytes and resize to 640×640 (YOLO native input size).
        Using LANCZOS for high-quality downscaling.
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((640, 640), Image.LANCZOS)
        return img

    def analyze(self, image_bytes: bytes, confidence_threshold: float = 0.4) -> dict:
        """
        Run YOLOv8 on raw image bytes.

        Returns:
            {detections, count, fps, inference_ms, image_width}
        """
        image = self.preprocess(image_bytes)
        img_array = np.array(image)
        image_width = image.width  # always 640 after resize

        t0 = time.perf_counter()
        results = self.model.predict(
            source=img_array,
            conf=confidence_threshold,
            verbose=False,
            device="cpu",  # change to "0" for CUDA GPU
        )
        elapsed = time.perf_counter() - t0
        inference_ms = round(elapsed * 1000)
        fps = round(1.0 / elapsed, 1) if elapsed > 0 else 0

        detections = []
        if results and results[0].boxes is not None:
            boxes = results[0].boxes
            names = self.model.names or {}
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                label_name = names[cls_id] if names and cls_id in names else str(cls_id)
                detections.append({
                    "label": label_name,
                    "confidence": round(conf, 3),
                    "bbox": [round(x1), round(y1), round(x2), round(y2)],
                })

        return {
            "detections": detections,
            "count": len(detections),
            "fps": fps,
            "inference_ms": inference_ms,
            "processingMs": inference_ms,
            "image_width": image_width,
        }


# ─── Backward-compatible module-level function ────────────────────────────────
_default_service: DetectionService = None


def _get_service() -> DetectionService:
    global _default_service
    if _default_service is None:
        _default_service = DetectionService()
    return _default_service


def run_detection(image: Image.Image, confidence_threshold: float = 0.4) -> dict:
    """Legacy function for backward compatibility with scene_service.py"""
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    return _get_service().analyze(buf.getvalue(), confidence_threshold)
