import requests

def test_ai_service_health():
    resp = requests.get('http://localhost:8000/health')
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('ok') is True
    assert 'ts' in data

if __name__ == '__main__':
    test_ai_service_health()
    print('AI service health test passed')
