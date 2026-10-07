#!/usr/bin/env python3
"""
Deepfake Shield — Python Media Forensics & Perceptual Hashing Tool
Computes exact cryptographic SHA-256 fingerprints and perceptual hashes (pHash, dHash, aHash)
to analyze media provenance, byte integrity, and perceptual visual similarity.
"""

import sys
import os
import json
import hashlib
import argparse
from typing import Dict, Any, Tuple
from PIL import Image
import numpy as np

def calculate_sha256(file_path: str) -> Dict[str, Any]:
    """Calculates deterministic SHA-256 hash matching the EVM smart contract format."""
    sha256_hash = hashlib.sha256()
    file_size = os.path.getsize(file_path)
    
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
            
    raw_hex = sha256_hash.hexdigest()
    return {
        "algorithm": "SHA-256",
        "hash": f"0x{raw_hex}",
        "raw_hash": raw_hex,
        "size_bytes": file_size
    }

def compute_dct_phash(img: Image.Image) -> str:
    """
    Standard DCT-based perceptual hash (pHash) implementation in pure NumPy.
    1. Grayscale resize to 32x32.
    2. 2D Discrete Cosine Transform (DCT-II).
    3. Extract 8x8 low-frequency matrix.
    4. Compute median and generate 64-bit hash.
    """
    img_gray = img.convert("L").resize((32, 32), Image.Resampling.BILINEAR)
    arr = np.asarray(img_gray, dtype=np.float64)
    
    N = 32
    n = np.arange(N)
    k = n.reshape(-1, 1)
    # Orthogonal DCT-II transform matrix
    D = np.cos(np.pi * (2 * n + 1) * k / (2 * N))
    D[0, :] *= 1.0 / np.sqrt(2.0)
    D *= np.sqrt(2.0 / N)
    
    dct = np.dot(np.dot(D, arr), D.T)
    # 8x8 low frequency coefficients
    low_freq = dct[:8, :8]
    # Median of AC coefficients (excluding DC component at [0,0])
    median_val = np.median(low_freq.flatten()[1:])
    bits = (low_freq > median_val).flatten()
    
    # 64-bit hex
    bit_str = "".join("1" if b else "0" for b in bits)
    return f"{int(bit_str, 2):016x}"

def compute_dhash(img: Image.Image) -> str:
    """Difference hash (dHash) tracking horizontal intensity gradients."""
    img_gray = img.convert("L").resize((9, 8), Image.Resampling.BILINEAR)
    arr = np.asarray(img_gray, dtype=np.int32)
    # Compare adjacent pixels in each row (8 comparisons x 8 rows = 64 bits)
    diff = arr[:, 1:] > arr[:, :-1]
    bit_str = "".join("1" if b else "0" for b in diff.flatten())
    return f"{int(bit_str, 2):016x}"

def compute_ahash(img: Image.Image) -> str:
    """Average hash (aHash) based on average intensity thresholding."""
    img_gray = img.convert("L").resize((8, 8), Image.Resampling.BILINEAR)
    arr = np.asarray(img_gray, dtype=np.float64)
    avg = np.mean(arr)
    bits = (arr > avg).flatten()
    bit_str = "".join("1" if b else "0" for b in bits)
    return f"{int(bit_str, 2):016x}"

def hamming_distance(hex1: str, hex2: str) -> int:
    """Calculates bitwise Hamming distance between two 64-bit hex hashes."""
    v1 = int(hex1, 16)
    v2 = int(hex2, 16)
    return bin(v1 ^ v2).count("1")

def calculate_perceptual_hashes(file_path: str) -> Dict[str, Any]:
    """Calculates multi-algorithm perceptual fingerprints for visual media."""
    try:
        with Image.open(file_path) as img:
            phash = compute_dct_phash(img)
            dhash = compute_dhash(img)
            ahash = compute_ahash(img)
            
            return {
                "supported": True,
                "phash": phash,
                "dhash": dhash,
                "ahash": ahash,
                "dimensions": {
                    "width": img.width,
                    "height": img.height
                },
                "format": img.format
            }
    except Exception as e:
        return {
            "supported": False,
            "error": str(e),
            "note": "Perceptual hashing requires valid visual image media format (JPEG, PNG, WebP, etc.)."
        }

def analyze_single_file(file_path: str) -> Dict[str, Any]:
    """Complete forensic inspection of a single media file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    sha_info = calculate_sha256(file_path)
    perceptual_info = calculate_perceptual_hashes(file_path)
    
    return {
        "file_name": os.path.basename(file_path),
        "file_path": os.path.abspath(file_path),
        "cryptographic_integrity": sha_info,
        "perceptual_fingerprints": perceptual_info
    }

def compare_media(file1: str, file2: str) -> Dict[str, Any]:
    """Compares two media files for byte-level integrity and perceptual similarity."""
    analysis1 = analyze_single_file(file1)
    analysis2 = analyze_single_file(file2)
    
    sha_match = analysis1["cryptographic_integrity"]["hash"].lower() == analysis2["cryptographic_integrity"]["hash"].lower()
    
    perc1 = analysis1["perceptual_fingerprints"]
    perc2 = analysis2["perceptual_fingerprints"]
    
    comparison: Dict[str, Any] = {
        "file1": analysis1["file_name"],
        "file2": analysis2["file_name"],
        "sha256_match": sha_match,
        "hash1": analysis1["cryptographic_integrity"]["hash"],
        "hash2": analysis2["cryptographic_integrity"]["hash"],
    }
    
    if perc1.get("supported") and perc2.get("supported"):
        distance = hamming_distance(perc1["phash"], perc2["phash"])
        # Max distance for 64-bit hash is 64
        similarity_pct = max(0.0, round((1.0 - (distance / 64.0)) * 100.0, 2))
        
        comparison["phash1"] = perc1["phash"]
        comparison["phash2"] = perc2["phash"]
        comparison["phash_distance"] = distance
        comparison["similarity_percentage"] = similarity_pct
        
        if sha_match:
            comparison["verdict"] = "AUTHENTIC_EXACT_MATCH"
            comparison["interpretation"] = "Exact byte-for-byte cryptographic match."
        elif distance == 0:
            comparison["verdict"] = "PERCEPTUALLY_IDENTICAL"
            comparison["interpretation"] = "Visually identical (e.g. metadata stripped or lossless recompression), but byte sequence differs."
        elif distance <= 10:
            comparison["verdict"] = "PERCEPTUALLY_SIMILAR"
            comparison["interpretation"] = "Minor compression artifacts or slight resizing detected. Core visual geometry preserved."
        else:
            comparison["verdict"] = "MODIFIED_OR_DIFFERENT"
            comparison["interpretation"] = f"Significant visual divergence (Hamming distance {distance}). Likely altered, manipulated, or different content."
    else:
        comparison["verdict"] = "EXACT_SHA_ONLY"
        comparison["interpretation"] = "Byte-level comparison complete. Perceptual comparison not available for non-visual format."

    return comparison

def main():
    parser = argparse.ArgumentParser(description="Deepfake Shield Media Forensics Tool")
    parser.add_argument("--file", "-f", help="Analyze a single media file")
    parser.add_argument("--compare", "-c", nargs=2, metavar=("FILE1", "FILE2"), help="Compare two media files")
    parser.add_argument("--json", "-j", action="store_true", help="Output raw JSON format")
    
    args = parser.parse_args()
    
    if not args.file and not args.compare:
        parser.print_help()
        sys.exit(1)
        
    try:
        if args.file:
            result = analyze_single_file(args.file)
        else:
            result = compare_media(args.compare[0], args.compare[1])
            
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print("\n" + "=" * 60)
            print("DEEPFAKE SHIELD — MEDIA PROVENANCE & FORENSIC ANALYSIS")
            print("=" * 60)
            for k, v in result.items():
                if isinstance(v, dict):
                    print(f"\n[{k.upper()}]")
                    for sub_k, sub_v in v.items():
                        print(f"  {sub_k}: {sub_v}")
                else:
                    print(f"{k}: {v}")
            print("=" * 60 + "\n")
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
