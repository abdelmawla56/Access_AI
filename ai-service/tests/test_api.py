"""
Integration tests for FastAPI endpoints — uses TestClient (no server needed).
pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient


def make_image_bytes(width: int = 200, height: int = 200, fmt: str = "JPEG") -> bytes:
    img = Image.new("RGB", (width, height), color=(200, 200, 200))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture(scope="module")
def client():
    from main import app
    with TestClient(app) as c:
        yield c


# ─── /health ─────────────────────────────────────────────────────────────────

def test_health_endpoint(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_health_has_status_ok(client):
    r = client.get("/health")
    assert r.json()["status"] == "ok"


def test_health_has_models_loaded(client):
    r = client.get("/health")
    data = r.json()
    assert "models_loaded" in data
    assert data["models_loaded"] is True


def test_health_has_uptime(client):
    r = client.get("/health")
    assert "uptime_seconds" in r.json()


# ─── /ocr ─────────────────────────────────────────────────────────────────────

def test_ocr_endpoint_accepts_image(client):
    r = client.post(
        "/ocr",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
    )
    assert r.status_code == 200


def test_ocr_response_has_text(client):
    r = client.post(
        "/ocr",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
    )
    assert "text" in r.json()


def test_ocr_lang_param_accepted(client):
    r = client.post(
        "/ocr?lang=eng",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
    )
    assert r.status_code == 200
    assert r.json().get("language") == "eng"


# ─── /detect ─────────────────────────────────────────────────────────────────

def test_detect_endpoint_accepts_image(client):
    r = client.post(
        "/detect",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
    )
    assert r.status_code == 200


def test_detect_response_has_detections(client):
    r = client.post(
        "/detect",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
    )
    assert "detections" in r.json()


# ─── /search ─────────────────────────────────────────────────────────────────

def test_search_endpoint_accepts_image(client):
    r = client.post(
        "/search",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
        data={"target": "person"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "found" in data
    assert "hint" in data


# ─── 404 ─────────────────────────────────────────────────────────────────────

def test_invalid_route_returns_404(client):
    r = client.get("/nonexistent")
    assert r.status_code == 404
