'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { recognizeFace as recognizeFaceAPI, listFaces, serializeImageData } from '../../lib/backendApi';
import mediaPipeClient, { FaceBox, FaceLandmarks } from '../../lib/mediapipeClient';
import CameraView from '../../components/CameraView';
import FaceDetectorCanvas from '../../components/FaceDetectorCanvas';

export default function RecognizePage() {
  const router = useRouter();
  const [cameraActive, setCameraActive] = useState(false);
  const [boxes, setBoxes] = useState<FaceBox[]>([]);
  const [landmarks, setLandmarks] = useState<FaceLandmarks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedUser, setRecognizedUser] = useState<{
    id: string;
    name: string;
    createdAt: string;
    similarity?: number;
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [registeredFacesCount, setRegisteredFacesCount] = useState(0);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [initializingMediaPipe, setInitializingMediaPipe] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [fps, setFps] = useState(0);
  const [unregisteredFace, setUnregisteredFace] = useState(false);
  const [showUnregisteredDialog, setShowUnregisteredDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRecognitionTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<number>(0);
  const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRegisteredFacesCount();
    // Auto-start camera when page loads
    setTimeout(() => {
      startCamera();
    }, 500);
    return () => {
      stopCamera();
    };
  }, []);

  const loadRegisteredFacesCount = async () => {
    try {
      const response = await listFaces();
      setRegisteredFacesCount(response.count);
      console.log(`📊 ${response.count} registered faces in database`);
    } catch (err) {
      console.error('Failed to load faces count:', err);
      setError('Failed to load registered faces');
    }
  };

  const startCamera = async () => {
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

        // Recognize face every 2 seconds when landmarks are detected
        // Don't recognize if showing unregistered face message
        const timeSinceLastRecognition = timestamp - lastRecognitionTimeRef.current;
        if (
          result.boxes.length > 0 &&
          result.landmarks.length > 0 &&
          !loading &&
          !recognizedUser &&
          !unregisteredFace &&
          timeSinceLastRecognition > 2000
        ) {
          lastRecognitionTimeRef.current = timestamp;
          const bestBox = result.boxes.reduce((prev, current) =>
            current.score > prev.score ? current : prev
          );
          // Pass landmarks directly to avoid race condition
          await recognizeFace(bestBox, result.landmarks[0]);
        }

        // FPS counter
        fpsCounterRef.current++;
      } catch (err) {
        console.error('Detection error:', err);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  const recognizeFace = async (box: FaceBox, detectedLandmarks: FaceLandmarks) => {
    if (!videoRef.current || loading || recognizedUser) return;

    setLoading(true);
    setError(null);

    try {
      // Validate landmarks
      if (!detectedLandmarks || !detectedLandmarks.points || detectedLandmarks.points.length < 468) {
        console.log('Insufficient landmarks detected, skipping recognition');
        setLoading(false);
        return;
      }

      console.log('✅ Recognizing face with', detectedLandmarks.points.length, 'landmarks');

      // Extract face region as ImageData
      const faceImageData = mediaPipeClient.extractFaceRegion(
        videoRef.current,
        box,
        0.2
      );

      // Prepare landmarks for backend (take first 468 points only)
      // MediaPipe sometimes returns 478 landmarks (468 face + 10 iris)
      const landmarksToSend = detectedLandmarks.points.slice(0, 468);
      const landmarksPayload = {
        points: landmarksToSend.map(p => ({ x: p.x, y: p.y, z: p.z || 0 })),
      };

      console.log('📤 Sending recognition request to backend...');
      console.log('   Detected landmarks:', detectedLandmarks.points.length);
      console.log('   Landmarks to send:', landmarksPayload.points.length, 'points (first 468)');
      console.log('   First landmark:', landmarksPayload.points[0]);

      // Call backend API for recognition
      const response = await recognizeFaceAPI({
        landmarks: landmarksPayload,
        faceImageData: serializeImageData(faceImageData),
      });

      console.log('📥 Backend response:', response);

      if (response.success && response.match) {
        console.log(`✅ Face recognized: ${response.match.name} (similarity: ${(response.match.similarity * 100).toFixed(1)}%)`);
        
        // Clear unregistered flag if previously set
        setUnregisteredFace(false);
        setError(null);
        
        setRecognizedUser(response.match);
        setShowDialog(true);
        
        // Stop detection loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        console.log('❌ No match found - unregistered face');
        setUnregisteredFace(true);
        setShowUnregisteredDialog(true);
        
        // Stop detection loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    } catch (err) {
      console.error('❌ Recognition error:', err);
      setError(err instanceof Error ? err.message : 'Recognition failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setRecognizedUser(null);
    setUnregisteredFace(false);
    setError(null);

    // Restart detection after a delay
    setTimeout(() => {
      if (videoRef.current) {
        lastRecognitionTimeRef.current = 0;
        startDetectionLoop();
      }
    }, 1000);
  };

  const handleCloseUnregisteredDialog = () => {
    setShowUnregisteredDialog(false);
    setUnregisteredFace(false);
    setError(null);
    
    // Restart detection after a delay
    setTimeout(() => {
      if (videoRef.current) {
        lastRecognitionTimeRef.current = 0;
        startDetectionLoop();
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Face Recognition
            </h1>
            <button
              onClick={() => router.push('/register')}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              ← Register New Face
            </button>
          </div>

          {/* Camera Dialog Modal */}
          {showCameraDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold text-white">
                      Face Recognition
                    </h3>
                      <div className="text-sm text-gray-400">
                        FPS: {fps}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Ready - {registeredFacesCount} {registeredFacesCount === 1 ? 'user' : 'users'} registered
                    </p>
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
                          boxColor={recognizedUser ? '#10b981' : '#3b82f6'}
                          landmarkColor="#06b6d4"
                              />
                      )}
                          
                          {recognizedUser && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                              <span className="text-lg">✓</span>
                              <span className="font-medium">Recognized: {recognizedUser.name}</span>
                            </div>
                          )}
                          
                      {faceDetected && !recognizedUser && !error && !unregisteredFace && (
                            <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                              <span className="text-lg">🔍</span>
                              <span className="font-medium">Detecting...</span>
                            </div>
                          )}

                      {unregisteredFace && !recognizedUser && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                          <span className="text-lg">❌</span>
                          <span className="font-medium">Unregistered Face</span>
                        </div>
                      )}

                      {loading && !recognizedUser && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                            <p className="mt-2 text-white">Recognizing face...</p>
                          </div>
                        </div>
                      )}
                    </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-800 px-6 py-4">
                  <div className="text-center">
                    <p className="text-gray-300">
                        {recognizedUser 
                          ? 'Face recognized successfully!' 
                        : faceDetected
                          ? 'Analyzing face...' 
                        : 'Position your face in the frame'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Powered by MediaPipe Face Detection & Face Mesh
                      </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!cameraActive && !showCameraDialog && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Camera is starting...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Recognition Dialog - Success */}
          {showDialog && recognizedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Face Recognized!
                  </h2>
                  <div className="mt-6 space-y-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Name
                      </p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {recognizedUser.name}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Registered On
                      </p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {new Date(recognizedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Continue Recognition
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unregistered Face Dialog */}
          {showUnregisteredDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Unregistered Face
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    This face is not registered in the system. Please register first to use face recognition.
                  </p>
                  <div className="mt-6 space-y-3">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        ⚠️ Face Not Found
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-500">
                        No matching face found in database. Similarity scores were below 80% threshold.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => router.push('/register')}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Register Now
                    </button>
                    <button
                      onClick={handleCloseUnregisteredDialog}
                      className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
