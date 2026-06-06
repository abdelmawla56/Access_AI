"""
Tests for DetectionService — runs with pytest from ai-service/ directory.
pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import io
import pytest
from PIL import Image
from detection_service import DetectionService


@pytest.fixture(scope="module")
def detector():
    return DetectionService()


def make_blank_image(width: int = 640, height: int = 640, color=(128, 128, 128)) -> bytes:
    """Create a plain gray JPEG image — unlikely to have detections."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ─── Tests ────────────────────────────────────────────────────────────────────

def test_detect_returns_dict(detector):
    result = detector.analyze(make_blank_image())
    assert isinstance(result, dict), "analyze() must return a dict"


def test_detect_has_detections_key(detector):
    result = detector.analyze(make_blank_image())
    assert "detections" in result


def test_detect_detections_is_list(detector):
    result = detector.analyze(make_blank_image())
    assert isinstance(result["detections"], list)


def test_detect_has_metadata_fields(detector):
    result = detector.analyze(make_blank_image())
    assert "count" in result
    assert "fps" in result
    assert "inference_ms" in result
    assert "image_width" in result


def test_detect_count_matches_detections_length(detector):
    result = detector.analyze(make_blank_image())
    assert result["count"] == len(result["detections"])


def test_detect_image_width_is_640(detector):
    """After preprocessing, image_width should always be 640."""
    result = detector.analyze(make_blank_image(width=1280, height=720))
    assert result["image_width"] == 640


def test_detect_each_detection_has_required_fields(detector):
    result = detector.analyze(make_blank_image())
    for det in result["detections"]:
        assert "label" in det
        assert "confidence" in det
        assert "bbox" in det


def test_detect_confidence_range(detector):
    result = detector.analyze(make_blank_image())
    for det in result["detections"]:
        assert 0.0 <= det["confidence"] <= 1.0


def test_detect_bbox_has_four_values(detector):
    result = detector.analyze(make_blank_image())
    for det in result["detections"]:
        assert len(det["bbox"]) == 4


def test_detect_handles_small_image(detector):
    """Small images should be resized and not crash."""
    result = detector.analyze(make_blank_image(width=64, height=64))
    assert "detections" in result


def test_detect_inference_ms_is_positive(detector):
    result = detector.analyze(make_blank_image())
    assert isinstance(result["inference_ms"], int)
    assert result["inference_ms"] >= 0


def test_detect_fps_is_numeric(detector):
    result = detector.analyze(make_blank_image())
    assert isinstance(result["fps"], (int, float))
    assert result["fps"] >= 0
