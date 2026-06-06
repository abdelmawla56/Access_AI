import requests
import pytest

def test_ai_service_health():
    try:
        resp = requests.get('http://localhost:8000/health', timeout=1.0)
    except requests.exceptions.RequestException:
        pytest.skip("AI service is offline on port 8000")

    assert resp.status_code == 200
    data = resp.json()
    if "status" in data:
        assert data.get("status") == "ok"
    else:
        assert data.get('ok') is True

