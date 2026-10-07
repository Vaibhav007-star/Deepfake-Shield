#!/usr/bin/env python3
"""
Unit and integration test for Deepfake Shield Python Forensics Toolkit.
"""

import os
import sys
import tempfile
from PIL import Image, ImageDraw

# Add current directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from analyze import calculate_sha256, calculate_perceptual_hashes, compare_media

def create_rectangle_image(text: str) -> str:
    """Creates a temporary image with a centered white rectangle."""
    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    
    img = Image.new("RGB", (256, 256), color=(20, 30, 40))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill=(255, 255, 255))
    draw.text((60, 60), text, fill=(0, 0, 0))
    img.save(path, format="PNG")
    return path

def create_ellipse_image(text: str) -> str:
    """Creates a temporary image with a vertical black ellipse on bright background."""
    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    
    img = Image.new("RGB", (256, 256), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    draw.ellipse([20, 20, 100, 230], fill=(10, 10, 10))
    draw.text((30, 40), text, fill=(255, 255, 255))
    img.save(path, format="PNG")
    return path

def test_forensics():
    print("Running Python Forensics Test Suite...")
    
    # 1. Create two identical images
    img1_path = create_rectangle_image("Authentic Media")
    img2_path = create_rectangle_image("Authentic Media")
    
    # 2. Create a slightly compressed/altered version of the same image
    img_compressed_path = tempfile.mktemp(suffix=".jpg")
    with Image.open(img1_path) as im:
        im.save(img_compressed_path, format="JPEG", quality=85)
        
    # 3. Create a structurally completely different image (altered/tampered content)
    img_different_path = create_ellipse_image("Altered Deepfake")
    
    try:
        # Test SHA-256 calculation
        sha_res = calculate_sha256(img1_path)
        assert sha_res["algorithm"] == "SHA-256"
        assert sha_res["hash"].startswith("0x")
        assert len(sha_res["hash"]) == 66
        print("[PASS] SHA-256 byte calculation verified.")
        
        # Test perceptual hashes
        phash_res = calculate_perceptual_hashes(img1_path)
        assert phash_res["supported"] is True
        assert len(phash_res["phash"]) == 16
        assert len(phash_res["dhash"]) == 16
        assert len(phash_res["ahash"]) == 16
        print(f"[PASS] Multi-algorithm perceptual hashing verified (pHash={phash_res['phash']}, dHash={phash_res['dhash']}).")
        
        # Test identical comparison
        comp_identical = compare_media(img1_path, img2_path)
        assert comp_identical["sha256_match"] is True
        assert comp_identical["phash_distance"] == 0
        assert comp_identical["verdict"] == "AUTHENTIC_EXACT_MATCH"
        print("[PASS] Authentic exact match test passed.")
        
        # Test compressed comparison (different SHA, low perceptual distance)
        comp_compressed = compare_media(img1_path, img_compressed_path)
        assert comp_compressed["sha256_match"] is False
        assert comp_compressed["phash_distance"] <= 10
        print(f"[PASS] Recompression comparison passed: distance={comp_compressed['phash_distance']}, similarity={comp_compressed['similarity_percentage']}%.")
        
        # Test different comparison (high perceptual distance)
        comp_diff = compare_media(img1_path, img_different_path)
        assert comp_diff["sha256_match"] is False
        assert comp_diff["phash_distance"] > 10
        assert comp_diff["verdict"] == "MODIFIED_OR_DIFFERENT"
        print(f"[PASS] Tampered/divergent comparison passed: distance={comp_diff['phash_distance']}, verdict={comp_diff['verdict']}.")
        
        print("\nAll Python Forensics tests passed successfully!")
    finally:
        for p in [img1_path, img2_path, img_compressed_path, img_different_path]:
            if os.path.exists(p):
                os.remove(p)

if __name__ == "__main__":
    test_forensics()
