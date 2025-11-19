# Multiple Faces Dialog - Visual Example

## Dialog Appearance

When multiple faces are detected, this dialog appears:

```
┌─────────────────────────────────────────────────────────┐
│                    [Dark Overlay]                        │
│                                                          │
│         ┌───────────────────────────────────┐           │
│         │                                   │           │
│         │              ⚠️                    │           │
│         │                                   │           │
│         │    Multiple Faces Detected        │           │
│         │                                   │           │
│         │  Please ensure only one person    │           │
│         │  is visible in the camera frame.  │           │
│         │  Multiple faces cannot be         │           │
│         │  registered/recognized at the     │           │
│         │  same time.                       │           │
│         │                                   │           │
│         │  ┌─────────────────────────────┐  │           │
│         │  │   📋 Instructions           │  │           │
│         │  │                             │  │           │
│         │  │  • Make sure only one       │  │           │
│         │  │    person is in front of    │  │           │
│         │  │    the camera               │  │           │
│         │  │  • Ask others to step out   │  │           │
│         │  │    of the frame             │  │           │
│         │  │  • Position yourself in     │  │           │
│         │  │    the center of the oval   │  │           │
│         │  │    guide                    │  │           │
│         │  └─────────────────────────────┘  │           │
│         │                                   │           │
│         │  ┌─────────────────────────────┐  │           │
│         │  │   Got It - Continue         │  │           │
│         │  └─────────────────────────────┘  │           │
│         │                                   │           │
│         └───────────────────────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Color Scheme

### Dialog Box
- **Background**: White (light mode) / Dark Gray (#1F2937 - dark mode)
- **Shadow**: Large shadow (shadow-xl)
- **Border Radius**: Rounded corners (rounded-lg)
- **Padding**: 24px (p-6)

### Warning Icon
- **Size**: 60px (text-6xl)
- **Emoji**: ⚠️
- **Margin**: 16px bottom

### Title
- **Text**: "Multiple Faces Detected"
- **Size**: 24px (text-2xl)
- **Weight**: Bold (font-bold)
- **Color**: Gray-800 (light) / White (dark)

### Description
- **Color**: Gray-600 (light) / Gray-400 (dark)
- **Size**: 16px (base)
- **Margin**: 24px bottom

### Instructions Box
- **Background**: Yellow-50 (light) / Yellow-900/20 (dark)
- **Border**: Yellow-200 (light) / Yellow-800 (dark)
- **Padding**: 16px (p-4)
- **Border Radius**: Rounded (rounded-lg)

### Instructions Header
- **Text**: "📋 Instructions"
- **Color**: Yellow-800 (light) / Yellow-400 (dark)
- **Size**: 14px (text-sm)

### Bullet Points
- **Color**: Yellow-700 (light) / Yellow-500 (dark)
- **Size**: 12px (text-xs)
- **Spacing**: 4px between items

### Button
- **Background**: Blue-600
- **Hover**: Blue-700
- **Text**: White
- **Padding**: 12px vertical, 24px horizontal
- **Border Radius**: Rounded (rounded-lg)
- **Width**: Full width
- **Font**: Medium weight

### Overlay
- **Background**: Black with 50% opacity
- **Z-Index**: 50 (appears above camera)

## Behavior

### When Dialog Appears:
1. Camera view is still visible in background (frozen)
2. Face detection boxes remain visible
3. Dialog appears with fade-in effect
4. User cannot interact with camera until dialog is closed
5. Detection loop is paused

### When User Clicks "Got It - Continue":
1. Dialog closes with fade-out
2. Detection loop restarts
3. Camera becomes interactive again
4. If multiple faces still present, red warning badge appears
5. If only one face, processing continues normally

## Comparison with Unregistered Face Dialog

Both dialogs share the same design pattern:

| Feature | Multiple Faces Dialog | Unregistered Face Dialog |
|---------|----------------------|--------------------------|
| Icon | ⚠️ (Warning) | ❌ (Error) |
| Color Scheme | Yellow (Warning) | Red (Error) |
| Instructions Box | Yes (Yellow) | Yes (Red) |
| Action Buttons | 1 (Continue) | 2 (Register/Try Again) |
| Auto-close | No | No |
| Pauses Detection | Yes | Yes |
| Full-screen Overlay | Yes | Yes |
| Dark Mode Support | Yes | Yes |

## Frontend Implementation Only

**Note**: This feature is implemented entirely in the frontend. No backend changes are required because:

1. **Client-side Detection**: MediaPipe detects faces in the browser
2. **Client-side Validation**: Face count check happens before API calls
3. **UI Only**: Dialog is a pure UI component
4. **Prevention Logic**: Blocks API calls when multiple faces detected
5. **No Server Involvement**: Backend never receives multiple face data

The backend APIs (`/api/faces/register` and `/api/faces/recognize`) continue to work as before. The frontend simply ensures only single-face data is sent to them.

## Code Location

### Register Page
- File: `src/app/register/page.tsx`
- Lines: ~482-521 (Dialog component)
- Lines: ~130-143 (Detection logic)

### Recognize Page
- File: `src/app/recognize/page.tsx`
- Lines: ~520-561 (Dialog component)
- Lines: ~135-148 (Detection logic)

## User Flow Example

### Scenario: User tries to register with friend nearby

1. **User enters name**: "John Doe"
2. **Clicks "Start Face Recognition"**: Camera opens
3. **Both John and friend visible**: MediaPipe detects 2 faces
4. **Dialog appears immediately**: "Multiple Faces Detected"
5. **User reads instructions**: Understands what to do
6. **Clicks "Got It - Continue"**: Dialog closes
7. **Friend steps away**: Now only John is visible
8. **System detects 1 face**: Green badge appears
9. **Face captured automatically**: Registration proceeds
10. **Success**: "Registration Successful!"

This provides a smooth, guided experience that prevents errors before they happen.

