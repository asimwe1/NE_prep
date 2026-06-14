"""
Live Face Recognition with Camera
Task 2 Requirement: Verify live recognition works from camera input

Uses webcam (or video file) for real-time face recognition
"""

import cv2
import os
from pipeline import FaceRecognitionPipeline


def run_live_recognition(threshold: float = 0.5, use_camera: bool = True, video_file: str = None):
    """
    Run live face recognition from camera or video file
    
    Args:
        threshold: Recognition threshold (use result from evaluate_threshold.py)
        use_camera: If True, use webcam; if False, use video_file
        video_file: Path to video file (if use_camera=False)
    
    Controls:
        - Press 's' to save current frame with detections
        - Press 'q' to quit
    """
    
    print("=" * 70)
    print("LIVE FACE RECOGNITION")
    print("=" * 70)
    print()
    print(f"Threshold: {threshold:.4f}")
    print("Controls:")
    print("  's' - Save frame with detections")
    print("  'q' - Quit")
    print()
    
    # Initialize pipeline
    print("Initializing pipeline...")
    pipeline = FaceRecognitionPipeline(
        arcface_model_path="models/arcface_r100_v1.onnx",
        db_path="face_database.pkl"
    )
    
    # Open video source
    if use_camera:
        print("Opening webcam (camera 0)...")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("✗ Error: Cannot open webcam")
            return
    else:
        if not video_file or not os.path.exists(video_file):
            print(f"✗ Error: Video file not found: {video_file}")
            return
        print(f"Opening video: {video_file}")
        cap = cv2.VideoCapture(video_file)
    
    print("✓ Camera/video ready. Starting recognition...\n")
    
    frame_count = 0
    recognized_count = 0
    unknown_count = 0
    
    os.makedirs("output", exist_ok=True)
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("\n✗ End of video or camera error")
                break
            
            frame_count += 1
            
            # Resize for faster processing (optional)
            display_frame = frame.copy()
            frame = cv2.resize(frame, (640, 480))
            
            # Run recognition
            results = pipeline.recognize_faces(frame, threshold=threshold)
            
            # Draw results
            output_frame = pipeline.visualize_results(frame, results)
            
            # Count results for statistics
            for face, name, similarity in results:
                if name != "Unknown":
                    recognized_count += 1
                else:
                    unknown_count += 1
            
            # Display statistics
            stats_text = f"Frame: {frame_count} | Recognized: {recognized_count} | Unknown: {unknown_count}"
            cv2.putText(output_frame, stats_text, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Display frame
            cv2.imshow("Live Face Recognition", output_frame)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("\nExiting...")
                break
            elif key == ord('s'):
                output_path = f"output/frame_{frame_count:04d}.jpg"
                cv2.imwrite(output_path, output_frame)
                print(f"✓ Saved frame to: {output_path}")
    
    except KeyboardInterrupt:
        print("\n✗ Interrupted by user")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
        print()
        print("=" * 70)
        print("RECOGNITION SUMMARY")
        print("=" * 70)
        print(f"Total frames processed: {frame_count}")
        print(f"Recognized faces: {recognized_count}")
        print(f"Unknown faces: {unknown_count}")
        if frame_count > 0:
            recognition_rate = (recognized_count / (recognized_count + unknown_count) * 100) if (recognized_count + unknown_count) > 0 else 0
            print(f"Recognition rate: {recognition_rate:.1f}%")
        print()


if __name__ == "__main__":
    """
    Usage:
    
    1. From camera (webcam):
       python live_recognition.py
    
    2. From video file:
       python live_recognition.py --video path/to/video.mp4
    
    3. With custom threshold:
       python live_recognition.py --threshold 0.6
    """
    
    import argparse
    
    parser = argparse.ArgumentParser(description="Live face recognition from camera or video")
    parser.add_argument("--threshold", type=float, default=0.5, 
                       help="Recognition threshold (default: 0.5)")
    parser.add_argument("--video", type=str, default=None,
                       help="Path to video file (uses camera if not specified)")
    
    args = parser.parse_args()
    
    use_camera = args.video is None
    run_live_recognition(threshold=args.threshold, use_camera=use_camera, video_file=args.video)
