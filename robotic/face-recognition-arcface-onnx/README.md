# Face Recognition with ArcFace ONNX and 5-Point Alignment

A complete, production-ready face recognition system implementing:
- **Face Detection** with MTCNN
- **5-Point Landmark Detection** (eyes, nose, mouth corners)
- **Face Alignment** using similarity transformation
- **Face Embedding Extraction** with ArcFace (ONNX)
- **Identity Enrollment** and matching with cosine similarity

## 🌟 Features

- ✅ Complete end-to-end pipeline from detection to recognition
- ✅ ONNX Runtime for efficient inference
- ✅ Support for multiple identity enrollment
- ✅ Persistent face database with pickle
- ✅ Visualization of detection and recognition results
- ✅ Well-documented, modular, object-oriented code
- ✅ Easy to extend and customize

## 📋 Requirements

```txt
opencv-python>=4.8.0
numpy>=1.24.0
onnxruntime>=1.16.0
mtcnn>=0.1.1
```

Install dependencies:
```bash
pip install -r requirements.txt
```

## 🚀 Quick Start

### Step 1: Download ArcFace Model

Download the ArcFace ONNX model and place it in the `models/` directory:

```bash
mkdir -p models
# Option A: Direct download
wget -O models/arcface_r100_v1.onnx https://github.com/onnx/models/raw/main/validated/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx

# Option B: Manual download from GitHub ONNX Model Zoo
# https://github.com/onnx/models/tree/main/validated/vision/body_analysis/arcface
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Prepare Directory Structure

```bash
mkdir -p data/enrollment data/test output
```

### Step 4: Enroll Identities

Place enrollment images in `data/enrollment/` (at least 10 different identities, 2+ images each):
```
data/enrollment/
├── alice_001.jpg
├── alice_002.jpg
├── alice_003.jpg
├── bob_001.jpg
├── bob_002.jpg
├── bob_003.jpg
├── ... (at least 10 identities)
```

For batch enrollment:
```bash
python -c "
from pipeline import FaceRecognitionPipeline
import os, cv2

pipeline = FaceRecognitionPipeline('models/arcface_r100_v1.onnx')

enrollment_dir = 'data/enrollment'
for filename in sorted(os.listdir(enrollment_dir)):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        name = os.path.splitext(filename)[0]
        img_path = os.path.join(enrollment_dir, filename)
        img = cv2.imread(img_path)
        if img is not None:
            pipeline.enroll_identity(img, name)

print('\nEnrollment complete!')
identities = pipeline.database.list_identities()
print(f'Enrolled identities: {len(identities)}')
for name in sorted(identities):
    print(f'  - {name}')
"
```

### Step 5: Run Basic Recognition

```python
from pipeline import FaceRecognitionPipeline
import cv2

# Initialize pipeline
pipeline = FaceRecognitionPipeline(
    arcface_model_path="models/arcface_r100_v1.onnx",
    db_path="face_database.pkl"
)

# Recognize faces in a test image
test_img = cv2.imread("data/test/group_photo.jpg")
results = pipeline.recognize_faces(test_img, threshold=0.5)

# Visualize results
output_img = pipeline.visualize_results(test_img, results)
cv2.imwrite("output/result.jpg", output_img)

# Print results
for face, name, similarity in results:
    if name != "Unknown":
        print(f"✓ {name}: {similarity:.3f}")
    else:
        print(f"✗ Unknown face")
```

### Step 6: Evaluate and Optimize Threshold (TASK 4)

Run the threshold evaluation script to find the optimal threshold for your database:

```bash
python evaluate_threshold.py
```

This script will:
- Compute genuine distances (same person, different photos)
- Compute impostor distances (different persons)
- Generate statistics and visualizations
- Recommend an optimal threshold

Output will be saved to `output/threshold_evaluation.png`

### Step 7: Run Live Camera Recognition (TASK 2)

After threshold optimization, run live recognition:

```bash
# Use camera with default threshold (0.5)
python live_recognition.py

# Use camera with optimized threshold (from step 6)
python live_recognition.py --threshold 0.6

# Use video file instead of camera
python live_recognition.py --video data/test/recording.mp4
```

Controls:
- **'s'** - Save current frame with detections
- **'q'** - Quit

## 📖 Pipeline Overview

### 1. Face Detection
Uses **MTCNN** (Multi-task Cascaded Convolutional Networks) to:
- Detect faces in images
- Extract 5 facial landmarks: left eye, right eye, nose, left mouth corner, right mouth corner

### 2. Face Alignment
Applies **similarity transformation** (rotation, scale, translation) to:
- Normalize face pose based on landmark positions
- Align to standard 112×112 template
- Improve recognition accuracy

### 3. Embedding Extraction
Uses **ArcFace** deep learning model via ONNX to:
- Extract 512-dimensional face embeddings
- Create discriminative feature representations
- Enable robust face matching

### 4. Face Matching
Compares embeddings using **cosine similarity**:
- Threshold-based identification
- Support for 1:N matching
- Persistent identity database

## 🏗️ Architecture

```
┌─────────────────┐
│  Input Image    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Face Detection  │  (MTCNN)
│ + 5-pt Landmarks│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Face Alignment  │  (Similarity Transform)
│    112×112      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ArcFace CNN   │  (ONNX Runtime)
│  (Embedding)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cosine Similarity│
│   Matching      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Identity Name  │
│  + Confidence   │
└─────────────────┘
```

## 💻 Code Examples

### Basic Recognition

```python
import cv2
from face_recognition_pipeline import FaceRecognitionPipeline

pipeline = FaceRecognitionPipeline("models/arcface_r100_v1.onnx")

# Read image
img = cv2.imread("photo.jpg")

# Recognize faces
results = pipeline.recognize_faces(img, threshold=0.5)

for face, name, score in results:
    print(f"{name}: {score:.3f}")
```

### Batch Enrollment

```python
import os
import cv2
from face_recognition_pipeline import FaceRecognitionPipeline

pipeline = FaceRecognitionPipeline("models/arcface_r100_v1.onnx")

enrollment_dir = "data/enrollment"
for filename in os.listdir(enrollment_dir):
    if filename.endswith(('.jpg', '.png')):
        name = os.path.splitext(filename)[0]
        img_path = os.path.join(enrollment_dir, filename)
        img = cv2.imread(img_path)
        pipeline.enroll_identity(img, name)
```

### Custom Threshold

```python
# Strict matching (fewer false positives)
results_strict = pipeline.recognize_faces(img, threshold=0.7)

# Lenient matching (fewer false negatives)
results_lenient = pipeline.recognize_faces(img, threshold=0.3)
```

## � Understanding Thresholds

The **recognition threshold** is crucial for controlling the trade-off between false positives and false negatives:

- **Low threshold (0.3)**: More matches, but higher risk of incorrectly recognizing unknown faces
- **Medium threshold (0.5)**: Balanced approach (recommended)
- **High threshold (0.7)**: Fewer matches, but higher risk of not recognizing known faces

### How to Find Your Optimal Threshold

1. **Run `evaluate_threshold.py`** (provided in this repo) to analyze your database
2. Review the **distribution plot** saved to `output/threshold_evaluation.png`
3. Observe the statistics for genuine vs impostor distances
4. Choose based on your security requirements:
   - Security-focused: Use higher threshold
   - User-friendly: Use lower threshold

### Using the Threshold

Set threshold when calling recognition:

```python
# Strict (fewer false positives)
results = pipeline.recognize_faces(img, threshold=0.65)

# Balanced
results = pipeline.recognize_faces(img, threshold=0.5)

# Lenient (fewer false negatives)
results = pipeline.recognize_faces(img, threshold=0.35)
```

**Your submission should include:**
- The threshold value you selected
- Why you chose it (based on evaluation results)
- Recognition accuracy/statistics with that threshold

## 🧬 How Embeddings Work (vs Memorization)

### Why Embeddings Instead of LBPH?

**Traditional Approach (LBPH - Local Binary Patterns Histograms):**
- Stores full face image or histogram
- Direct pixel-by-pixel comparison
- ❌ Inefficient (large storage)
- ❌ Poor generalization (fails on pose/lighting changes)
- ❌ Slow (many comparisons needed)

**Modern Approach (ArcFace Embeddings):**
- ✅ Compresses face into **512-dimensional vector**
- ✅ Stores compact representation (512 floats = ~2KB per face)
- ✅ Learned by deep CNN to be discriminative
- ✅ Fast cosine similarity comparison
- ✅ Robust to pose, lighting, and aging
- ✅ Scales to millions of faces

### What is an Embedding?

An **embedding** is a mathematical vector representation of a face that:
1. **Encodes identity** - Faces of same person are close in embedding space
2. **Normalizes variations** - Handles pose, lighting, expression differences
3. **Separates identities** - Faces of different people are far apart
4. **Is L2-normalized** - All embeddings have unit length (magnitude = 1.0)

### Cosine Similarity

Face matching uses **normalized cosine similarity**:

```
similarity = dot_product(embedding1, embedding2)
           = cos(angle between embeddings)
           ∈ [0, 1]  (because L2-normalized)
```

- **1.0** = Identical faces
- **0.5** = Moderately similar
- **0.0** = Completely different

## 📐 Why 5-Point Alignment Matters

### What is Alignment?

**Alignment** normalizes face pose before extraction to ensure consistency:

```
Raw Face Image (any pose)  ──→  Similarity Transform  ──→  Aligned Face (112×112)
                               (rotate, scale, translate)
                               using 5-point landmarks
```

### The 5 Landmarks

The system detects these facial keypoints:
1. **Left eye**
2. **Right eye**
3. **Nose tip**
4. **Left mouth corner**
5. **Right mouth corner**

### Why Alignment Works

- ArcFace was **trained on aligned faces** (112×112)
- Alignment creates **normalized pose** (near-frontal)
- Reduces **within-person variations** (pose, scale)
- Improves **embedding quality** significantly

### Impact on Accuracy

Without alignment:
- Two photos of same person at different poses
- ❌ High distance (model thinks they're different people)

With alignment:
- Both photos warped to same standard pose
- ✅ Low distance (model correctly recognizes them)

## 🔧 Configuration

Key parameters you can adjust:

```python
# Face detection confidence
faces = detector.detect(image)  # Default min_confidence=0.9 in MTCNN

# Alignment output size
aligner = FaceAligner(output_size=(112, 112))  # Match ArcFace input

# Recognition threshold
threshold = 0.5  # Balance false positives/negatives
```

## 📁 Project Structure

```
face-recognition-arcface-onnx/
├── pipeline.py                          # Main pipeline class
├── face_recognition_pipeline.py         # Re-export for backward compatibility
├── live_recognition.py                  # Live camera recognition (Task 2)
├── evaluate_threshold.py                # Threshold evaluation (Task 4)
├── face_model.py                        # Face dataclass
├── face_detector.py                     # MTCNN face detection
├── face_aligner.py                      # 5-point alignment
├── arcface_recognizer.py                # ArcFace embedding extraction
├── face_database.py                     # Identity database storage
├── requirements.txt                     # Python dependencies
├── README.md                            # This documentation
├── models/
│   └── arcface_r100_v1.onnx            # ArcFace ONNX model (download separately)
├── data/
│   ├── enrollment/                     # Enrollment images (at least 10 identities, 2+ each)
│   └── test/                           # Test images for recognition
├── output/                             # Generated outputs
│   ├── recognition_result.jpg          # Recognition visualization
│   ├── frame_*.jpg                     # Live recognition frames
│   └── threshold_evaluation.png        # Threshold evaluation plot
└── face_database.pkl                   # Serialized face embeddings database
```

## 🚀 Usage Examples

### Full Workflow (All Tasks)

```bash
# Step 1: Place enrollment images in data/enrollment/
# (at least 10 identities with 2+ images each)

# Step 2: Enroll all identities from images
python -c "
from pipeline import FaceRecognitionPipeline
import os, cv2

pipeline = FaceRecognitionPipeline('models/arcface_r100_v1.onnx')
enrollment_dir = 'data/enrollment'

for filename in sorted(os.listdir(enrollment_dir)):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        name = os.path.splitext(filename)[0]
        img_path = os.path.join(enrollment_dir, filename)
        img = cv2.imread(img_path)
        pipeline.enroll_identity(img, name)
"

# Step 3: Evaluate threshold for your database (Task 4)
python evaluate_threshold.py
# Review output: output/threshold_evaluation.png

# Step 4: Run live recognition with optimized threshold (Task 2)
python live_recognition.py --threshold 0.55  # Use your evaluated threshold

# Step 5: Test with images
python -c "
from pipeline import FaceRecognitionPipeline
import cv2

pipeline = FaceRecognitionPipeline('models/arcface_r100_v1.onnx')
test_img = cv2.imread('data/test/test_image.jpg')
results = pipeline.recognize_faces(test_img, threshold=0.55)

for face, name, score in results:
    print(f'{name}: {score:.3f}')
"
```

### Individual Components

**Enroll a single face:**
```python
from pipeline import FaceRecognitionPipeline
import cv2

pipeline = FaceRecognitionPipeline('models/arcface_r100_v1.onnx')
img = cv2.imread('person_photo.jpg')
pipeline.enroll_identity(img, 'Person Name')
```

**Recognize faces in an image:**
```python
results = pipeline.recognize_faces(img, threshold=0.5)
for face, name, similarity in results:
    print(f"{name}: {similarity:.3f}")
```

**Run live camera:**
```bash
python live_recognition.py --threshold 0.5
```

**Evaluate thresholds:**
```bash
python evaluate_threshold.py
```

## ✅ Verification Checklist (Task 2)

Before submitting, verify that ALL pipeline stages work:

- [ ] **Camera**: Live camera input works (`live_recognition.py`)
- [ ] **Face Detection**: Faces are detected with MTCNN
- [ ] **5-Point Landmarks**: 5 facial landmarks are detected correctly
- [ ] **Alignment**: Faces are aligned to 112×112 template
- [ ] **ArcFace Embedding**: 512-dimensional embeddings are extracted
- [ ] **Enrollment**: At least 10 identities with multiple samples enrolled
- [ ] **L2-Normalization**: Embeddings are L2-normalized (verify in arcface_recognizer.py)
- [ ] **Live Recognition**: Recognizes enrolled faces correctly
- [ ] **Unknown Rejection**: Correctly rejects faces of unknown persons
- [ ] **Threshold Evaluation**: Runs successfully and generates statistics
- [ ] **Threshold Optimization**: Threshold is optimized (not just guessed at 0.5)

## 🧪 Testing

Run the example script:

```bash
python face_recognition_pipeline.py
```

Expected output:
```
=== Enrolling Identities ===
Successfully enrolled alice
Successfully enrolled bob
Successfully enrolled charlie

=== Recognizing Faces ===
Detected: alice (confidence: 0.847)
Detected: bob (confidence: 0.792)
Detected: charlie (confidence: 0.821)

=== Enrolled Identities ===
['alice', 'bob', 'charlie']
```

## 🎓 Technical Details

### 5-Point Alignment Algorithm

The alignment uses the Umeyama similarity transform:

1. **Compute centroids** of source and reference landmarks
2. **Center the point sets** by subtracting centroids
3. **Compute scale** ratio between point sets
4. **Compute rotation** via SVD: `R = U @ Vt`
5. **Build 2×3 transform matrix**: `M = [sR | t]`

### ArcFace Preprocessing

Input normalization for ArcFace ONNX model:
```python
face = (face - 127.5) / 127.5  # Normalize to [-1, 1]
face = np.transpose(face, (2, 0, 1))  # HWC to CHW
```

### Cosine Similarity

Face matching uses normalized cosine similarity:
```python
similarity = np.dot(embedding1, embedding2)  # Both L2-normalized
```

Typical threshold values:
- **0.3-0.4**: Lenient (more matches, some false positives)
- **0.5**: Balanced (recommended)
- **0.6-0.7**: Strict (fewer false positives)

## 🐛 Troubleshooting

**Q: "No face detected in image"**
- Ensure face is clearly visible and well-lit
- Face should be at least 80×80 pixels
- Avoid extreme poses or occlusions

**Q: "Model file not found"**
- Download ArcFace ONNX model (see Quick Start)
- Verify path: `models/arcface_r100_v1.onnx`

**Q: "Poor recognition accuracy"**
- Enroll multiple images per identity (3-5 recommended)
- Use high-quality, frontal face images for enrollment
- Adjust recognition threshold

## 📚 References

- [ArcFace Paper](https://arxiv.org/abs/1801.07698) - Deng et al., CVPR 2019
- [MTCNN Paper](https://arxiv.org/abs/1604.02878) - Zhang et al., 2016
- [ONNX Model Zoo](https://github.com/onnx/models)

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## ✍️ Author

**[Your Name]**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

⭐ If you find this project helpful, please star it on GitHub!