import requests
import pytest

def test_ocr_endpoint():
    url = "http://localhost:8000/ocr"
    try:
        # Check if service is up before calling endpoint
        requests.get("http://localhost:8000/health", timeout=1.0)
    except requests.exceptions.RequestException:
        pytest.skip("AI service is offline on port 8000")

    files = {"file": ("test_sample.jpg", open('test_sample.jpg', 'rb'), "image/jpeg")}
    response = requests.post(url, files=files)
    assert response.status_code == 200
    print('OCR test passed')

if __name__ == "__main__":
    test_ocr_endpoint()
