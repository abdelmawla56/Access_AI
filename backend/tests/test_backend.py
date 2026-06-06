# tests/test_backend.py
import requests

def test_health():
    resp = requests.get('http://localhost:5000/health')
    assert resp.status_code == 200
    assert resp.json().get('ok')

if __name__ == '__main__':
    test_health()
