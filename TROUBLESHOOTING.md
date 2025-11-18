# Troubleshooting Guide

## 🔴 Common Issues and Solutions

### Issue 1: "Missing or insufficient permissions"

**Symptoms:**
- ❌ Error message: "Missing or insufficient permissions"
- ❌ Face registration fails after capture
- ❌ Recognition page shows "Failed to load stored faces"

**Solution:**

Update Firebase Firestore security rules:

1. **Open Firebase Console**: [Firestore Rules](https://console.firebase.google.com/project/face-recoginition-de3f4/firestore/rules)

2. **Replace rules with**:
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

3. **Click "Publish"**

4. **Refresh your app** (Ctrl+Shift+R or Cmd+Shift+R)

**Detailed Guide**: [FIX_FIREBASE_PERMISSIONS.md](FIX_FIREBASE_PERMISSIONS.md)

---

### Issue 2: Models Not Loading (404 Error)

**Symptoms:**
- ❌ Console error: "GET /models/blaze_face_short_range.tflite 404"
- ❌ Console error: "GET /models/face_landmarker.task 404"
- ❌ MediaPipe initialization fails

**Solution:**

```bash
# Download models
pnpm download-models

# Or manually
node download_mediapipe_models.js
```

**Verify models exist:**
```bash
ls -la public/models/
# Should show:
# blaze_face_short_range.tflite
# face_landmarker.task
```

---

### Issue 3: Camera Not Working

**Symptoms:**
- ❌ Black screen instead of camera
- ❌ "Failed to access camera" error
- ❌ Camera permission denied

**Solutions:**

1. **Allow Camera Permissions**
   - Click camera icon in browser address bar
   - Select "Always allow"
   - Refresh page

2. **Use HTTPS in Production**
   - Camera requires secure context
   - Use `https://` not `http://`
   - localhost works without HTTPS

3. **Check Browser Support**
   - Chrome/Edge: ✅ Recommended
   - Safari: ✅ Works
   - Firefox: ⚠️ Limited support

4. **Close Other Apps**
   - Close other apps using camera (Zoom, Skype, etc.)
   - Only one app can use camera at a time

---

### Issue 4: Low FPS / Slow Performance

**Symptoms:**
- ❌ FPS counter shows < 20
- ❌ Laggy face detection
- ❌ Slow landmark rendering

**Solutions:**

1. **Close Other Tabs**
   - Close unnecessary browser tabs
   - Free up system resources

2. **Use Modern Browser**
   - Chrome/Edge recommended
   - Update to latest version

3. **Check GPU Acceleration**
   - Chrome: `chrome://gpu`
   - Should show "Hardware accelerated"

4. **Lower Camera Resolution**
   - Edit `src/components/CameraView.tsx`
   - Change to 640x480 instead of 1280x720

5. **Reduce Max Faces**
   - Edit `src/lib/mediapipeClient.ts`
   - Change `numFaces: 5` to `numFaces: 1`

---

### Issue 5: Face Not Detected

**Symptoms:**
- ❌ No green bounding box
- ❌ "Position your face in the oval" stays visible
- ❌ No landmarks shown

**Solutions:**

1. **Improve Lighting**
   - Face the light source
   - Avoid backlighting
   - Use well-lit room

2. **Position Correctly**
   - Face camera directly
   - Stay 1-2 feet from camera
   - Keep face in oval guide

3. **Remove Obstructions**
   - Remove glasses (if causing issues)
   - Remove mask
   - Remove hat

4. **Lower Detection Threshold**
   - Edit `src/lib/mediapipeClient.ts`
   - Change `minDetectionConfidence: 0.5` to `0.3`

---

### Issue 6: MediaPipe Initialization Failed

**Symptoms:**
- ❌ "Failed to initialize face detection"
- ❌ "MediaPipe initialization error"
- ❌ Stuck on "Initializing MediaPipe..."

**Solutions:**

1. **Check Internet Connection**
   - WASM loads from CDN
   - Requires internet for first load

2. **Clear Browser Cache**
   - Ctrl+Shift+Delete (or Cmd+Shift+Delete)
   - Clear cached files
   - Refresh page

3. **Try Different Browser**
   - Test in Chrome/Edge
   - Update browser to latest version

4. **Check Console for Errors**
   - Press F12
   - Look for specific error messages
   - Share error for help

---

### Issue 7: Face Recognition Not Working

**Symptoms:**
- ❌ Face detected but not recognized
- ❌ Wrong person recognized
- ❌ No recognition dialog appears

**Solutions:**

1. **Check Registered Faces**
   - Go to [Firestore Data](https://console.firebase.google.com/project/face-recoginition-de3f4/firestore/data)
   - Verify faces are stored
   - Check "faces" collection

2. **Re-register Face**
   - Delete old registration
   - Register again with good lighting
   - Use neutral expression

3. **Adjust Similarity Threshold**
   - Edit recognition page
   - Lower threshold from 0.6 to 0.5
   - Test again

4. **Check Console Logs**
   - Press F12
   - Look for "Loaded X faces from Firestore"
   - Check for errors

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

1. Press **F12** (or Cmd+Option+I on Mac)
2. Click **Console** tab
3. Look for errors (red text)
4. Check for warnings (yellow text)

### Step 2: Verify Models

```bash
ls -la public/models/
```

Should show:
```
blaze_face_short_range.tflite (200KB)
face_landmarker.task (10MB)
```

### Step 3: Test Firebase Connection

1. Open [Firebase Console](https://console.firebase.google.com/project/face-recoginition-de3f4)
2. Go to Firestore Database
3. Check if "faces" collection exists
4. Verify rules are published

### Step 4: Check Network Tab

1. Press F12
2. Click **Network** tab
3. Refresh page
4. Look for failed requests (red)

---

## 📊 Expected Console Output

### Successful Registration:
```
✅ Initializing MediaPipe...
✅ WASM loaded successfully
✅ Face Detector initialized
✅ Face Landmarker initialized
✅ MediaPipe initialization complete
✅ Saving face embedding to Firestore: { name: "abuthar", embeddingLength: 128 }
✅ Face embedding saved successfully with ID: abc123...
```

### Successful Recognition:
```
✅ Loaded 1 faces from Firestore
✅ Camera started successfully
✅ Detection running at 45 FPS
✅ Face detected: { score: 0.95, ... }
✅ Recognized: abuthar (similarity: 0.87)
```

---

## 🆘 Still Having Issues?

### Get Help:

1. **Check Documentation**
   - [GETTING_STARTED.md](GETTING_STARTED.md)
   - [MEDIAPIPE_README.md](MEDIAPIPE_README.md)
   - [FIX_FIREBASE_PERMISSIONS.md](FIX_FIREBASE_PERMISSIONS.md)

2. **Review Console Errors**
   - Copy exact error message
   - Check error code
   - Search for solution

3. **Test in Different Browser**
   - Try Chrome/Edge
   - Update to latest version
   - Clear cache

4. **Verify Setup**
   - Models downloaded?
   - Firebase rules updated?
   - Internet connected?
   - Camera permissions granted?

---

## ✅ Success Checklist

Before asking for help, verify:

- [ ] Models downloaded (`pnpm download-models`)
- [ ] Firebase rules updated (see FIX_FIREBASE_PERMISSIONS.md)
- [ ] Camera permissions granted
- [ ] Using Chrome or Edge browser
- [ ] Internet connection active
- [ ] No console errors (F12)
- [ ] Tried hard refresh (Ctrl+Shift+R)
- [ ] Tested in different browser

---

## 📞 Quick Links

- [Firebase Console](https://console.firebase.google.com/project/face-recoginition-de3f4)
- [Firestore Rules](https://console.firebase.google.com/project/face-recoginition-de3f4/firestore/rules)
- [Firestore Data](https://console.firebase.google.com/project/face-recoginition-de3f4/firestore/data)
- [MediaPipe Docs](https://developers.google.com/mediapipe)

---

**Most issues are solved by:**
1. ✅ Updating Firebase rules
2. ✅ Downloading models
3. ✅ Allowing camera permissions
4. ✅ Using Chrome/Edge browser

