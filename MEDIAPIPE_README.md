# Face Recognition Web App with MediaPipe

A complete Next.js web application featuring real-time face detection and recognition powered by MediaPipe AI.

## 🚀 Features

- ✅ **Real-time Face Detection** - High-performance face detection using MediaPipe
- ✅ **Face Mesh with 468 Landmarks** - Precise facial landmark detection
- ✅ **Camera Streaming** - Smooth camera integration with WebRTC
- ✅ **Canvas Overlay** - Beautiful visualization of detection results
- ✅ **FPS-Optimized Detection Loop** - Efficient requestAnimationFrame-based detection
- ✅ **WebAssembly (WASM)** - GPU-accelerated processing
- ✅ **Firebase Integration** - Secure face embedding storage
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Dark Mode Support** - Beautiful UI with dark mode

## 📁 Project Structure

```
/src
  /components
    CameraView.tsx              # Camera streaming component
    FaceDetectorCanvas.tsx      # Canvas overlay for face visualization
  /lib
    mediapipeClient.ts          # MediaPipe client wrapper
    firebase.ts                 # Firebase configuration
    firestore.ts                # Firestore operations
  /app
    page.tsx                    # Landing page
    /register
      page.tsx                  # Face registration page
    /recognize
      page.tsx                  # Face recognition page
  /utils
    math.ts                     # Math utilities (cosine similarity)
/public
  /models
    blaze_face_short_range.tflite  # Face detection model
    face_landmarker.task            # Face mesh model (468 landmarks)
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
pnpm install
```

This will install:
- `@mediapipe/tasks-vision` - MediaPipe Tasks Vision library
- `next` - Next.js framework
- `react` & `react-dom` - React libraries
- `firebase` - Firebase SDK
- Other dependencies

### 2. Download MediaPipe Models

The models are automatically downloaded when you run the download script:

```bash
node download_mediapipe_models.js
```

This downloads:
- `blaze_face_short_range.tflite` (Face Detection)
- `face_landmarker.task` (Face Mesh with 468 landmarks)

Models are stored in `/public/models/`

### 3. Configure Firebase

Create a `.env.local` file with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Core Components

### MediaPipe Client (`mediapipeClient.ts`)

The main wrapper for MediaPipe functionality:

```typescript
import mediaPipeClient from '@/lib/mediapipeClient';

// Initialize MediaPipe
await mediaPipeClient.initialize();

// Detect faces
const detections = await mediaPipeClient.detectFaces(video, timestamp);

// Detect landmarks (468 points)
const landmarks = await mediaPipeClient.detectLandmarks(video, timestamp);

// Combined detection
const result = await mediaPipeClient.detectFacesAndLandmarks(video, timestamp);
```

**Key Methods:**
- `initialize()` - Load WASM and models
- `detectFaces(video, timestamp)` - Detect faces in video frame
- `detectLandmarks(video, timestamp)` - Detect 468 facial landmarks
- `detectFacesAndLandmarks(video, timestamp)` - Combined detection
- `extractFaceRegion(video, box, padding)` - Extract face region as ImageData
- `dispose()` - Clean up resources

### CameraView Component

Handles camera streaming and provides video element:

```tsx
import CameraView from '@/components/CameraView';

<CameraView
  onVideoReady={(video) => {
    // Start detection with video element
  }}
  onError={(error) => {
    console.error('Camera error:', error);
  }}
  mirror={true}
  showGuide={true}
  guideText="Position your face in the oval"
/>
```

**Props:**
- `onVideoReady` - Callback when video is ready
- `onError` - Error callback
- `mirror` - Mirror the video (default: true)
- `showGuide` - Show oval guide (default: true)
- `guideText` - Guide text to display

### FaceDetectorCanvas Component

Draws detection results on canvas overlay:

```tsx
import FaceDetectorCanvas from '@/components/FaceDetectorCanvas';

<FaceDetectorCanvas
  videoRef={videoRef}
  boxes={boxes}
  landmarks={landmarks}
  mirror={true}
  showBoxes={true}
  showLandmarks={true}
  boxColor="#10b981"
  landmarkColor="#06b6d4"
/>
```

**Props:**
- `videoRef` - Reference to video element
- `boxes` - Array of face bounding boxes
- `landmarks` - Array of face landmarks
- `mirror` - Mirror the canvas (default: true)
- `showBoxes` - Show bounding boxes (default: true)
- `showLandmarks` - Show landmarks (default: true)
- `boxColor` - Bounding box color
- `landmarkColor` - Landmark point color

## 🎯 Usage Examples

### Face Registration

```typescript
// 1. Initialize MediaPipe
await mediaPipeClient.initialize();

// 2. Start detection loop
const detectFrame = async (timestamp: number) => {
  const result = await mediaPipeClient.detectFacesAndLandmarks(video, timestamp);
  
  // Update UI with results
  setBoxes(result.boxes);
  setLandmarks(result.landmarks);
  
  // Continue loop
  requestAnimationFrame(detectFrame);
};

requestAnimationFrame(detectFrame);

// 3. Extract face region when detected
if (result.boxes.length > 0) {
  const bestBox = result.boxes[0];
  const faceImageData = mediaPipeClient.extractFaceRegion(video, bestBox, 0.2);
  
  // Create embedding and save to Firebase
  const embedding = createEmbedding(faceImageData);
  await saveFaceEmbedding(name, embedding);
}
```

### Face Recognition

```typescript
// 1. Load registered faces from Firebase
const storedFaces = await getAllFaces();

// 2. Detect and recognize
const result = await mediaPipeClient.detectFacesAndLandmarks(video, timestamp);

if (result.boxes.length > 0) {
  const faceImageData = mediaPipeClient.extractFaceRegion(video, result.boxes[0]);
  const embedding = createEmbedding(faceImageData);
  
  // Compare with stored faces
  for (const storedFace of storedFaces) {
    const similarity = cosineSimilarity(embedding, storedFace.embedding);
    if (similarity >= 0.6) {
      console.log('Recognized:', storedFace.name);
    }
  }
}
```

## 🔧 Configuration

### MediaPipe Settings

In `mediapipeClient.ts`, you can adjust:

```typescript
// Face Detector
FaceDetector.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: '/models/blaze_face_short_range.tflite',
    delegate: 'GPU', // Use GPU acceleration
  },
  runningMode: 'VIDEO',
  minDetectionConfidence: 0.5, // Adjust confidence threshold
});

// Face Landmarker
FaceLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: '/models/face_landmarker.task',
    delegate: 'GPU',
  },
  runningMode: 'VIDEO',
  numFaces: 5, // Max number of faces to detect
  minFaceDetectionConfidence: 0.5,
  minFacePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
```

### Camera Settings

In `CameraView.tsx`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user', // 'user' for front camera, 'environment' for back
  },
  audio: false,
});
```

## 🎨 Customization

### Change Detection Colors

```tsx
<FaceDetectorCanvas
  boxColor="#10b981"      // Green boxes
  landmarkColor="#06b6d4" // Cyan landmarks
/>
```

### Adjust Face Mesh Visualization

In `FaceDetectorCanvas.tsx`, modify the `drawFaceMeshConnections` function to show different facial features:

- Face oval
- Left/right eyes
- Eyebrows
- Lips
- Nose

## 🚀 Performance Optimization

### FPS Counter

The app includes an FPS counter to monitor performance:

```typescript
const [fps, setFps] = useState(0);
const fpsCounterRef = useRef<number>(0);

// In detection loop
fpsCounterRef.current++;

// Update FPS every second
setInterval(() => {
  setFps(fpsCounterRef.current);
  fpsCounterRef.current = 0;
}, 1000);
```

### Optimization Tips

1. **Use GPU Acceleration**: Set `delegate: 'GPU'` in MediaPipe options
2. **Limit Detection Frequency**: Don't detect every frame if not needed
3. **Use requestAnimationFrame**: For smooth 60 FPS detection
4. **Cleanup Resources**: Always call `dispose()` when done

## 📱 Mobile Support

The app is fully responsive and works on mobile devices:

- Touch-friendly UI
- Responsive camera view
- Optimized for mobile performance
- Works with front and back cameras

## 🔒 Security

- Face embeddings are stored securely in Firebase Firestore
- No raw images are stored, only embeddings
- Camera permissions are requested properly
- HTTPS required for camera access in production

## 🐛 Troubleshooting

### Models Not Loading

```bash
# Re-download models
node download_mediapipe_models.js
```

### Camera Not Working

- Check browser permissions
- Ensure HTTPS in production
- Try different browsers (Chrome/Edge recommended)

### Low FPS

- Reduce `numFaces` in Face Landmarker settings
- Increase detection interval
- Use lower camera resolution

### WASM Loading Issues

- Check CDN availability
- Ensure proper CORS headers
- Try different WASM version in `mediapipeClient.ts`

## 📦 Build for Production

```bash
# Build the app
pnpm build

# Start production server
pnpm start
```

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

Ensure:
1. Models are in `/public/models/`
2. Environment variables are set
3. HTTPS is enabled (required for camera)

## 📄 License

MIT License - Feel free to use in your projects!

## 🙏 Credits

- **MediaPipe** - Google's ML solutions for live and streaming media
- **Next.js** - React framework for production
- **Firebase** - Backend services
- **Tailwind CSS** - Utility-first CSS framework

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review MediaPipe documentation
3. Check browser console for errors

## 🎉 What's Next?

Potential improvements:
- [ ] Add face recognition model (e.g., FaceNet)
- [ ] Support multiple face registration per user
- [ ] Add attendance tracking
- [ ] Export recognition logs
- [ ] Add face liveness detection
- [ ] Support video file upload
- [ ] Add face comparison visualization

---

Built with ❤️ using MediaPipe and Next.js

