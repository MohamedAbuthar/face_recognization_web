'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerFace, serializeImageData } from '../../lib/backendApi';
import mediaPipeClient, { FaceBox, FaceLandmarks } from '../../lib/mediapipeClient';
import CameraView from '../../components/CameraView';
import FaceDetectorCanvas from '../../components/FaceDetectorCanvas';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [boxes, setBoxes] = useState<FaceBox[]>([]);
  const [landmarks, setLandmarks] = useState<FaceLandmarks[]>([]);
  const [capturedData, setCapturedData] = useState<{
    landmarks: FaceLandmarks;
    imageData: ImageData;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [initializingMediaPipe, setInitializingMediaPipe] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [fps, setFps] = useState(0);
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false);
  const [showMultipleFacesDialog, setShowMultipleFacesDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<number>(0);
  const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-save when name is entered after face is captured
  useEffect(() => {
    if (capturedData && name.trim() && !success && !loading) {
      const timer = setTimeout(async () => {
        await registerToBackend(name.trim(), capturedData.landmarks, capturedData.imageData);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [name, capturedData, success, loading]);

  const startCamera = async () => {
    if (!name.trim()) {
      setError('Please enter your name first');
      return;
    }
    
    try {
      setError(null);
      setShowCameraDialog(true);
      setInitializingMediaPipe(true);

      // Initialize MediaPipe
      await mediaPipeClient.initialize();
      setInitializingMediaPipe(false);
        setCameraActive(true);
    } catch (err) {
      setError('Failed to initialize face detection. Please refresh and try again.');
      setShowCameraDialog(false);
      setInitializingMediaPipe(false);
      console.error('MediaPipe initialization error:', err);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    setCameraActive(false);
    setShowCameraDialog(false);
    setBoxes([]);
    setLandmarks([]);
    setFaceDetected(false);
  };

  const handleVideoReady = (video: HTMLVideoElement) => {
    videoRef.current = video;
    startDetectionLoop();
    startFpsCounter();
  };

  const startFpsCounter = () => {
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
    }
    fpsIntervalRef.current = setInterval(() => {
      setFps(fpsCounterRef.current);
      fpsCounterRef.current = 0;
    }, 1000);
  };

  const startDetectionLoop = () => {
    const detectFrame = async (timestamp: number) => {
      if (!videoRef.current || !cameraActive) return;

      // Check if MediaPipe is initialized
      if (!mediaPipeClient.isInitialized()) {
        console.warn('MediaPipe not ready, skipping frame');
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      try {
        // Detect faces and landmarks
        const result = await mediaPipeClient.detectFacesAndLandmarks(
          videoRef.current,
          timestamp
        );

        setBoxes(result.boxes);
        setLandmarks(result.landmarks);
        setFaceDetected(result.boxes.length > 0);
        
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

        // Auto-capture face data when detected with landmarks
        // Only capture if exactly one face is detected
        if (result.boxes.length === 1 && result.landmarks.length > 0 && !capturedData && !loading) {
          const bestBox = result.boxes.reduce((prev, current) =>
            current.score > prev.score ? current : prev
          );
          // Capture landmarks and image data
          await captureFaceData(bestBox, result.landmarks[0]);
        }

        // FPS counter
        fpsCounterRef.current++;
      } catch (err) {
        console.error('Detection error:', err);
      }

      lastFrameTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  const captureFaceData = async (box: FaceBox, detectedLandmarks: FaceLandmarks) => {
    if (!videoRef.current || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Validate landmarks
      if (!detectedLandmarks || !detectedLandmarks.points || detectedLandmarks.points.length < 468) {
        setError('Insufficient facial landmarks detected. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ Capturing face data with', detectedLandmarks.points.length, 'landmarks');

      // Extract face region as ImageData
      const faceImageData = mediaPipeClient.extractFaceRegion(
        videoRef.current,
        box,
        0.2
      );

      console.log('✅ Face image captured:', faceImageData.width, 'x', faceImageData.height);
      
      // Store captured data
      setCapturedData({
        landmarks: detectedLandmarks,
        imageData: faceImageData,
      });
      
      // Stop detection loop once we have face data
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } catch (err) {
      console.error('❌ Face capture error:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture face data');
    } finally {
      setLoading(false);
    }
  };

  const registerToBackend = async (
    userName: string,
    landmarks: FaceLandmarks,
    imageData: ImageData
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Prepare landmarks for backend (take first 468 points only)
      // MediaPipe sometimes returns 478 landmarks (468 face + 10 iris)
      const landmarksToSend = landmarks.points.slice(0, 468);
      const landmarksPayload = {
        points: landmarksToSend.map(p => ({ x: p.x, y: p.y, z: p.z || 0 })),
      };

      console.log('📤 Sending registration request to backend...');
      console.log('   User name:', userName);
      console.log('   Detected landmarks:', landmarks.points.length);
      console.log('   Landmarks to send:', landmarksPayload.points.length, 'points (first 468)');
      console.log('   First landmark:', landmarksPayload.points[0]);
      console.log('   Image size:', imageData.width, 'x', imageData.height);

      // Call backend API
      const response = await registerFace({
        name: userName,
        landmarks: landmarksPayload,
        faceImageData: serializeImageData(imageData),
      });

      if (response.success) {
        console.log('✅ Registration successful!', response);
      setSuccess(true);
      stopCamera();
      
      setTimeout(() => {
        router.push('/recognize');
      }, 2000);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register face');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!capturedData) {
      setError('No face data captured. Please try again.');
      return;
    }

    await registerToBackend(name.trim(), capturedData.landmarks, capturedData.imageData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Register Face
            </h1>
            <button
              onClick={() => router.push('/recognize')}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Go to Recognize →
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-2">
                Registration Successful!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to recognition page...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <button
                  onClick={startCamera}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !name.trim() || initializingMediaPipe}
                >
                  {initializingMediaPipe ? 'Initializing...' : 'Start Face Recognition'}
                </button>
              </div>

              {/* Camera Dialog Modal */}
              {showCameraDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold text-white">
                        Face Recognition Camera
                      </h3>
                        <div className="text-sm text-gray-400">
                          FPS: {fps}
                        </div>
                      </div>
                      <button
                        onClick={stopCamera}
                        className="text-gray-400 hover:text-white transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Camera View */}
                    <div className="relative bg-black" style={{ height: '70vh', minHeight: '400px' }}>
                      {initializingMediaPipe ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                            <p className="mt-2 text-white">Initializing MediaPipe...</p>
                          </div>
                      </div>
                      ) : (
                        <>
                          <CameraView
                            onVideoReady={handleVideoReady}
                            onError={(err) => setError(err.message)}
                            mirror={true}
                            showGuide={!faceDetected}
                            guideText="Position your face in the oval"
                            className="w-full h-full"
                          />

                          {videoRef.current && (
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
                          )}

                          {multipleFacesDetected && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                              <span className="text-xl">⚠️</span>
                              <span className="font-medium">Multiple Faces Detected - Show Only One Face</span>
                            </div>
                          )}

                          {faceDetected && !multipleFacesDetected && (
                          <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            <span className="font-medium">Face Detected</span>
                          </div>
                      )}

                          {loading && !capturedData && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                            <p className="mt-2 text-white">Processing face...</p>
                          </div>
                        </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-800 px-6 py-4">
                      {capturedData ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-900/30 rounded-lg border border-green-500">
                            <p className="text-green-400 font-medium text-center">
                              ✓ Face captured successfully!
                            </p>
                          </div>
                          <p className="text-gray-300 text-sm text-center">
                            Saving to database...
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-300">
                            {multipleFacesDetected
                              ? '⚠️ Multiple faces detected - please show only one face'
                              : faceDetected
                              ? 'Hold still while we capture your face...' 
                              : 'Position your face in the frame'}
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Powered by MediaPipe Face Detection & Face Mesh
                        </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {capturedData && !showCameraDialog && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✓ Face embedding computed successfully
                  </p>
                  {name.trim() && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      Face will be saved automatically, or click Register below.
                    </p>
                  )}
                </div>
              )}

              {loading && !capturedData && (
                <div className="mb-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Processing face...
                  </p>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={!name.trim() || !capturedData || loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register Face'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Multiple Faces Dialog */}
        {showMultipleFacesDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Multiple Faces Detected
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please ensure only one person is visible in the camera frame. Multiple faces cannot be registered at the same time.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-2">
                      📋 Instructions
                    </p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-500 text-left space-y-1">
                      <li>• Make sure only one person is in front of the camera</li>
                      <li>• Ask others to step out of the frame</li>
                      <li>• Position yourself in the center of the oval guide</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMultipleFacesDialog(false);
                    setMultipleFacesDetected(false);
                    // Restart detection loop
                    if (videoRef.current) {
                      startDetectionLoop();
                    }
                  }}
                  className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Got It - Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
