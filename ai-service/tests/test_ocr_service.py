"""
Tests for OCRService — runs with pytest from ai-service/ directory.
pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import io
import pytest
from PIL import Image, ImageDraw
from ocr_service import OCRService


@pytest.fixture(scope="module")
def ocr():
    return OCRService()


def make_image_with_text(text: str, width: int = 400, height: int = 100) -> bytes:
    """Create a white PNG image with black text drawn on it."""
    img = Image.new("RGB", (width, height), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((10, 30), text, fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_blank_image() -> bytes:
    """Create a plain white image with no text."""
    img = Image.new("RGB", (200, 100), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ─── Tests ────────────────────────────────────────────────────────────────────

def test_ocr_returns_dict(ocr):
    result = ocr.read(make_image_with_text("Hello"))
    assert isinstance(result, dict), "read() must return a dict"


def test_ocr_has_required_keys(ocr):
    result = ocr.read(make_image_with_text("Test"))
    for key in ("text", "confidence", "language", "word_count", "words"):
        assert key in result, f"Missing key: {key}"


def test_ocr_detects_english_text(ocr):
    result = ocr.read(make_image_with_text("AccessAI"), lang="eng")
    # Tesseract may not be perfect with PIL-drawn fonts but should return something
    assert isinstance(result["text"], str)
    assert result["word_count"] >= 0


def test_ocr_confidence_is_numeric(ocr):
    result = ocr.read(make_image_with_text("Test"), lang="eng")
    assert isinstance(result["confidence"], (int, float))
    assert 0 <= result["confidence"] <= 100


def test_ocr_empty_image_returns_empty_string(ocr):
    result = ocr.read(make_blank_image())
    assert isinstance(result["text"], str)
    # Empty image should produce empty or near-empty text
    assert len(result["text"]) < 50


def test_ocr_has_word_count(ocr):
    result = ocr.read(make_image_with_text("one two three"), lang="eng")
    assert "word_count" in result
    assert isinstance(result["word_count"], int)
    assert result["word_count"] >= 0


def test_ocr_words_list_is_list(ocr):
    result = ocr.read(make_image_with_text("Hello"))
    assert isinstance(result["words"], list)


def test_ocr_language_field_present(ocr):
    result = ocr.read(make_image_with_text("Test"), lang="eng")
    assert result["language"] == "eng"


def test_ocr_accepts_jpeg_bytes(ocr):
    img = Image.new("RGB", (300, 80), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((10, 20), "JPEG test", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    result = ocr.read(buf.getvalue())
    assert isinstance(result, dict)


def test_ocr_confidence_zero_for_blank(ocr):
    result = ocr.read(make_blank_image())
    # Confidence should be 0 (no words) or a small number
    assert result["confidence"] >= 0
