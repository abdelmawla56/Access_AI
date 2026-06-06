# tests/test_backend_integration.py
import requests

BACKEND_URL = "http://localhost:5000"

def test_health():
    print("Testing backend health endpoint...")
    resp = requests.get(f"{BACKEND_URL}/health")
    assert resp.status_code == 200
    assert resp.json().get("ok") is True
    print("[PASS] Health check passed!")

def test_initial_status():
    print("\nTesting GET /api/status...")
    resp = requests.get(f"{BACKEND_URL}/api/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "activeFeature" in data
    assert "isProcessing" in data
    assert "debugMode" in data
    assert "healthData" in data
    assert "heartRate" in data["healthData"]
    assert "temperature" in data["healthData"]
    print(f"[PASS] Initial status successfully fetched with health vitals: {data['healthData']}")

def test_set_feature():
    print("\nTesting POST /api/status/feature...")
    # Set to OCR
    resp = requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "ocr"})
    assert resp.status_code == 200
    assert resp.json().get("activeFeature") == "ocr"

    # Verify status changed
    resp = requests.get(f"{BACKEND_URL}/api/status")
    assert resp.json().get("activeFeature") == "ocr"
    print("[PASS] State transition to 'ocr' verified!")

def test_set_feature_invalid():
    print("\nTesting invalid feature validation...")
    resp = requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "invalid_val"})
    assert resp.status_code == 400
    assert "Invalid feature" in resp.json().get("error")
    print("[PASS] Invalid feature input correctly rejected!")

def test_debug_mode():
    print("\nTesting debug mode toggle...")
    # Toggle debug ON
    resp = requests.post(f"{BACKEND_URL}/api/status/debug", json={"debug": True})
    assert resp.status_code == 200
    assert resp.json().get("debugMode") is True

    # Verify status
    resp = requests.get(f"{BACKEND_URL}/api/status")
    assert resp.json().get("debugMode") is True

    # Toggle debug OFF
    resp = requests.post(f"{BACKEND_URL}/api/status/debug", json={"debug": False})
    assert resp.status_code == 200
    assert resp.json().get("debugMode") is False
    print("[PASS] Debug mode toggle state machine verified!")

def test_feature_isolation():
    print("\nTesting Requirement 7: Feature Isolation (strict execution rule)...")
    # Set feature to OCR
    requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "ocr"})

    # Try to hit Object Detection endpoint while OCR is active
    files = {'frame': ('frame.jpg', b'dummy_data', 'image/jpeg')}
    resp = requests.post(f"{BACKEND_URL}/api/detection/analyze", files=files)
    
    # It must return 409 Conflict
    assert resp.status_code == 409
    assert "Detection feature is not active" in resp.json().get("error")
    print("[PASS] Feature isolation rule working flawlessly (Detection blocked when OCR is active)!")

    # Reset back to none
    requests.post(f"{BACKEND_URL}/api/status/feature", json={"feature": "none"})

def test_feedback_rating():
    print("\nTesting POST /api/feedback/rate (Rating submission)...")
    # Test valid rating
    resp = requests.post(f"{BACKEND_URL}/api/feedback/rate", json={
        "rating": 5,
        "comment": "Amazing voice-first design!",
        "userEmail": "tester@zewailcity.edu.eg"
    })
    assert resp.status_code == 200
    assert resp.json().get("ok") is True

    # Test invalid rating out of range
    resp = requests.post(f"{BACKEND_URL}/api/feedback/rate", json={
        "rating": 6,
        "comment": "Too high",
    })
    assert resp.status_code == 400
    print("[PASS] System rating and mailer mock tests completed successfully!")

if __name__ == "__main__":
    print("==================================================")
    print("STARTING BACKEND INTEGRATION TEST SUITE")
    print("==================================================")
    try:
        test_health()
        test_initial_status()
        test_set_feature()
        test_set_feature_invalid()
        test_debug_mode()
        test_feature_isolation()
        test_feedback_rating()
        print("\n==================================================")
        print("SUCCESS: ALL INTEGRATION TEST CASES PASSED!")
        print("==================================================")
    except AssertionError as e:
        print(f"\n[FAIL] TEST FAILED: Assertion Error")
        raise e
    except Exception as e:
        print(f"\n[FAIL] TEST FAILED: Connection or Server Error")
        print(f"Please ensure the backend is running at {BACKEND_URL}")
        print(f"Error details: {e}")
