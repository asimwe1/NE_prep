"""
Face Recognition System with ArcFace ONNX and 5-Point Alignment
Author: Asimwe Landry
Repository: face-recognition-arcface-onnx

Complete pipeline for face detection, alignment, and recognition using:
- MTCNN for face detection and 5-point landmark detection
- Similarity transformation for face alignment
- ArcFace (ONNX) for face embedding extraction
- Cosine similarity for face matching

Interactive menu system to choose operations:
1. Enroll identities
2. Evaluate threshold
3. Run live recognition
4. Check enrollment requirements
5. Recognize faces in static image
6. List enrolled identities
"""

import os
import sys
import cv2
from pathlib import Path

# Re-export all classes for backward compatibility
from face_model import Face
from face_detector import FaceDetector
from face_aligner import FaceAligner
from arcface_recognizer import ArcFaceRecognizer
from face_database import FaceDatabase
from pipeline import FaceRecognitionPipeline

__all__ = [
    'Face',
    'FaceDetector',
    'FaceAligner',
    'ArcFaceRecognizer',
    'FaceDatabase',
    'FaceRecognitionPipeline',
]


def print_banner():
    """Print application banner"""
    print("\n" + "=" * 70)
    print("  FACE RECOGNITION SYSTEM - ArcFace ONNX with 5-Point Alignment")
    print("=" * 70 + "\n")


def print_menu():
    """Print main menu"""
    print("=" * 70)
    print("MAIN MENU - Choose an operation:")
    print("=" * 70)
    print("  1. Enroll Identities from Images")
    print("     → Load images from data/enrollment/ and create embeddings")
    print()
    print("  2. Enroll from Webcam")
    print("     → Capture faces live with webcam (Task 3)")
    print()
    print("  3. Evaluate Threshold")
    print("     → Analyze genuine vs impostor distances (Task 4)")
    print("     → Generate recommendations and visualization")
    print()
    print("  4. Run Live Recognition")
    print("     → Real-time face recognition from camera (Task 2)")
    print("     → Or process video file")
    print()
    print("  5. Check Enrollment")
    print("     → Verify 10+ identities with L2-normalization (Task 3)")
    print("     → List all enrolled identities")
    print()
    print("  6. Recognize from Image")
    print("     → Test recognition on static image file")
    print("     → Visualize results with bounding boxes")
    print()
    print("  7. List Enrolled Identities")
    print("     → Display all enrolled people and sample counts")
    print()
    print("  0. Exit")
    print("=" * 70)


def enroll_identities():
    """Task 3: Enroll identities from directory"""
    print("\n" + "=" * 70)
    print("ENROLLMENT - Load identities from data/enrollment/")
    print("=" * 70 + "\n")
    
    enrollment_dir = "data/enrollment"
    
    if not os.path.exists(enrollment_dir):
        print(f"✗ Directory not found: {enrollment_dir}")
        print(f"  Create it with: mkdir -p {enrollment_dir}")
        return
    
    # Initialize pipeline
    print("Initializing pipeline...")
    try:
        pipeline = FaceRecognitionPipeline(
            arcface_model_path="models/arcface_r100_v1.onnx",
            db_path="face_database.pkl"
        )
    except Exception as e:
        print(f"✗ Error initializing pipeline: {e}")
        return
    
    # Collect images
    image_files = []
    for filename in sorted(os.listdir(enrollment_dir)):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(enrollment_dir, filename)
            image_files.append((filename, img_path))
    
    if len(image_files) == 0:
        print(f"✗ No images found in {enrollment_dir}")
        print("  Add images named like: alice_001.jpg, bob_001.jpg, etc.")
        return
    
    print(f"Found {len(image_files)} images\n")
    
    # Process each image
    identities_count = {}
    for filename, img_path in image_files:
        # Extract identity name
        name = os.path.splitext(filename)[0]
        if name[-3:].isdigit() and name[-4] == '_':
            identity = name[:-4]
        else:
            identity = name
        
        print(f"Processing: {filename:40s} → {identity}")
        
        img = cv2.imread(img_path)
        if img is None:
            print(f"  ✗ Cannot read image")
            continue
        
        if pipeline.enroll_identity(img, identity):
            identities_count[identity] = identities_count.get(identity, 0) + 1
        else:
            print(f"  ✗ Face not detected")
    
    print("\n" + "=" * 70)
    print("ENROLLMENT SUMMARY")
    print("=" * 70)
    identities = pipeline.database.list_identities()
    print(f"Total identities: {len(identities)}\n")
    for identity in sorted(identities):
        count = len(pipeline.database.identities[identity])
        print(f"  • {identity:20s} : {count} embedding(s)")
    
    if len(identities) >= 10:
        print(f"\n✓ Requirement met: {len(identities)} identities (need 10+)")
    else:
        print(f"\n⚠ Need more identities: {len(identities)} (need 10+)")


def enroll_from_webcam():
    """Enroll identities using webcam capture"""
    print("\n" + "=" * 70)
    print("WEBCAM ENROLLMENT - Capture faces live (Task 3)")
    print("=" * 70 + "\n")
    
    print("Initialize pipeline...")
    try:
        pipeline = FaceRecognitionPipeline(
            arcface_model_path="models/arcface_r100_v1.onnx",
            db_path="face_database.pkl"
        )
    except Exception as e:
        print(f"✗ Error initializing pipeline: {e}")
        return
    
    print("Opening webcam...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("✗ Cannot open webcam")
        return
    
    print("✓ Webcam ready\n")
    
    identities_enrolled = {}
    
    print("WEBCAM ENROLLMENT INSTRUCTIONS:")
    print("-" * 70)
    print("1. Enter identity name when prompted")
    print("2. Press 'c' to capture (or 's' for multiple samples)")
    print("3. Press 'q' to quit and save")
    print("4. Press 'n' to move to next identity")
    print("-" * 70 + "\n")
    
    try:
        current_identity = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Resize for display
            frame_display = cv2.resize(frame, (640, 480))
            
            # Detect faces
            faces = pipeline.process_image(frame)
            
            # Draw faces
            output = pipeline.visualize_results(frame_display, [(f, "READY", 0) for f in faces])
            
            # Add instruction text
            if current_identity:
                cv2.putText(output, f"Identity: {current_identity}", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                cv2.putText(output, "Press 'c' to capture | 'n' for next | 'q' to quit", (10, 470),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            else:
                cv2.putText(output, "Press 'Enter' to set identity name", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)
            
            cv2.imshow("Webcam Enrollment", output)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                break
            
            elif key == ord('c') and current_identity and len(faces) > 0:
                # Capture current face
                face = faces[0]
                pipeline.database.enroll(current_identity, face.embedding)
                
                if current_identity not in identities_enrolled:
                    identities_enrolled[current_identity] = 0
                identities_enrolled[current_identity] += 1
                
                print(f"✓ Captured sample {identities_enrolled[current_identity]} for {current_identity}")
            
            elif key == ord('n'):
                if current_identity:
                    print(f"\n→ Moving to next identity\n")
                current_identity = None
            
            elif key == ord('\r'):  # Enter key
                if not current_identity:
                    cv2.destroyWindow("Webcam Enrollment")
                    name = input("Enter identity name (or 'q' to quit): ").strip()
                    if name.lower() == 'q':
                        break
                    current_identity = name
                    print(f"Set identity: {current_identity}")
                    print("Position face in frame and press 'c' to capture\n")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
    
    print("\n" + "=" * 70)
    print("ENROLLMENT SUMMARY")
    print("=" * 70)
    
    identities = pipeline.database.list_identities()
    print(f"Total identities: {len(identities)}\n")
    
    for identity in sorted(identities):
        count = len(pipeline.database.identities[identity])
        print(f"  • {identity:20s} : {count} embedding(s)")
    
    if len(identities) >= 10:
        print(f"\n✓ Requirement met: {len(identities)} identities (need 10+)")
    else:
        print(f"\n⚠ Need more identities: {len(identities)} (need 10+)")


def evaluate_threshold():
    """Task 4: Run threshold evaluation"""
    print("\n" + "=" * 70)
    print("THRESHOLD EVALUATION - Genuine vs Impostor Analysis (Task 4)")
    print("=" * 70 + "\n")
    
    try:
        from evaluate_threshold import evaluate_thresholds
        threshold, genuine_mean, impostor_mean = evaluate_thresholds(
            enrollment_dir="data/enrollment",
            db_path="face_database.pkl"
        )
        
        print("\n" + "=" * 70)
        print("EVALUATION COMPLETE")
        print("=" * 70)
        print(f"\nRecommended threshold: {threshold:.4f}")
        print(f"Use this value in live_recognition or static image recognition\n")
        print("Review the plot at: output/threshold_evaluation.png")
        
    except Exception as e:
        print(f"✗ Error during evaluation: {e}")
        import traceback
        traceback.print_exc()


def run_live_recognition():
    """Task 2: Run live camera recognition"""
    print("\n" + "=" * 70)
    print("LIVE RECOGNITION - Real-time Face Detection (Task 2)")
    print("=" * 70 + "\n")
    
    # Get threshold with validation
    while True:
        threshold_str = input("Enter recognition threshold (0.0-1.0, default 0.5): ").strip()
        try:
            threshold = float(threshold_str) if threshold_str else 0.5
            if 0.0 <= threshold <= 1.0:
                break
            else:
                print("  ✗ Threshold must be between 0.0 and 1.0")
        except ValueError:
            print("  ✗ Invalid number. Please enter a decimal between 0.0 and 1.0")
    
    print(f"Using threshold: {threshold}\n")
    
    # Choose source
    print("Recognize from:")
    print("  1. Webcam (camera 0)")
    print("  2. Video file")
    choice = input("Choose (1 or 2): ").strip()
    
    try:
        from live_recognition import run_live_recognition as run_live
        
        if choice == "2":
            video_file = input("Enter video file path: ").strip()
            run_live(threshold=threshold, use_camera=False, video_file=video_file)
        else:
            run_live(threshold=threshold, use_camera=True)
            
    except Exception as e:
        print(f"✗ Error during live recognition: {e}")
        import traceback
        traceback.print_exc()


def check_enrollment():
    """Task 3: Check enrollment requirements"""
    print("\n" + "=" * 70)
    print("ENROLLMENT CHECK - Verify Requirements (Task 3)")
    print("=" * 70 + "\n")
    
    try:
        from check_enrollment import check_enrollment_requirements
        success = check_enrollment_requirements()
        
    except Exception as e:
        print(f"✗ Error during check: {e}")
        import traceback
        traceback.print_exc()


def recognize_static_image():
    """Recognize faces in static image"""
    print("\n" + "=" * 70)
    print("STATIC IMAGE RECOGNITION")
    print("=" * 70 + "\n")
    
    image_path = input("Enter image file path: ").strip()
    
    if not os.path.exists(image_path):
        print(f"✗ File not found: {image_path}")
        return
    
    threshold_str = input("Enter recognition threshold (default 0.5): ").strip()
    try:
        threshold = float(threshold_str) if threshold_str else 0.5
    except ValueError:
        threshold = 0.5
    
    print(f"\nUsing threshold: {threshold}\n")
    
    try:
        print("Initializing pipeline...")
        pipeline = FaceRecognitionPipeline(
            arcface_model_path="models/arcface_r100_v1.onnx",
            db_path="face_database.pkl"
        )
        
        print("Loading image...")
        img = cv2.imread(image_path)
        if img is None:
            print(f"✗ Cannot read image: {image_path}")
            return
        
        print("Running recognition...")
        results = pipeline.recognize_faces(img, threshold=threshold)
        
        # Visualize
        output = pipeline.visualize_results(img, results)
        
        os.makedirs("output", exist_ok=True)
        output_path = "output/recognition_result.jpg"
        cv2.imwrite(output_path, output)
        print(f"✓ Results saved to: {output_path}\n")
        
        # Print results
        print("=" * 70)
        print("RECOGNITION RESULTS")
        print("=" * 70)
        if results:
            for face, name, similarity in results:
                if name != "Unknown":
                    print(f"✓ {name:20s} : {similarity:.4f}")
                else:
                    print(f"? Unknown face")
        else:
            print("No faces detected")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()


def list_identities():
    """List all enrolled identities"""
    print("\n" + "=" * 70)
    print("ENROLLED IDENTITIES")
    print("=" * 70 + "\n")
    
    try:
        if not os.path.exists("face_database.pkl"):
            print("✗ No database found - enroll identities first")
            return
        
        pipeline = FaceRecognitionPipeline(
            arcface_model_path="models/arcface_r100_v1.onnx",
            db_path="face_database.pkl"
        )
        
        identities = pipeline.database.list_identities()
        
        if len(identities) == 0:
            print("No identities enrolled yet\n")
            return
        
        print(f"Total identities: {len(identities)}\n")
        
        total_embeddings = 0
        for name in sorted(identities):
            count = len(pipeline.database.identities[name])
            total_embeddings += count
            print(f"  • {name:20s} : {count} embedding(s)")
        
        print(f"\nTotal embeddings: {total_embeddings}")
        print(f"Average per identity: {total_embeddings / len(identities):.1f}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main interactive menu"""
    print_banner()
    
    # Verify model
    if not os.path.exists("models/arcface_r100_v1.onnx"):
        print("⚠ ArcFace model not found!")
        print("  Download it with:")
        print("  wget -O models/arcface_r100_v1.onnx \\")
        print("    https://github.com/onnx/models/raw/main/validated/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx")
        print()
    
    # Create directories
    os.makedirs("data/enrollment", exist_ok=True)
    os.makedirs("data/test", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    
    while True:
        print_menu()
        choice = input("Enter choice (0-7): ").strip()
        
        if choice == "1":
            enroll_identities()
        elif choice == "2":
            enroll_from_webcam()
        elif choice == "3":
            evaluate_threshold()
        elif choice == "4":
            run_live_recognition()
        elif choice == "5":
            check_enrollment()
        elif choice == "6":
            recognize_static_image()
        elif choice == "7":
            list_identities()
        elif choice == "0":
            print("\n✓ Goodbye!\n")
            break
        else:
            print("\n✗ Invalid choice. Try again.\n")
        
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()