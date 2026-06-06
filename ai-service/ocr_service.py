"""
OCR Service — Tesseract via pytesseract
Returns extracted text + per-word confidence scores.
"""

import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

# ── If Tesseract is not on PATH, set the executable path here ──────────────────
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Enhance image for better OCR accuracy:
    - Convert to grayscale
    - Sharpen edges
    - Increase contrast
    """
    gray = image.convert("L")
    sharpened = gray.filter(ImageFilter.SHARPEN)
    enhanced = ImageEnhance.Contrast(sharpened).enhance(2.0)
    return enhanced


def run_ocr(image: Image.Image) -> dict:
    """
    Run Tesseract OCR on a PIL image.
    Returns:
        text        — full extracted text
        confidence  — average word confidence (0-100)
        words       — list of {word, confidence, bbox}
    """
    processed = preprocess_image(image)

    # Full text extraction
    raw_text: str = pytesseract.image_to_string(processed, lang="eng").strip()

    # Detailed word-level data (for confidence scores)
    data = pytesseract.image_to_data(
        processed,
        lang="eng",
        output_type=pytesseract.Output.DICT,
    )

    words = []
    confidences = []
    n = len(data["text"])
    for i in range(n):
        word = data["text"][i].strip()
        conf = int(data["conf"][i])
        if word and conf > 0:
            words.append(
                {
                    "word": word,
                    "confidence": conf,
                    "bbox": {
                        "x": data["left"][i],
                        "y": data["top"][i],
                        "w": data["width"][i],
                        "h": data["height"][i],
                    },
                }
            )
            confidences.append(conf)

    avg_confidence = float(np.mean(confidences)) if confidences else 0.0

    return {
        "text": raw_text,
        "confidence": round(avg_confidence, 1),
        "words": words,
    }
