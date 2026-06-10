"""
OCR Service — Tesseract via pytesseract
Refactored into OCRService class with:
  - Arabic + English support (configurable via OCR_LANGUAGES env var)
  - Advanced image preprocessing (denoising + adaptive thresholding)
  - Class-based design for easy pre-loading at startup
"""

import os
import io
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import cv2


class OCRService:
    """
    Encapsulates Tesseract OCR with pre-loaded config and preprocessing.
    Initialize once at startup, call read() for each request.
    """

    def __init__(self):
        # Allow overriding Tesseract binary path via env (Docker / Linux)
        tesseract_cmd = os.getenv("TESSERACT_CMD", "")
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        else:
            # Windows default path fallback
            win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            if os.path.exists(win_path):
                pytesseract.pytesseract.tesseract_cmd = win_path

        self.default_lang = os.getenv("OCR_LANGUAGES", "eng+ara")
        print(f"[OCRService] Initialized. Default lang: {self.default_lang}")

    def preprocess(self, image: Image.Image) -> Image.Image:
        """
        Production OCR preprocessing pipeline (committee-reviewed):
          1. Convert to grayscale via OpenCV
          2. CLAHE (Contrast Limited Adaptive Histogram Equalization) for
             low-contrast / uneven lighting — significantly improves live-demo accuracy
          3. Bilateral filter to reduce noise while preserving edges
          4. Fast non-local means denoising for residual sensor noise
          5. Adaptive Gaussian thresholding for binarization under varying lighting
        Falls back to simple PIL-based sharpening if OpenCV fails.
        """
        try:
            img_array = np.array(image.convert("RGB"))
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

            # CLAHE: improves contrast on low-light or washed-out captures
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)

            # Bilateral filter: smooths noise while keeping text edges sharp
            filtered = cv2.bilateralFilter(enhanced, 9, 75, 75)

            denoised = cv2.fastNlMeansDenoising(filtered, h=10)
            thresh = cv2.adaptiveThreshold(
                denoised, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11, 2
            )
            return Image.fromarray(thresh)
        except Exception:
            # Graceful fallback: simple PIL pipeline
            gray = image.convert("L")
            sharpened = gray.filter(ImageFilter.SHARPEN)
            return ImageEnhance.Contrast(sharpened).enhance(2.0)

    def read(self, image_bytes: bytes, lang: str = None) -> dict:
        """
        Run Tesseract OCR on raw image bytes.
        
        Args:
            image_bytes: Raw image data (JPEG / PNG / WebP)
            lang: Tesseract language string, e.g. "eng", "ara", "eng+ara"
        
        Returns:
            {text, confidence, language, word_count, words}
        """
        effective_lang = lang or self.default_lang

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        processed = self.preprocess(image)

        # Full text extraction
        raw_text: str = pytesseract.image_to_string(
            processed, lang=effective_lang
        ).strip()

        # Detailed word-level data for confidence scores
        data = pytesseract.image_to_data(
            processed,
            lang=effective_lang,
            output_type=pytesseract.Output.DICT,
        )

        words = []
        confidences = []
        n = len(data["text"])
        for i in range(n):
            word = data["text"][i].strip()
            conf = int(data["conf"][i])
            if word and conf > 0:
                words.append({
                    "word": word,
                    "confidence": conf,
                    "bbox": {
                        "x": data["left"][i],
                        "y": data["top"][i],
                        "w": data["width"][i],
                        "h": data["height"][i],
                    },
                })
                confidences.append(conf)

        avg_confidence = float(np.mean(confidences)) if confidences else 0.0

        return {
            "text": raw_text,
            "confidence": round(avg_confidence, 1),
            "language": effective_lang,
            "word_count": len(raw_text.split()) if raw_text else 0,
            "words": words,
        }


# ─── Backward-compatible module-level function ────────────────────────────────
_default_service: OCRService = None


def _get_service() -> OCRService:
    global _default_service
    if _default_service is None:
        _default_service = OCRService()
    return _default_service


def run_ocr(image: Image.Image) -> dict:
    """Legacy function for backward compatibility with scene_service.py"""
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return _get_service().read(buf.getvalue())
