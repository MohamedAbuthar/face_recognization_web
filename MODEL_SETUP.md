# ONNX Model Setup Instructions

## Important: You need to download the ONNX models before the face recognition will work!

### Step 1: Install InsightFace Python Package

```bash
pip install insightface
```

### Step 2: Download Models Using Python

Create a file called `download_models.py`:

```python
from insightface.model_zoo import get_model

# Download SCRFD detection model
print("Downloading SCRFD detection model...")
get_model('scrfd_2.5g_kps', download=True)

# Download ArcFace R100 recognition model  
print("Downloading ArcFace recognition model...")
get_model('glintr100', download=True)

print("Models downloaded successfully!")
print("Models are located in: ~/.insightface/models/")
```

Run it:

```bash
python download_models.py
```

### Step 3: Copy Models to Public Folder

```bash
# Create models directory
mkdir -p public/models

# Copy models from InsightFace cache to public folder
# On macOS/Linux:
cp ~/.insightface/models/buffalo_l/det_10g.onnx public/models/scrfd_2.5g_kps.onnx
cp ~/.insightface/models/buffalo_l/w600k_r50.onnx public/models/glintr100.onnx

# On Windows:
# copy %USERPROFILE%\.insightface\models\buffalo_l\det_10g.onnx public\models\scrfd_2.5g_kps.onnx
# copy %USERPROFILE%\.insightface\models\buffalo_l\w600k_r50.onnx public\models\glintr100.onnx
```

### Alternative: Download Directly

If the Python method doesn't work, you can download the models directly:

1. Go to: https://github.com/deepinsight/insightface/tree/master/model_zoo
2. Download:
   - `scrfd_2.5g_kps.onnx` (face detection model)
   - `glintr100.onnx` (face recognition model)
3. Place them in `public/models/` folder

### Step 4: Verify Models Are in Place

Check that these files exist:
- `public/models/scrfd_2.5g_kps.onnx`
- `public/models/glintr100.onnx`

### Step 5: Restart Your Development Server

```bash
pnpm dev
```

## Troubleshooting

If you see 404 errors for the models:
1. Make sure the files are in `public/models/` directory
2. Check the file names match exactly (case-sensitive)
3. Restart the Next.js development server
4. Clear browser cache and reload

The models are large files (~2-10MB each), so the initial download may take a few minutes.


