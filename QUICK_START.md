# Quick Start Guide

## ⚠️ IMPORTANT: Download ONNX Models First!

Your app is working correctly, but you need to download the face recognition models.

## Step 1: Install InsightFace

```bash
pip install insightface
```

## Step 2: Download Models

```bash
python download_models.py
```

## Step 3: Copy Models

After downloading, copy the models to the public folder:

```bash
# Check where models were downloaded
ls ~/.insightface/models/buffalo_l/

# Copy to public folder
mkdir -p public/models
cp ~/.insightface/models/buffalo_l/det_10g.onnx public/models/scrfd_2.5g_kps.onnx
cp ~/.insightface/models/buffalo_l/w600k_r50.onnx public/models/glintr100.onnx
```

## Step 4: Verify Models

```bash
ls -lh public/models/
```

You should see:
- `scrfd_2.5g_kps.onnx` (~3MB)
- `glintr100.onnx` (~166MB)

## Step 5: Restart Server

```bash
pnpm dev
```

## How It Works

### Registration Page (`/register`)
1. Enter your name
2. Click "Start Face Recognition"
3. Camera dialog opens
4. Position your face in the oval
5. Face is detected and captured automatically
6. Embedding saved to Firebase Firestore
7. Success message and redirect to recognition page

### Recognition Page (`/recognize`)
1. Camera opens automatically
2. Shows your face in the dialog
3. Detects and recognizes faces
4. Compares with stored embeddings in Firebase
5. Shows dialog with recognized user's name and registration date

## Troubleshooting

### 404 Errors for Models
- Make sure models are in `public/models/` directory
- Check file names match exactly
- Restart the development server

### Camera Not Showing
- Allow camera permissions in your browser
- Check browser console for errors

### Face Not Detected
- Ensure good lighting
- Position face in the oval guide
- Make sure models are loaded (check browser console)

## Firebase Setup

Your Firebase is already configured:
- Project: face-recoginition-de3f4
- Collection: `faces`
- Stores: name, embedding (512-dim array), createdAt

Check Firebase Console to see stored faces:
https://console.firebase.google.com/project/face-recoginition-de3f4/firestore


