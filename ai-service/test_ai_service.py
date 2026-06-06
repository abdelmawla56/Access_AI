import requests

def test_ocr_endpoint():
    url = "http://localhost:8000/ocr"
    files = {"file": ("test_sample.jpg", open('test_sample.jpg', 'rb'), "image/jpeg")}
    response = requests.post(url, files=files)
    assert response.status_code == 200
    print('OCR test passed')

if __name__ == "__main__":
    test_ocr_endpoint()
