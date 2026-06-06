"""
Scene Service — Natural Language Scene Description
Converts YOLOv8 detections + spatial layout into a spoken scene summary.
Works fully offline (template-based NLG). No extra model required.
"""

import time
import io
import os
from PIL import Image

from detection_service import run_detection

# ─── Object semantic categories ───────────────────────────────────────────────
INDOOR_OBJECTS   = {"chair","sofa","bed","dining table","toilet","sink","tv","laptop",
                    "microwave","oven","refrigerator","book","clock","vase","keyboard","mouse"}
OUTDOOR_OBJECTS  = {"car","truck","bus","motorcycle","bicycle","traffic light","stop sign",
                    "bench","fire hydrant","parking meter"}
FOOD_OBJECTS     = {"apple","banana","orange","broccoli","carrot","hot dog","pizza",
                    "donut","cake","sandwich","bottle","cup","fork","knife","spoon","bowl"}
PEOPLE_OBJECTS   = {"person"}
ANIMAL_OBJECTS   = {"cat","dog","bird","horse","cow","sheep","elephant","bear","zebra","giraffe"}

DANGER_LABELS    = {"car","truck","bus","motorcycle","bicycle","person"}
HIGH_CONFIDENCE  = 0.55


def _zone(bbox, image_width: int) -> str:
    cx = (bbox[0] + bbox[2]) / 2
    frac = cx / image_width
    if frac < 0.33:
        return "left"
    elif frac < 0.67:
        return "center"
    else:
        return "right"


def _estimate_distance(bbox, image_height: int) -> str:
    """Heuristic: larger bounding box relative to image = closer."""
    h = bbox[3] - bbox[1]
    ratio = h / image_height
    if ratio > 0.6:
        return "very close"
    elif ratio > 0.35:
        return "nearby"
    elif ratio > 0.15:
        return "at mid-distance"
    else:
        return "far away"


def _guess_environment(labels: set) -> str:
    indoor_hits  = len(labels & INDOOR_OBJECTS)
    outdoor_hits = len(labels & OUTDOOR_OBJECTS)
    food_hits    = len(labels & FOOD_OBJECTS)
    people_hits  = len(labels & PEOPLE_OBJECTS)

    if food_hits >= 2:
        return "what appears to be a kitchen or dining area"
    if outdoor_hits >= 2:
        return "an outdoor environment"
    if "bed" in labels or "pillow" in labels:
        return "a bedroom"
    if "sofa" in labels or "tv" in labels:
        return "a living room"
    if indoor_hits >= 2:
        return "an indoor space"
    if people_hits and outdoor_hits:
        return "a public outdoor area"
    return "your surroundings"


def build_scene_description(detections: list, image_width: int, image_height: int) -> str:
    """
    Build a spoken scene description from YOLO detections.
    Returns a natural language string suitable for TTS.
    """
    if not detections:
        return "The scene appears clear. No objects were detected in the frame."

    all_labels = {d["label"] for d in detections}
    env = _guess_environment(all_labels)

    # Group by zone
    zones: dict[str, list] = {"left": [], "center": [], "right": []}
    for d in detections:
        if d["confidence"] < 0.35:
            continue
        z = _zone(d["bbox"], image_width)
        dist = _estimate_distance(d["bbox"], image_height)
        zones[z].append((d["label"], dist, d["confidence"]))

    parts = []

    # Environment preamble
    parts.append(f"You appear to be in {env}.")

    # People first (safety-critical)
    people = [(z, item) for z, items in zones.items() for item in items if item[0] == "person"]
    if people:
        count = len(people)
        locs  = list({z for z, _ in people})
        loc_str = " and ".join(locs)
        parts.append(
            f"{'A person is' if count == 1 else f'{count} people are'} detected {loc_str}."
        )

    # Zone-by-zone breakdown
    zone_labels = {
        "left":   "On your left",
        "center": "Directly ahead",
        "right":  "On your right",
    }
    for zone_key, label in zone_labels.items():
        items = [i for i in zones[zone_key] if i[0] != "person"]
        if not items:
            continue
        # De-duplicate, take highest-confidence per label
        seen: dict[str, tuple] = {}
        for lbl, dist, conf in items:
            if lbl not in seen or conf > seen[lbl][1]:
                seen[lbl] = (dist, conf)
        desc_parts = []
        for lbl, (dist, _) in seen.items():
            desc_parts.append(f"a {lbl} {dist}")
        parts.append(f"{label}: {', '.join(desc_parts)}.")

    # Danger summary
    dangers = [d["label"] for d in detections if d["label"] in DANGER_LABELS and d["confidence"] >= HIGH_CONFIDENCE]
    if dangers:
        unique_d = list(dict.fromkeys(dangers))
        parts.append(f"⚠ Caution: {', '.join(unique_d)} detected — proceed carefully.")

    # Object count summary
    total = len(detections)
    parts.append(f"Total of {total} object{'s' if total != 1 else ''} identified in the frame.")

    return " ".join(parts)


def run_scene(image: Image.Image, confidence_threshold: float = 0.35) -> dict:
    """
    Full pipeline: detect + describe.
    Returns: description, detections, environment_type, fps, processingMs
    """
    t0 = time.perf_counter()

    det_result = run_detection(image, confidence_threshold=confidence_threshold)
    detections  = det_result["detections"]
    fps         = det_result["fps"]
    image_width  = det_result["image_width"]
    image_height = image.height

    description = build_scene_description(detections, image_width, image_height)
    all_labels   = {d["label"] for d in detections}
    env_type     = _guess_environment(all_labels)

    elapsed_ms = round((time.perf_counter() - t0) * 1000)

    return {
        "description": description,
        "detections":  detections,
        "environment": env_type,
        "objectCount": len(detections),
        "fps":         fps,
        "processingMs": elapsed_ms,
    }
