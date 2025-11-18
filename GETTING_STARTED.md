# Getting Started with MediaPipe Face Recognition

## 🎯 Overview

This is a complete Next.js web application featuring real-time face detection and recognition powered by **MediaPipe AI**. The app uses cutting-edge technology to detect faces and track 468 facial landmarks in real-time.

## ⚡ Quick Start (3 Steps)

### 1️⃣ Install & Setup

```bash
# Install dependencies and download models
pnpm setup
```

This command will:
- Install all npm packages
- Download MediaPipe models automatically

### 2️⃣ Fix Firebase Permissions (REQUIRED!)

**🔴 IMPORTANT: Fix this to avoid "Missing or insufficient permissions" error**

1. Open [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/face-recoginition-de3f4/firestore/rules)

2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /faces/{faceId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"** button
4. Wait for "Rules published successfully" message

**📖 Detailed Guide**: See [FIX_FIREBASE_PERMISSIONS.md](FIX_FIREBASE_PERMISSIONS.md)

### 3️⃣ Run the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 What's Included

### Core Files

```
src/
├── lib/
│   ├── mediapipeClient.ts      ← MediaPipe wrapper
│   ├── firebase.ts              ← Firebase config
│   └── firestore.ts             ← Database operations
├── components/
│   ├── CameraView.tsx           ← Camera streaming
│   └── FaceDetectorCanvas.tsx   ← Face visualization
├── app/
│   ├── page.tsx                 ← Landing page
│   ├── register/page.tsx        ← Face registration
│   └── recognize/page.tsx       ← Face recognition
└── utils/
    └── math.ts                  ← Math utilities

public/models/
├── blaze_face_short_range.tflite  ← Face detector
└── face_landmarker.task           ← Face mesh (468 landmarks)
```

## 🎨 Features

### ✅ Real-time Face Detection
- Detects faces at 30-60 FPS
- GPU-accelerated processing
- Bounding box with confidence score

### ✅ 468 Facial Landmarks
- Complete face mesh
- Eyes, nose, lips, eyebrows tracking
- Real-time visualization

### ✅ Face Registration
- Capture face with landmarks
- Create face embeddings
- Store in Firebase

### ✅ Face Recognition
- Compare faces in real-time
- Match against registered faces
- Display user information

### ✅ Beautiful UI
- Responsive design
- Dark mode support
- Smooth animations
- FPS counter

## 🚀 How to Use

### Register a New Face

1. Click **"Register Face"** on the home page
2. Enter your name in the text field
3. Click **"Start Face Recognition"**
4. Position your face in the oval guide
5. Wait for the green bounding box to appear
6. Face will be automatically captured and saved
7. You'll be redirected to the recognition page

### Recognize Faces

1. Click **"Recognize Face"** on the home page
2. Camera will start automatically
3. Position your face in the frame
4. System will detect and recognize your face
5. If matched, your information will be displayed
6. Click **"Continue Recognition"** to scan again

## 🔧 Configuration

### Adjust Detection Sensitivity

Edit `src/lib/mediapipeClient.ts`:

```typescript
// Face Detector
minDetectionConfidence: 0.5, // 0.0 to 1.0 (lower = more sensitive)

// Face Landmarker
minFaceDetectionConfidence: 0.5,
minFacePresenceConfidence: 0.5,
minTrackingConfidence: 0.5,
```

### Change Camera Resolution

Edit `src/components/CameraView.tsx`:

```typescript
video: {
  width: { ideal: 1280 },  // Change resolution
  height: { ideal: 720 },
  facingMode: 'user',      // 'user' = front, 'environment' = back
}
```

### Customize Colors

Edit in your page components:

```tsx
<FaceDetectorCanvas
  boxColor="#10b981"      // Bounding box (green)
  landmarkColor="#06b6d4" // Landmarks (cyan)
/>
```

### Adjust Max Faces

Edit `src/lib/mediapipeClient.ts`:

```typescript
numFaces: 5, // Maximum number of faces to detect
```

## 🎯 Understanding the Detection

### What You See

1. **Yellow Message**: "Position your face in the oval"
   - No face detected yet

2. **Blue Box + "Detecting..."**: 
   - Face detected, processing

3. **Green Box + "Face Detected"**:
   - Face successfully detected and captured

4. **Cyan Points (468 landmarks)**:
   - Facial feature points
   - Eyes, nose, lips, face outline

5. **FPS Counter**:
   - Shows detection speed
   - Should be 30-60 FPS

### Detection Process

```
Camera → MediaPipe → Face Detection → Landmarks → Visualization
                          ↓
                    Face Region → Embedding → Firebase
```

## 🐛 Troubleshooting

### Problem: Models Not Loading (404 Error)

**Solution:**
```bash
pnpm download-models
```

Verify files exist:
- `/public/models/blaze_face_short_range.tflite`
- `/public/models/face_landmarker.task`

### Problem: Camera Not Working

**Solutions:**
1. Allow camera permissions in browser
2. Use HTTPS in production (required)
3. Try Chrome or Edge browser
4. Check if camera is used by another app
5. Restart browser

### Problem: Low FPS (< 20)

**Solutions:**
1. Close other tabs and applications
2. Use a modern browser (Chrome/Edge)
3. Ensure good lighting
4. Lower camera resolution
5. Reduce `numFaces` in config

### Problem: MediaPipe Initialization Failed

**Solutions:**
1. Check internet connection (WASM loads from CDN)
2. Clear browser cache
3. Try different browser
4. Check browser console for specific errors

### Problem: Face Not Detected

**Solutions:**
1. Ensure good lighting
2. Face the camera directly
3. Remove glasses/mask if possible
4. Move closer to camera
5. Lower `minDetectionConfidence` in config

## 📱 Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome  | ✅ Excellent | ✅ Excellent | Recommended |
| Edge    | ✅ Excellent | ✅ Excellent | Recommended |
| Safari  | ✅ Good | ✅ Good | Works well |
| Firefox | ⚠️ Limited | ⚠️ Limited | May have issues |

## 🔐 Security & Privacy

### What's Stored
- ✅ Face embeddings (mathematical representation)
- ✅ User name and registration date
- ❌ NO raw images or photos

### Security Features
- Camera permissions properly requested
- HTTPS required for production
- Firebase security rules recommended
- All processing happens in browser

### Recommended Firebase Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /faces/{faceId} {
      allow read: if true;
      allow write: if request.auth != null; // Require authentication
    }
  }
}
```

## 📊 Performance

### Expected Metrics
- **Desktop**: 50-60 FPS
- **Mobile**: 30-45 FPS
- **Detection Latency**: < 33ms
- **Initialization**: 2-3 seconds

### Optimization Tips
1. Use GPU acceleration (enabled by default)
2. Limit detection frequency if needed
3. Use appropriate camera resolution
4. Close unnecessary browser tabs

## 🎓 Learn More

### Documentation
- `MEDIAPIPE_README.md` - Comprehensive documentation
- `QUICK_START_MEDIAPIPE.md` - Quick start guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details

### External Resources
- [MediaPipe Documentation](https://developers.google.com/mediapipe)
- [Face Detection Guide](https://developers.google.com/mediapipe/solutions/vision/face_detector)
- [Face Landmarker Guide](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

Requirements:
1. ✅ Node.js 18+
2. ✅ Models in `/public/models/`
3. ✅ Environment variables set
4. ✅ HTTPS enabled (required for camera)

## 🎉 Success Checklist

Before using the app, verify:

- [ ] Dependencies installed (`pnpm install`)
- [ ] Models downloaded (`pnpm download-models`)
- [ ] Firebase configured (`.env.local` created)
- [ ] App running (`pnpm dev`)
- [ ] Browser opened (http://localhost:3000)
- [ ] Camera permission granted
- [ ] Face detection working (green box visible)
- [ ] Landmarks visible (468 cyan points)
- [ ] FPS counter showing 30+ FPS

## 💡 Tips for Best Results

### For Registration
1. **Good Lighting**: Face the light source
2. **Neutral Expression**: Look straight at camera
3. **Remove Obstructions**: No glasses, masks, or hats
4. **Stay Still**: Hold position for 2-3 seconds
5. **Close Distance**: Be 1-2 feet from camera

### For Recognition
1. **Same Conditions**: Similar lighting as registration
2. **Face Camera**: Look directly at camera
3. **Be Patient**: Wait 2-3 seconds for recognition
4. **Multiple Angles**: System works from various angles

## 🆘 Need Help?

1. **Check Console**: Open browser DevTools (F12)
2. **Verify Models**: Check `/public/models/` directory
3. **Test Camera**: Try in different browser
4. **Review Logs**: Check terminal for errors
5. **Read Docs**: See `MEDIAPIPE_README.md`

## 🎊 You're Ready!

Everything is set up and ready to use. Start by:

1. **Register your face** on the Register page
2. **Test recognition** on the Recognize page
3. **Invite others** to register their faces
4. **Explore features** and customize as needed

---

**Built with ❤️ using MediaPipe, Next.js, and Firebase**

For detailed documentation, see `MEDIAPIPE_README.md`

Happy face detecting! 🎉

