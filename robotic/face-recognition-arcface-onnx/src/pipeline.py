"""Complete face recognition pipeline"""

import os
import cv2
import numpy as np
from typing import List, Tuple
from face_model import Face
from face_detector import FaceDetector
from face_aligner import FaceAligner
from arcface_recognizer import ArcFaceRecognizer
from face_database import FaceDatabase


class FaceRecognitionPipeline:
    """Complete face recognition pipeline"""
    
    def __init__(self, arcface_model_path: str, db_path: str = "face_database.pkl"):
        """
        Initialize the complete pipeline
        
        Args:
            arcface_model_path: Path to ArcFace ONNX model
            db_path: Path to face database file
        """
        print("Initializing face recognition pipeline...")
        self.detector = FaceDetector()
        self.aligner = FaceAligner()
        self.recognizer = ArcFaceRecognizer(arcface_model_path)
        self.database = FaceDatabase(db_path)
        print("✓ Pipeline ready\n")
    
    def process_image(self, image: np.ndarray) -> List[Face]:
        """
        Process an image through the complete pipeline
        
        Args:
            image: Input BGR image
            
        Returns:
            List of Face objects with embeddings
        """
        # Step 1: Detect faces and landmarks
        faces = self.detector.detect(image)
        
        # Step 2 & 3: Align faces and extract embeddings
        for face in faces:
            face.aligned_face = self.aligner.align(image, face.landmarks)
            face.embedding = self.recognizer.extract_embedding(face.aligned_face)
        
        return faces
    
    def enroll_identity(self, image: np.ndarray, name: str) -> bool:
        """
        Enroll a new identity from an image
        
        Args:
            image: Input image containing a single face
            name: Identity name
            
        Returns:
            True if successful, False otherwise
        """
        faces = self.process_image(image)
        
        if len(faces) == 0:
            print(f"  ✗ No face detected in image for {name}")
            return False
        elif len(faces) > 1:
            print(f"  ⚠ Multiple faces detected for {name}, using the first one")
        
        self.database.enroll(name, faces[0].embedding)
        print(f"  ✓ Successfully enrolled {name}")
        return True
    
    def recognize_faces(self, image: np.ndarray, threshold: float = 0.5) -> List[Tuple[Face, str, float]]:
        """
        Recognize all faces in an image
        
        Args:
            image: Input BGR image
            threshold: Recognition threshold
            
        Returns:
            List of (Face, identity_name, similarity_score) tuples
        """
        faces = self.process_image(image)
        results = []
        
        for face in faces:
            name, similarity = self.database.identify(face.embedding, threshold)
            if name is None:
                name = "Unknown"
            results.append((face, name, similarity))
        
        return results
    
    def visualize_results(self, image: np.ndarray, results: List[Tuple[Face, str, float]]) -> np.ndarray:
        """Draw bounding boxes and labels on image"""
        output = image.copy()
        
        for face, name, similarity in results:
            x1, y1, x2, y2 = face.bbox.astype(int)
            
            # Draw bounding box
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{name}: {similarity:.2f}" if name != "Unknown" else name
            cv2.putText(output, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # Draw landmarks
            for lm in face.landmarks:
                cv2.circle(output, tuple(lm.astype(int)), 2, (255, 0, 0), -1)
        
        return output


def main():
    """Example usage of the face recognition pipeline"""
    
    print("=" * 60)
    print("Face Recognition System with ArcFace ONNX")
    print("=" * 60)
    print()
    
    # Initialize pipeline
    try:
        pipeline = FaceRecognitionPipeline(
            arcface_model_path="models/arcface_r100_v1.onnx",
            db_path="face_database.pkl"
        )
    except Exception as e:
        print(f"✗ Error initializing pipeline: {e}")
        return
    
    # Example 1: Enroll identities
    print("=" * 60)
    print("Enrolling Identities")
    print("=" * 60)
    enrollment_dir = "data/enrollment"
    
    if os.path.exists(enrollment_dir):
        enrolled_count = 0
        for filename in os.listdir(enrollment_dir):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                identity = os.path.splitext(filename)[0]
                img_path = os.path.join(enrollment_dir, filename)
                img = cv2.imread(img_path)
                
                if img is not None:
                    if pipeline.enroll_identity(img, identity):
                        enrolled_count += 1
        
        if enrolled_count == 0:
            print("  No faces enrolled. Add images to data/enrollment/")
    else:
        print(f"  Creating directory structure...")
        os.makedirs(enrollment_dir, exist_ok=True)
        os.makedirs("data/test", exist_ok=True)
        os.makedirs("output", exist_ok=True)
        print(f"  ✓ Created: {enrollment_dir}")
        print(f"  Add images to data/enrollment/ and run again")
    
    print()
    
    # Example 2: Recognize faces in a test image
    print("=" * 60)
    print("Recognizing Faces")
    print("=" * 60)
    test_image_path = "data/test/group_photo.jpg"
    
    if os.path.exists(test_image_path):
        test_image = cv2.imread(test_image_path)
        
        if test_image is not None:
            results = pipeline.recognize_faces(test_image, threshold=0.5)
            
            # Visualize results
            output = pipeline.visualize_results(test_image, results)
            output_path = "output/recognition_result.jpg"
            cv2.imwrite(output_path, output)
            print(f"  ✓ Results saved to: {output_path}")
            
            # Print results
            if results:
                for face, name, similarity in results:
                    if name != "Unknown":
                        print(f"    • {name}: {similarity:.3f}")
                    else:
                        print(f"    • {name}")
            else:
                print("    No faces detected in test image")
    else:
        print(f"  No test image found at: {test_image_path}")
        print(f"  Place test images in data/test/ directory")
    
    print()
    
    # Example 3: List all enrolled identities
    print("=" * 60)
    print("Enrolled Identities")
    print("=" * 60)
    identities = pipeline.database.list_identities()
    if identities:
        for identity in identities:
            count = len(pipeline.database.identities[identity])
            print(f"  • {identity} ({count} embedding(s))")
    else:
        print("  No identities enrolled yet")
    
    print()
    print("=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
