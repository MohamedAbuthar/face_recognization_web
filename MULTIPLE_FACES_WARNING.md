# Multiple Faces Detection - Dialog Implementation

## Overview
Added validation to detect when multiple faces are shown in the camera and display a **dialog popup** to users (similar to the unregistered face dialog). The system now only allows one face at a time for registration and recognition.

## Changes Made

### 1. Register Page (`src/app/register/page.tsx`)
- Added `multipleFacesDetected` state to track when more than one face is detected
- Added `showMultipleFacesDialog` state to control dialog visibility
- Modified face detection logic to only capture face data when exactly **one face** is detected
- Added dialog popup that appears immediately when multiple faces are detected
- Detection loop pauses when dialog is shown
- Updated footer message and visual indicators

### 2. Recognize Page (`src/app/recognize/page.tsx`)
- Added `multipleFacesDetected` state to track when more than one face is detected
- Added `showMultipleFacesDialog` state to control dialog visibility
- Modified face recognition logic to only process when exactly **one face** is detected
- Added dialog popup that appears immediately when multiple faces are detected
- Detection loop pauses when dialog is shown
- Updated footer message and visual indicators

## Features

### Dialog Popup (Main Feature)
**Multiple Faces Dialog** - Shows immediately when 2+ faces detected:
- **Large Warning Icon**: ⚠️ emoji (60px)
- **Title**: "Multiple Faces Detected"
- **Description**: Clear explanation that only one person should be visible
- **Instructions Box** (Yellow background):
  - 📋 Instructions header
  - Bullet points with clear steps:
    - Make sure only one person is in front of the camera
    - Ask others to step out of the frame
    - Position yourself in the center of the oval guide
- **Action Button**: "Got It - Continue" (Blue button)
  - Closes dialog
  - Restarts detection loop
  - Clears multiple faces flag

### Visual Indicators (In Camera View)
1. **Multiple Faces Warning (Red Badge)** - Top center of camera
   - Red background with warning emoji (⚠️)
   - Animated pulse effect
   - Message: "Multiple Faces Detected - Show Only One Face"

2. **Single Face Detected (Green Badge)**
   - Only shown when exactly one face is detected
   - Green background with checkmark (✓)
   - Message: "Face Detected" (Register) or "Detecting..." (Recognize)

### Behavior Changes

#### Registration Page
- **Before**: Would capture face data even if multiple faces were detected
- **After**: 
  - Only captures face data when exactly one face is detected
  - Shows dialog popup immediately when multiple faces detected
  - Pauses detection until user acknowledges
- **User Guidance**: Dialog with clear instructions

#### Recognition Page
- **Before**: Would attempt to recognize even if multiple faces were detected
- **After**: 
  - Only processes recognition when exactly one face is detected
  - Shows dialog popup immediately when multiple faces detected
  - Pauses detection until user acknowledges
- **User Guidance**: Dialog with clear instructions

## User Experience Flow

### When Multiple Faces Detected:
1. **Immediate**: System detects multiple faces
2. **Dialog appears**: Full-screen popup with warning and instructions
3. **Detection pauses**: Camera view freezes, no processing occurs
4. **User action**: Reads instructions and clicks "Got It - Continue"
5. **Resume**: Dialog closes, detection restarts, user can correct the issue
6. **Visual feedback**: Red warning badge remains visible until only one face is shown

### When One Face Detected:
1. Green success badge appears (Register) or blue detecting badge (Recognize)
2. Normal processing continues
3. Face capture/recognition proceeds automatically
4. Dialog will not appear again unless multiple faces are detected

## Technical Implementation

### Detection Logic
```typescript
// Handle multiple faces detection
if (result.boxes.length > 1) {
  setMultipleFacesDetected(true);
  // Show dialog and pause detection
  if (!showMultipleFacesDialog) {
    setShowMultipleFacesDialog(true);
    // Pause detection loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }
} else {
  setMultipleFacesDetected(false);
}

// Only process when exactly one face
if (result.boxes.length === 1 && result.landmarks.length > 0) {
  // Process face...
}
```

### Dialog Component
- **Full-screen overlay**: Semi-transparent black background (z-index: 50)
- **Centered modal**: White card with rounded corners and shadow
- **Responsive**: Works on all screen sizes with padding
- **Dark mode support**: Automatic theme switching
- **Styled with Tailwind CSS**: Professional appearance
- **Accessible**: Clear visual hierarchy and readable text
- **Consistent design**: Matches unregistered face dialog style

### UI Components
- Dialog positioned center screen with full overlay
- Warning badge positioned at top center of camera view
- Uses Tailwind CSS classes for styling and animation
- Conditional rendering based on face count and dialog state
- Responsive design that works on all screen sizes

## Benefits

1. **Improved Accuracy**: Ensures only one person is registered/recognized at a time
2. **Better User Experience**: Clear dialog with instructions (like unregistered face dialog)
3. **Data Quality**: Prevents confusion in the database with multiple faces
4. **Security**: Ensures only one person is authenticated at a time
5. **User Guidance**: Step-by-step instructions in the dialog
6. **Professional UI**: Consistent with other dialogs in the app
7. **Immediate Feedback**: Dialog appears instantly when issue is detected

## Testing

To test the feature:

### Test Case 1: Dialog Appears
1. Open Register or Recognize page
2. Position two or more people in front of the camera
3. ✅ Verify dialog popup appears immediately with warning icon
4. ✅ Verify dialog shows instructions box with bullet points
5. ✅ Verify detection is paused (camera frozen)
6. ✅ Verify red warning badge is visible in camera view
7. Click "Got It - Continue"
8. ✅ Verify dialog closes and detection resumes

### Test Case 2: After Closing Dialog
1. After closing the dialog, keep multiple faces in view
2. ✅ Verify red warning badge remains visible
3. ✅ Verify footer shows: "⚠️ Multiple faces detected - please show only one face"
4. ✅ Verify face capture/recognition is still blocked
5. Remove extra people until only one remains
6. ✅ Verify warning badge disappears
7. ✅ Verify processing continues normally

### Test Case 3: Register Page Specific
1. Open Register page with name entered
2. Show multiple faces
3. ✅ Verify dialog appears
4. ✅ Verify face data is NOT captured
5. Close dialog and show only one face
6. ✅ Verify face is captured automatically

### Test Case 4: Recognize Page Specific
1. Open Recognize page
2. Show multiple faces
3. ✅ Verify dialog appears
4. ✅ Verify recognition does NOT run
5. Close dialog and show only one face
6. ✅ Verify recognition starts automatically

## No Breaking Changes

- All existing functionality remains intact
- No changes to API calls or backend
- No changes to face detection algorithms
- Only added validation and UI feedback
- Backward compatible with existing data

