# tests/test_new_features.py
import requests
import os

BACKEND_URL = "http://localhost:5000"
IMAGE_PATH = "../ai-service/test_sample.jpg"

def test_assistant():
    print("Testing AI Assistant chat proxy...")
    resp = requests.post(f"{BACKEND_URL}/api/assistant/chat", json={
        "message": "Hello, how are you?",
        "context": "Active mode is none."
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "configured" in data
    print(f"[PASS] Assistant chat replied: '{data['reply']}'")

def test_scene_describe():
    print("\nTesting Scene Description proxy...")
    # Set feature to scene first
    requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "scene"})

    assert os.path.exists(IMAGE_PATH), f"Test image not found at {IMAGE_PATH}"
    with open(IMAGE_PATH, 'rb') as f:
        files = {'frame': ('frame.jpg', f, 'image/jpeg')}
        resp = requests.post(f"{BACKEND_URL}/api/scene/describe", files=files)
    
    assert resp.status_code == 200
    data = resp.json()
    assert "description" in data
    assert "detections" in data
    assert "environment" in data
    print(f"[PASS] Scene description: '{data['description']}'")

def test_search_scan():
    print("\nTesting Smart Object Search scan...")
    # Set feature to search first
    requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "search"})

    with open(IMAGE_PATH, 'rb') as f:
        files = {'frame': ('frame.jpg', f, 'image/jpeg')}
        data = {'target': 'cup'}
        resp = requests.post(f"{BACKEND_URL}/api/search/scan", files=files, data=data)

    assert resp.status_code == 200
    res = resp.json()
    assert "found" in res
    assert "target" in res
    assert "hint" in res
    print(f"[PASS] Object search scan completed. Found: {res['found']}, Hint: '{res['hint']}'")

def test_enhanced_navigation():
    print("\nTesting Enhanced Navigation guides...")
    # Set feature to navigation
    requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "navigation"})

    with open(IMAGE_PATH, 'rb') as f:
        files = {'frame': ('frame.jpg', f, 'image/jpeg')}
        resp = requests.post(f"{BACKEND_URL}/api/navigation/guide", files=files)

    assert resp.status_code == 200
    res = resp.json()
    assert "hint" in res
    assert "obstacles" in res
    print(f"[PASS] Navigation hint: '{res['hint']}'")
    print(f"       Obstacles count: {len(res['obstacles'])}")

if __name__ == "__main__":
    print("==================================================")
    print("STARTING TEST SUITE FOR NEW PIPELINE FEATURES")
    print("==================================================")
    
    # Switch feature to none initially
    requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "none"})
    
    try:
        test_assistant()
        test_scene_describe()
        test_search_scan()
        test_enhanced_navigation()
        print("\n==================================================")
        print("SUCCESS: ALL NEW FEATURES INTEGRATION TESTED AND PASSED!")
        print("==================================================")
    except AssertionError as e:
        print("\n[FAIL] TEST FAILED: Assertion Error")
        raise e
    except Exception as e:
        print(f"\n[FAIL] TEST FAILED: Connection or Server Error: {e}")
