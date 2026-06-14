"""ArcFace face recognition using ONNX model"""

import os
import numpy as np
import onnxruntime as ort
import urllib.request


class ArcFaceRecognizer:
    """ArcFace face recognition using ONNX model"""
    
    def __init__(self, model_path: str):
        """
        Initialize ArcFace recognizer
        
        Args:
            model_path: Path to ArcFace ONNX model
        """
        if not os.path.exists(model_path):
            print(f"\nArcFace model not found at {model_path}")
            print("Downloading ArcFace model...")
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            
            url = "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx"
            try:
                urllib.request.urlretrieve(url, model_path)
                print(f"✓ Downloaded ArcFace model to {model_path}")
            except Exception as e:
                raise FileNotFoundError(
                    f"Failed to download ArcFace model: {e}\n"
                    f"Please manually download from:\n{url}\n"
                    f"And save to: {model_path}"
                )
        
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
    
    def extract_embedding(self, aligned_face: np.ndarray) -> np.ndarray:
        """
        Extract face embedding from aligned face
        
        Args:
            aligned_face: Aligned face image (112x112)
            
        Returns:
            512-dimensional embedding vector
        """
        # Preprocess: normalize to [-1, 1]
        face = aligned_face.astype(np.float32)
        face = (face - 127.5) / 127.5
        
        # Convert to CHW format and add batch dimension
        face = np.transpose(face, (2, 0, 1))
        face = np.expand_dims(face, axis=0)
        
        # Run inference
        embedding = self.session.run(
            [self.output_name],
            {self.input_name: face}
        )[0]
        
        # Normalize embedding
        embedding = embedding.flatten()
        embedding = embedding / np.linalg.norm(embedding)
        
        return embedding
    
    @staticmethod
    def compute_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings"""
        return float(np.dot(emb1, emb2))
