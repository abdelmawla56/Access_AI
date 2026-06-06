import sys
import os
from PIL import Image

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scene_service import run_scene
from test_ai import create_test_image

def main():
    print("Testing Scene Understanding...")
    # Generate test sample image
    image = create_test_image()
    res = run_scene(image)
    print("\nResult Description:")
    print(res["description"])
    print("\nDetections:")
    print(res["detections"])
    print("\nEnvironment:")
    print(res["environment"])
    print("\nFPS:", res["fps"])
    print("Processing Ms:", res["processingMs"])
    
if __name__ == "__main__":
    main()
