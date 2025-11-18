# Quick Start Guide - MediaPipe Face Recognition

Get your face recognition app running in 5 minutes!

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Download MediaPipe Models

```bash
pnpm download-models
```

Or use the combined setup command:

```bash
pnpm setup
```

### Step 3: Configure Firebase (Optional)

Create `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Run the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ What's Working

- ✅ Real-time face detection with MediaPipe
- ✅ 468 facial landmarks visualization
- ✅ Face mesh overlay
- ✅ Bounding box detection
- ✅ FPS counter
- ✅ Camera streaming
- ✅ Face registration
- ✅ Face recognition
- ✅ Firebase integration
- ✅ Responsive UI
- ✅ Dark mode

## 🎯 How to Use

### Register a Face

1. Go to **Register Face** page
2. Enter your name
3. Click "Start Face Recognition"
4. Position your face in the oval guide
5. Wait for face detection (green box will appear)
6. Face will be automatically captured and saved

### Recognize a Face

1. Go to **Recognize Face** page
2. Camera will start automatically
3. Position your face in the frame
4. System will automatically recognize registered faces
5. Recognition result will be displayed

## 📊 What You'll See

### Face Detection
- **Green bounding box** around detected face
- **Confidence score** (percentage)
- **468 cyan landmark points** on face
- **Face mesh connections** (eyes, nose, lips, etc.)
- **FPS counter** in the header

### Registration
- Real-time face detection
- Automatic face capture
- Progress indicators
- Success confirmation

### Recognition
- Continuous face scanning
- Automatic recognition
- Match confidence display
- User information dialog

## 🔧 Troubleshooting

### Models Not Found (404 Error)

```bash
# Re-download models
pnpm download-models
```

Models should be in: `/public/models/`
- `blaze_face_short_range.tflite`
- `face_landmarker.task`

### Camera Not Working

1. Allow camera permissions in browser
2. Use HTTPS in production
3. Try Chrome or Edge browser
4. Check browser console for errors

### Low Performance

1. Close other tabs/applications
2. Use a modern browser (Chrome/Edge)
3. Ensure good lighting
4. Check FPS counter (should be 30-60)

### MediaPipe Initialization Failed

1. Check internet connection (WASM loads from CDN)
2. Clear browser cache
3. Try different browser
4. Check browser console for errors

## 🎨 Customization

### Change Colors

Edit in page components:

```tsx
<FaceDetectorCanvas
  boxColor="#10b981"      // Green
  landmarkColor="#06b6d4" // Cyan
/>
```

### Adjust Detection Sensitivity

Edit `src/lib/mediapipeClient.ts`:

```typescript
minDetectionConfidence: 0.5, // Lower = more sensitive
```

### Change Camera Resolution

Edit `src/components/CameraView.tsx`:

```typescript
video: {
  width: { ideal: 1280 },
  height: { ideal: 720 },
}
```

## 📱 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅     |
| Edge    | ✅      | ✅     |
| Safari  | ✅      | ✅     |
| Firefox | ✅      | ⚠️     |

⚠️ Firefox may have limited MediaPipe support

## 🔍 Key Features

### MediaPipe Face Detector
- Detects faces in real-time
- Returns bounding boxes
- Provides confidence scores
- GPU-accelerated

### MediaPipe Face Landmarker
- 468 facial landmarks
- Face mesh visualization
- Eye, nose, lip tracking
- Face orientation detection

### Performance
- 30-60 FPS on modern devices
- GPU acceleration
- WebAssembly optimization
- Efficient canvas rendering

## 📚 Next Steps

1. **Customize UI** - Edit Tailwind classes
2. **Add Features** - Attendance tracking, logs, etc.
3. **Deploy** - Use Vercel or similar platform
4. **Improve Recognition** - Add proper face recognition model

## 🆘 Need Help?

1. Check `MEDIAPIPE_README.md` for detailed documentation
2. Review browser console for errors
3. Ensure models are downloaded correctly
4. Verify camera permissions

## 🎉 Success Checklist

- [ ] Dependencies installed
- [ ] Models downloaded
- [ ] Firebase configured (optional)
- [ ] App running on localhost:3000
- [ ] Camera permission granted
- [ ] Face detection working (green box visible)
- [ ] Landmarks visible (468 cyan points)
- [ ] FPS counter showing 30+ FPS
- [ ] Face registration working
- [ ] Face recognition working

## 📞 Common Questions

**Q: Do I need internet connection?**
A: Yes, for initial WASM loading from CDN. After that, it works offline.

**Q: Can I use this in production?**
A: Yes! Just ensure HTTPS and proper Firebase security rules.

**Q: How accurate is the recognition?**
A: Current implementation uses simple embeddings. For production, integrate a proper face recognition model like FaceNet.

**Q: Can I detect multiple faces?**
A: Yes! Set `numFaces: 5` in mediapipeClient.ts (already configured).

**Q: Does it work on mobile?**
A: Yes! Fully responsive and optimized for mobile devices.

---

🎊 **You're all set!** Start registering and recognizing faces!

For detailed documentation, see `MEDIAPIPE_README.md`

