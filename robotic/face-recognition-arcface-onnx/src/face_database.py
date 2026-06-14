"""Face database for storing and matching face embeddings"""

import os
import pickle
import numpy as np
from typing import Dict, List, Optional, Tuple
from arcface_recognizer import ArcFaceRecognizer


class FaceDatabase:
    """Database for storing and matching face embeddings"""
    
    def __init__(self, db_path: str = "face_database.pkl"):
        self.db_path = db_path
        self.identities: Dict[str, List[np.ndarray]] = {}
        self.load()
    
    def enroll(self, name: str, embedding: np.ndarray):
        """Enroll a face embedding under a given identity"""
        if name not in self.identities:
            self.identities[name] = []
        self.identities[name].append(embedding)
        self.save()
    
    def identify(self, embedding: np.ndarray, threshold: float = 0.5) -> Tuple[Optional[str], float]:
        """
        Identify a face by comparing against enrolled identities
        
        Args:
            embedding: Query face embedding
            threshold: Minimum similarity threshold for positive match
            
        Returns:
            Tuple of (identity_name, similarity_score) or (None, 0.0) if no match
        """
        best_match = None
        best_similarity = 0.0
        
        for name, embeddings in self.identities.items():
            for enrolled_emb in embeddings:
                similarity = ArcFaceRecognizer.compute_similarity(embedding, enrolled_emb)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = name
        
        if best_similarity >= threshold:
            return best_match, best_similarity
        return None, 0.0
    
    def save(self):
        """Save database to disk"""
        with open(self.db_path, 'wb') as f:
            pickle.dump(self.identities, f)
    
    def load(self):
        """Load database from disk"""
        if os.path.exists(self.db_path):
            with open(self.db_path, 'rb') as f:
                self.identities = pickle.load(f)
    
    def list_identities(self) -> List[str]:
        """List all enrolled identities"""
        return list(self.identities.keys())
