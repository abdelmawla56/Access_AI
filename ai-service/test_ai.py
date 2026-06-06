import os
import sys
from PIL import Image, ImageDraw, ImageFont
import io

# Add current directory to path so we can import our services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_service import run_ocr
from detection_service import run_detection

def create_test_image():
    """Create a synthetic test image with text and shapes."""
    print("Creating test image...")
    # Create a 640x480 image
    img = Image.new('RGB', (640, 480), color=(73, 109, 137))
    d = ImageDraw.Draw(img)
    
    # Draw some text for OCR
    try:
        # Try to use a default font
        d.text((100, 100), "HELLO WORLD", fill=(255, 255, 0))
        d.text((100, 200), "ACCESS AI TEST", fill=(255, 255, 255))
    except:
        d.text((100, 100), "TEXT TEST", fill=(255, 255, 0))

    # Draw a rectangle
    d.rectangle([300, 300, 500, 450], outline="red", width=5)
    
    img.save("test_sample.jpg")
    return img

def main():
    print("Starting AI Service Test\n" + "="*30)
    
    # 1. Prepare Image
    image = create_test_image()
    
    # 2. Test OCR
    print("\nTesting OCR (Tesseract)...")
    try:
        ocr_result = run_ocr(image)
        print(f"OCR Success!")
        print(f"   Detected Text: '{ocr_result.get('text', '').strip()}'")
        print(f"   Confidence: {ocr_result.get('confidence')}%")
    except Exception as e:
        print(f"OCR Failed: {e}")
        print("   (Note: Ensure Tesseract-OCR is installed on your Windows machine)")

    # 3. Test Object Detection
    print("\nTesting Object Detection (YOLOv8)...")
    try:
        det_result = run_detection(image)
        print(f"Detection Success!")
        print(f"   Objects Found: {det_result.get('count')}")
        for det in det_result.get('detections', []):
            print(f"   - {det['label']} ({round(det['confidence']*100)}%) at {det['bbox']}")
        print(f"   Processing FPS: {det_result.get('fps')}")
    except Exception as e:
        print(f"Detection Failed: {e}")

    print("\n" + "="*30 + "\nTest Complete!")

if __name__ == "__main__":
    main()
