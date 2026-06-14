"""Face detection module using dlib or OpenCV"""

import os
import cv2
import numpy as np
import urllib.request
from typing import List
from face_model import Face


class FaceDetector:
    """Dlib-based face detector for detection and 5-point landmarks"""
    
    def __init__(self):
        self.detector = None
        self.predictor = None
        self._init_detector()
    
    def _init_detector(self):
        """Initialize face detector with dlib or fallback to MediaPipe"""
        try:
            import dlib
            
            # Try to load dlib models
            predictor_path = "shape_predictor_5_face_landmarks.dat"
            
            if not os.path.exists(predictor_path):
                print(f"Downloading dlib 5-point landmark predictor...")
                url = "http://dlib.net/files/shape_predictor_5_face_landmarks.dat.bz2"
                self._download_and_extract(url, predictor_path)
            
            self.detector = dlib.get_frontal_face_detector()
            self.predictor = dlib.shape_predictor(predictor_path)
            self.use_dlib = True
            print("✓ Using dlib for face detection and landmarks")
            
        except (ImportError, Exception) as e:
            print(f"Note: dlib not available ({e})")
            print("✓ Using MediaPipe for face detection")
            self._init_mediapipe_detector()
    
    def _download_and_extract(self, url: str, output_path: str):
        """Download and extract bz2 file"""
        import bz2
        
        bz2_path = output_path + ".bz2"
        urllib.request.urlretrieve(url, bz2_path)
        
        with bz2.BZ2File(bz2_path, 'rb') as f_in:
            with open(output_path, 'wb') as f_out:
                f_out.write(f_in.read())
        
        os.remove(bz2_path)
        print(f"✓ Downloaded {output_path}")
    
    def _init_mediapipe_detector(self):
        """Initialize OpenCV Cascade Classifier for face detection"""
        # Use built-in OpenCV cascade classifiers
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.cascade = cv2.CascadeClassifier(cascade_path)
        
        self.use_dlib = False
        print("✓ OpenCV Cascade Classifier initialized")
    
    def detect(self, image: np.ndarray) -> List[Face]:
        """
        Detect faces and extract 5-point landmarks
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            List of Face objects with bbox and landmarks
        """
        if self.use_dlib:
            return self._detect_dlib(image)
        else:
            return self._detect_mediapipe(image)
    
    def _detect_dlib(self, image: np.ndarray) -> List[Face]:
        """Detect using dlib"""
        import dlib
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = []
        
        detections = self.detector(gray, 1)
        
        for det in detections:
            # Get bounding box
            x1, y1, x2, y2 = det.left(), det.top(), det.right(), det.bottom()
            bbox = np.array([x1, y1, x2, y2], dtype=np.float32)
            
            # Get 5-point landmarks
            shape = self.predictor(gray, det)
            landmarks = np.array([
                [shape.part(i).x, shape.part(i).y] for i in range(5)
            ], dtype=np.float32)
            
            face = Face(
                bbox=bbox,
                landmarks=landmarks,
                aligned_face=None,
                confidence=1.0
            )
            faces.append(face)
        
        return faces
    
    def _detect_mediapipe(self, image: np.ndarray) -> List[Face]:
        """Detect using OpenCV Cascade Classifier"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        detections = self.cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        faces = []
        
        for (x, y, w, h) in detections:
            bbox = np.array([x, y, x + w, y + h], dtype=np.float32)
            
            # Estimate landmarks from bbox
            landmarks = self._estimate_landmarks_from_bbox(bbox)
            
            face = Face(
                bbox=bbox,
                landmarks=landmarks,
                aligned_face=None,
                confidence=0.8  # Cascade classifier doesn't provide confidence
            )
            faces.append(face)
        
        return faces
    
    @staticmethod
    def _extract_mediapipe_landmarks(keypoints, w: int, h: int) -> np.ndarray:
        """Extract 5-point landmarks from MediaPipe landmarks"""
        landmarks = []
        # Take first 5 landmarks from MediaPipe's 6 keypoints
        for kp in keypoints[:5]:
            landmarks.append([kp.x * w, kp.y * h])
        
        return np.array(landmarks, dtype=np.float32)
    
    @staticmethod
    def _estimate_landmarks_from_bbox(bbox: np.ndarray) -> np.ndarray:
        """
        Estimate approximate 5-point landmarks from bounding box
        This is a fallback when landmark detector is not available
        """
        x1, y1, x2, y2 = bbox
        w = x2 - x1
        h = y2 - y1
        
        # Approximate landmark positions based on typical face proportions
        landmarks = np.array([
            [x1 + w * 0.3, y1 + h * 0.4],  # left eye
            [x1 + w * 0.7, y1 + h * 0.4],  # right eye
            [x1 + w * 0.5, y1 + h * 0.6],  # nose
            [x1 + w * 0.35, y1 + h * 0.8], # left mouth
            [x1 + w * 0.65, y1 + h * 0.8]  # right mouth
        ], dtype=np.float32)
        
        return landmarks
