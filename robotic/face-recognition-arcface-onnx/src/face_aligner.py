"""Face alignment module using 5-point landmarks"""

import cv2
import numpy as np
from typing import Tuple


class FaceAligner:
    """5-point face alignment using similarity transformation"""
    
    # Standard 5-point landmarks for 112x112 face (ArcFace input)
    REFERENCE_LANDMARKS = np.array([
        [38.2946, 51.6963],  # left eye
        [73.5318, 51.5014],  # right eye
        [56.0252, 71.7366],  # nose
        [41.5493, 92.3655],  # left mouth
        [70.7299, 92.2041]   # right mouth
    ], dtype=np.float32)
    
    def __init__(self, output_size: Tuple[int, int] = (112, 112)):
        self.output_size = output_size
    
    def align(self, image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        """
        Align face using 5-point landmarks via similarity transformation
        
        Args:
            image: Input image
            landmarks: 5x2 array of facial landmarks
            
        Returns:
            Aligned face image of size output_size
        """
        # Estimate similarity transformation matrix
        tform = self._estimate_transform(landmarks, self.REFERENCE_LANDMARKS)
        
        # Apply transformation
        aligned = cv2.warpAffine(
            image, 
            tform, 
            self.output_size,
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=0
        )
        
        return aligned
    
    @staticmethod
    def _estimate_transform(src: np.ndarray, dst: np.ndarray) -> np.ndarray:
        """
        Estimate similarity transformation (rotation, scale, translation)
        
        Args:
            src: Source landmarks (Nx2)
            dst: Destination landmarks (Nx2)
            
        Returns:
            2x3 transformation matrix
        """
        # Use Umeyama algorithm for similarity transform
        num = src.shape[0]
        
        # Compute means
        src_mean = src.mean(axis=0)
        dst_mean = dst.mean(axis=0)
        
        # Center the points
        src_centered = src - src_mean
        dst_centered = dst - dst_mean
        
        # Compute scale
        src_std = np.sqrt((src_centered ** 2).sum() / num)
        dst_std = np.sqrt((dst_centered ** 2).sum() / num)
        scale = dst_std / src_std
        
        # Compute rotation
        U, S, Vt = np.linalg.svd(dst_centered.T @ src_centered)
        R = U @ Vt
        
        # Build transformation matrix
        M = np.zeros((2, 3), dtype=np.float32)
        M[:2, :2] = scale * R
        M[:, 2] = dst_mean - scale * R @ src_mean
        
        return M
