"""
Threshold Evaluation Script
Analyzes genuine vs impostor distance distributions to suggest optimal threshold

Task 4 Requirement: Evaluate threshold values and determine optimal setting
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Tuple
import cv2
from pipeline import FaceRecognitionPipeline
from arcface_recognizer import ArcFaceRecognizer


def evaluate_thresholds(enrollment_dir: str = "data/enrollment", db_path: str = "face_database.pkl") -> Tuple[float, float, float]:
    """
    Evaluate genuine and impostor distributions
    
    Genuine: Same person (multiple samples)
    Impostor: Different persons
    
    Args:
        enrollment_dir: Directory containing enrollment images (organized as name/image.jpg or name.jpg)
        db_path: Path to face database
        
    Returns:
        Tuple of (suggested_threshold, genuine_distances_mean, impostor_distances_mean)
    """
    print("=" * 70)
    print("THRESHOLD EVALUATION - Genuine vs Impostor Distance Analysis")
    print("=" * 70)
    print()
    
    # Initialize pipeline
    pipeline = FaceRecognitionPipeline(
        arcface_model_path="models/arcface_r100_v1.onnx",
        db_path=db_path
    )
    
    # Load all embeddings from enrollment folder
    all_embeddings = {}  # {name: [embeddings]}
    
    print("Loading enrollment images...")
    for filename in os.listdir(enrollment_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            identity = os.path.splitext(filename)[0]
            img_path = os.path.join(enrollment_dir, filename)
            img = cv2.imread(img_path)
            
            if img is not None:
                faces = pipeline.process_image(img)
                if len(faces) > 0:
                    if identity not in all_embeddings:
                        all_embeddings[identity] = []
                    all_embeddings[identity].append(faces[0].embedding)
    
    print(f"✓ Loaded {sum(len(e) for e in all_embeddings.values())} embeddings from {len(all_embeddings)} identities")
    print()
    
    # Calculate genuine distances (same identity, different samples)
    genuine_distances = []
    print("Computing genuine distances (same identity)...")
    
    for name, embeddings in all_embeddings.items():
        if len(embeddings) > 1:
            # Compare all pairs of the same identity
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    similarity = ArcFaceRecognizer.compute_similarity(embeddings[i], embeddings[j])
                    genuine_distances.append(similarity)
    
    print(f"✓ Computed {len(genuine_distances)} genuine pair comparisons")
    
    # Calculate impostor distances (different identities)
    impostor_distances = []
    print("Computing impostor distances (different identities)...")
    
    identities = list(all_embeddings.keys())
    sample_size = min(100, len(identities) * 10)  # Limit for efficiency
    
    count = 0
    for i, name1 in enumerate(identities):
        for name2 in identities[i + 1:]:
            if count >= sample_size:
                break
            
            emb1 = all_embeddings[name1][0]  # Use first embedding
            emb2 = all_embeddings[name2][0]  # Use first embedding
            
            similarity = ArcFaceRecognizer.compute_similarity(emb1, emb2)
            impostor_distances.append(similarity)
            count += 1
        
        if count >= sample_size:
            break
    
    print(f"✓ Computed {len(impostor_distances)} impostor pair comparisons (sampled)")
    print()
    
    # Check if we have enough data
    if len(genuine_distances) == 0 or len(impostor_distances) == 0:
        print("=" * 70)
        print("⚠ NOT ENOUGH DATA FOR EVALUATION")
        print("=" * 70)
        print()
        print(f"Genuine comparisons: {len(genuine_distances)} (need 2+)")
        print(f"Impostor comparisons: {len(impostor_distances)} (need 2+)")
        print()
        print("To evaluate thresholds, you need:")
        print("  • At least 2-3 identities with 2+ images each")
        print()
        print("Please enroll more identities first using option 1 or 2")
        return 0.5, 0.0, 0.0
    
    # Calculate statistics
    genuine_mean = np.mean(genuine_distances)
    genuine_std = np.std(genuine_distances)
    genuine_min = np.min(genuine_distances)
    genuine_max = np.max(genuine_distances)
    
    impostor_mean = np.mean(impostor_distances)
    impostor_std = np.std(impostor_distances)
    impostor_min = np.min(impostor_distances)
    impostor_max = np.max(impostor_distances)
    
    print("=" * 70)
    print("DISTANCE STATISTICS")
    print("=" * 70)
    print()
    print("GENUINE Distances (same person, different samples):")
    print(f"  Mean:    {genuine_mean:.4f}")
    print(f"  Std Dev: {genuine_std:.4f}")
    print(f"  Min:     {genuine_min:.4f}")
    print(f"  Max:     {genuine_max:.4f}")
    print()
    print("IMPOSTOR Distances (different persons):")
    print(f"  Mean:    {impostor_mean:.4f}")
    print(f"  Std Dev: {impostor_std:.4f}")
    print(f"  Min:     {impostor_min:.4f}")
    print(f"  Max:     {impostor_max:.4f}")
    print()
    
    # Suggest threshold
    # A good threshold is typically between genuine_min and impostor_max
    # Conservative: use a value closer to genuine_min to avoid false negatives
    # Aggressive: use a value closer to impostor_max to avoid false positives
    
    suggested_threshold = genuine_min - genuine_std  # Conservative approach
    suggested_threshold = max(0.0, min(1.0, suggested_threshold))  # Clamp to [0, 1]
    
    # Alternative: midpoint between distributions
    midpoint_threshold = (genuine_max + impostor_min) / 2.0
    
    print("=" * 70)
    print("THRESHOLD RECOMMENDATIONS")
    print("=" * 70)
    print()
    print(f"Conservative (fewer false negatives): {suggested_threshold:.4f}")
    print(f"Balanced (midpoint):                  {midpoint_threshold:.4f}")
    print(f"Aggressive (fewer false positives):   {impostor_max:.4f}")
    print()
    print("⚠ Use the values that best balance your needs:")
    print("  - For security: Use higher threshold (fewer false positives)")
    print("  - For convenience: Use lower threshold (fewer false negatives)")
    print()
    
    # Create visualization only if we have data
    if len(genuine_distances) > 0 and len(impostor_distances) > 0:
        print("Generating visualization...")
        plot_distributions(genuine_distances, impostor_distances, suggested_threshold)
    
    return suggested_threshold, genuine_mean, impostor_mean


def plot_distributions(genuine: List[float], impostor: List[float], threshold: float):
    """Create histogram of genuine vs impostor distributions"""
    
    # Handle empty data
    if len(genuine) == 0 or len(impostor) == 0:
        print("  ⚠ Cannot generate plot - insufficient data")
        return
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot histograms
    ax.hist(genuine, bins=30, alpha=0.6, label=f'Genuine (μ={np.mean(genuine):.3f})', color='green', edgecolor='black')
    ax.hist(impostor, bins=30, alpha=0.6, label=f'Impostor (μ={np.mean(impostor):.3f})', color='red', edgecolor='black')
    
    # Plot suggested threshold
    ax.axvline(threshold, color='blue', linestyle='--', linewidth=2, label=f'Suggested Threshold = {threshold:.4f}')
    
    ax.set_xlabel('Cosine Similarity Score', fontsize=12)
    ax.set_ylabel('Frequency', fontsize=12)
    ax.set_title('Genuine vs Impostor Distance Distributions', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)
    ax.grid(alpha=0.3)
    
    output_path = "output/threshold_evaluation.png"
    os.makedirs("output", exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"✓ Visualization saved to: {output_path}")
    plt.close()


if __name__ == "__main__":
    """Task 4: Run threshold evaluation"""
    try:
        threshold, genuine_mean, impostor_mean = evaluate_thresholds(
            enrollment_dir="data/enrollment",
            db_path="face_database.pkl"
        )
        
        print()
        print("=" * 70)
        print(f"RECOMMENDED THRESHOLD: {threshold:.4f}")
        print("=" * 70)
        print()
        print("Next steps:")
        print("1. Use this threshold in live_recognition.py or pipeline.py")
        print("2. Test with test images to verify recognition accuracy")
        print("3. Adjust if needed based on false positive/negative rates")
        print()
        
    except Exception as e:
        print(f"✗ Error during evaluation: {e}")
        import traceback
        traceback.print_exc()
