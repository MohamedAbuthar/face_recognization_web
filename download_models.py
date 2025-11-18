#!/usr/bin/env python3
"""
Download InsightFace ONNX models for face recognition
"""

import os
import sys

try:
    from insightface.model_zoo import get_model
    print("✓ InsightFace package found")
except ImportError:
    print("✗ InsightFace not installed")
    print("\nPlease install it first:")
    print("  pip install insightface")
    sys.exit(1)

def main():
    print("\n" + "="*50)
    print("Downloading InsightFace ONNX Models")
    print("="*50 + "\n")
    
    # Download detection model
    print("1. Downloading SCRFD face detection model...")
    try:
        det_model = get_model('scrfd_2.5g_kps', download=True)
        print("   ✓ Detection model downloaded")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Download recognition model
    print("\n2. Downloading ArcFace recognition model...")
    try:
        rec_model = get_model('glintr100', download=True)
        print("   ✓ Recognition model downloaded")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Show model location
    home = os.path.expanduser("~")
    model_dir = os.path.join(home, ".insightface", "models")
    
    print("\n" + "="*50)
    print("Models downloaded to:")
    print(f"  {model_dir}")
    print("="*50)
    
    print("\nNext steps:")
    print("1. Copy models to public/models/ directory:")
    print(f"   mkdir -p public/models")
    print(f"   cp {model_dir}/buffalo_l/*.onnx public/models/")
    print("\n2. Restart your Next.js development server")
    print("   pnpm dev")

if __name__ == "__main__":
    main()


