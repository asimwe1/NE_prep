#!/usr/bin/env python3
"""
Enrollment Helper Script
Task 3: Enroll at least 10 identities with proper validation

This script helps with the enrollment workflow and validates that all
requirements are met.
"""

import os
import cv2
from pipeline import FaceRecognitionPipeline
from pathlib import Path


def check_enrollment_requirements():
    """Verify enrollment meets assignment requirements"""
    
    print("=" * 70)
    print("ENROLLMENT REQUIREMENTS CHECKER")
    print("=" * 70)
    print()
    
    # Check database exists
    if not os.path.exists("face_database.pkl"):
        print("✗ No face_database.pkl found - no enrollments yet")
        return False
    
    # Initialize pipeline
    try:
        pipeline = FaceRecognitionPipeline(
            arcface_model_path="models/arcface_r100_v1.onnx",
            db_path="face_database.pkl"
        )
    except Exception as e:
        print(f"✗ Error initializing pipeline: {e}")
        return False
    
    # Check identity count
    identities = pipeline.database.list_identities()
    print(f"Enrolled identities: {len(identities)}")
    print()
    
    if len(identities) < 10:
        print(f"✗ REQUIREMENT NOT MET: Need 10+ identities, have {len(identities)}")
        return False
    else:
        print(f"✓ REQUIREMENT MET: Have {len(identities)} identities (need 10+)")
    
    print()
    print("Enrollment Details:")
    print("-" * 70)
    
    # Check samples per identity
    total_samples = 0
    min_samples = float('inf')
    max_samples = 0
    
    for name in sorted(identities):
        embeddings = pipeline.database.identities[name]
        count = len(embeddings)
        total_samples += count
        min_samples = min(min_samples, count)
        max_samples = max(max_samples, count)
        
        status = "✓" if count >= 2 else "⚠"
        print(f"{status} {name:20s} : {count} sample(s)")
    
    print("-" * 70)
    print()
    
    # Check minimum samples per identity
    if min_samples < 2:
        print(f"⚠ Some identities have < 2 samples")
        print(f"  Recommended: 2+ samples per identity for robust matching")
    else:
        print(f"✓ All identities have 2+ samples (min: {min_samples}, max: {max_samples})")
    
    print()
    print("Summary:")
    print(f"  Total identities: {len(identities)}")
    print(f"  Total embeddings: {total_samples}")
    print(f"  Samples/identity: {min_samples}-{max_samples}")
    print()
    
    # Verify L2-normalization
    print("Verifying L2-normalization...")
    all_normalized = True
    
    for name in identities:
        embeddings = pipeline.database.identities[name]
        for emb in embeddings:
            norm = (emb ** 2).sum() ** 0.5
            if abs(norm - 1.0) > 1e-5:
                print(f"  ✗ {name}: embedding not L2-normalized (norm={norm})")
                all_normalized = False
    
    if all_normalized:
        print("✓ All embeddings are L2-normalized")
    else:
        print("✗ Some embeddings are not L2-normalized")
        return False
    
    print()
    print("=" * 70)
    print("✓ ALL ENROLLMENT REQUIREMENTS MET")
    print("=" * 70)
    return True


def enroll_from_directory(enrollment_dir: str = "data/enrollment", db_path: str = "face_database.pkl"):
    """Enroll all identities from enrollment directory"""
    
    print("=" * 70)
    print("BATCH ENROLLMENT")
    print("=" * 70)
    print()
    
    if not os.path.exists(enrollment_dir):
        print(f"✗ Enrollment directory not found: {enrollment_dir}")
        return False
    
    # Initialize pipeline
    print("Initializing pipeline...")
    pipeline = FaceRecognitionPipeline(
        arcface_model_path="models/arcface_r100_v1.onnx",
        db_path=db_path
    )
    print()
    
    # Collect all enrollment images
    print(f"Scanning {enrollment_dir}...")
    image_files = []
    
    for filename in sorted(os.listdir(enrollment_dir)):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(enrollment_dir, filename)
            image_files.append((filename, img_path))
    
    if len(image_files) == 0:
        print(f"✗ No images found in {enrollment_dir}")
        return False
    
    print(f"✓ Found {len(image_files)} images")
    print()
    
    # Extract identities (filename without extension)
    print("Enrolling identities...")
    identities_enrolled = {}
    
    for filename, img_path in image_files:
        # Extract identity name from filename
        # Supports formats: "identity.jpg", "identity_001.jpg", etc.
        name = os.path.splitext(filename)[0]
        # Remove number suffixes if present
        if name[-3:].isdigit() and name[-4] == '_':
            identity = name[:-4]
        else:
            identity = name
        
        print(f"  Processing: {filename:40s} -> {identity}")
        
        # Read and enroll image
        img = cv2.imread(img_path)
        if img is None:
            print(f"    ✗ Cannot read image")
            continue
        
        if pipeline.enroll_identity(img, identity):
            if identity not in identities_enrolled:
                identities_enrolled[identity] = 0
            identities_enrolled[identity] += 1
        else:
            print(f"    ✗ Face not detected")
    
    print()
    print("=" * 70)
    print("ENROLLMENT SUMMARY")
    print("=" * 70)
    
    identities = pipeline.database.list_identities()
    print(f"Total identities enrolled: {len(identities)}")
    print()
    
    for identity in sorted(identities):
        count = len(pipeline.database.identities[identity])
        print(f"  • {identity:20s} : {count} embedding(s)")
    
    print()
    
    # Check requirements
    if len(identities) >= 10:
        print("✓ REQUIREMENT MET: 10+ identities enrolled")
        return True
    else:
        print(f"✗ REQUIREMENT NOT MET: {len(identities)} identities (need 10+)")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Enrollment helper and requirements checker")
    parser.add_argument("--check", action="store_true", help="Check enrollment requirements")
    parser.add_argument("--enroll", action="store_true", help="Enroll from directory")
    parser.add_argument("--dir", type=str, default="data/enrollment", help="Enrollment directory")
    
    args = parser.parse_args()
    
    if args.check:
        success = check_enrollment_requirements()
        exit(0 if success else 1)
    
    elif args.enroll:
        success = enroll_from_directory(args.dir)
        exit(0 if success else 1)
    
    else:
        # Default: enroll then check
        enroll_from_directory(args.dir)
        print()
        check_enrollment_requirements()
