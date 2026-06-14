"""Face data model"""

import numpy as np
from dataclasses import dataclass
from typing import Optional


@dataclass
class Face:
    """Container for face detection and recognition data"""
    bbox: np.ndarray  # [x1, y1, x2, y2]
    landmarks: np.ndarray  # 5 keypoints
    aligned_face: np.ndarray  # Aligned face image
    embedding: Optional[np.ndarray] = None  # Face embedding vector
    confidence: float = 0.0
