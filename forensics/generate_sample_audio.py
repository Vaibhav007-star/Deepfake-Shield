#!/usr/bin/env python3
"""
Generates real, playable WAV audio files for Deepfake Shield audio provenance testing.
Creates:
  1. sample_media/authentic_speech.wav  (Original sound recording)
  2. sample_media/tampered_speech.wav    (Altered frequency / deepfake voice edit)
"""

import os
import wave
import struct
import math
import hashlib

def generate_audio():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_media")
    os.makedirs(output_dir, exist_ok=True)
    
    sample_rate = 44100
    duration = 3.0
    num_samples = int(sample_rate * duration)
    
    auth_path = os.path.join(output_dir, "authentic_speech.wav")
    tamp_path = os.path.join(output_dir, "tampered_speech.wav")
    
    # 1. Generate Authentic Audio (harmonic acoustic tone)
    with wave.open(auth_path, "w") as f:
        f.setnchannels(1)       # Mono
        f.setsampwidth(2)       # 16-bit
        f.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = i / sample_rate
            # 440Hz base note + 880Hz harmonic overtone with gentle decay
            val = (
                0.5 * math.sin(2 * math.pi * 440 * t) +
                0.25 * math.sin(2 * math.pi * 880 * t)
            ) * math.exp(-t / 2.5)
            sample = int(val * 32767)
            sample = max(-32768, min(32767, sample))
            f.writeframes(struct.pack("<h", sample))
            
    # 2. Generate Tampered Audio (altered mid-stream frequency simulating audio edit / voice clone)
    with wave.open(tamp_path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = i / sample_rate
            # Alters the frequency at 1.5 seconds from 440Hz to 554Hz (C#)
            freq = 440 if t < 1.5 else 554.37
            val = (
                0.5 * math.sin(2 * math.pi * freq * t) +
                0.25 * math.sin(2 * math.pi * (freq * 2) * t)
            ) * math.exp(-t / 2.5)
            sample = int(val * 32767)
            sample = max(-32768, min(32767, sample))
            f.writeframes(struct.pack("<h", sample))
            
    # Calculate SHA-256 for both
    def get_hash(path):
        h = hashlib.sha256()
        with open(path, "rb") as fl:
            h.update(fl.read())
        return f"0x{h.hexdigest()}"
        
    hash_auth = get_hash(auth_path)
    hash_tamp = get_hash(tamp_path)
    
    print("\n" + "=" * 65)
    print("SAMPLE AUDIO FILES GENERATED SUCCESSFULLY")
    print("=" * 65)
    print(f"1. Authentic Audio File : {auth_path}")
    print(f"   Size                 : {os.path.getsize(auth_path)} bytes")
    print(f"   SHA-256 Hash         : {hash_auth}")
    print("-" * 65)
    print(f"2. Tampered Audio File  : {tamp_path}")
    print(f"   Size                 : {os.path.getsize(tamp_path)} bytes")
    print(f"   SHA-256 Hash         : {hash_tamp}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    generate_audio()
