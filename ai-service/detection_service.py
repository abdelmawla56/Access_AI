"""
Detection Service — YOLOv8 via Ultralytics
Loads yolov8n.pt (nano, fastest) once at startup.
Returns bounding boxes, labels, and confidence per detected object.
"""

import time
from PIL import Image
import numpy as np

# Lazy-load YOLO so startup is fast even without GPU
_model = None


def _get_model():
    global _model
    if _model is None:
        import torch
        # PyTorch 2.6 compatibility: monkeypatch torch.load to support loading YOLO weights
        original_load = torch.load
        def safe_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        torch.load = safe_load

        from ultralytics import YOLO
        # yolov8n = nano model — best speed/accuracy trade-off for real-time
        _model = YOLO("yolov8n.pt")
    return _model


def run_detection(image: Image.Image, confidence_threshold: float = 0.4) -> dict:
    """
    Run YOLOv8 on a PIL image.
    Returns:
        detections  — list of {label, confidence, bbox: [x1,y1,x2,y2]}
        count       — number of detections
        fps         — approximate processing FPS
        image_width — original image width (used by navigation logic)
    """
    model = _get_model()
    img_array = np.array(image)
    image_width = image.width

    t0 = time.perf_counter()
    results = model.predict(
        source=img_array,
        conf=confidence_threshold,
        verbose=False,
        device="cpu",   # change to "0" for CUDA GPU
    )
    elapsed = time.perf_counter() - t0
    fps = round(1.0 / elapsed, 1) if elapsed > 0 else 0

    detections = []
    if results and results[0].boxes is not None:
        boxes = results[0].boxes
        names = model.names or {}
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
            
            # Safely get the label string, fallback to stringified ID if not found
            label_name = names[cls_id] if names and cls_id in names else str(cls_id)
            
            detections.append(
                {
                    "label": label_name,
                    "confidence": round(conf, 3),
                    "bbox": [round(x1), round(y1), round(x2), round(y2)],
                }
            )

    return {
        "detections": detections,
        "count": len(detections),
        "fps": fps,
        "image_width": image_width,
    }
