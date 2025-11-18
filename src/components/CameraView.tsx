'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { FaceBox, FaceLandmarks } from '../lib/mediapipeClient';

export interface CameraViewProps {
  onFaceDetect?: (boxes: FaceBox[]) => void;
  onLandmarks?: (landmarks: FaceLandmarks[]) => void;
  onVideoReady?: (video: HTMLVideoElement) => void;
  onError?: (error: Error) => void;
  mirror?: boolean;
  className?: string;
  showGuide?: boolean;
  guideText?: string;
}

/**
 * CameraView Component
 * Handles camera streaming and provides video element for detection
 */
export default function CameraView({
  onFaceDetect,
  onLandmarks,
  onVideoReady,
  onError,
  mirror = true,
  className = '',
  showGuide = true,
  guideText = 'Position your face in the oval',
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  /**
   * Initialize camera stream
   */
  const initCamera = useCallback(async () => {
    try {
      console.log('Requesting camera access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Camera started successfully');
              setIsReady(true);
              
              // Notify parent component
              if (onVideoReady && videoRef.current) {
                onVideoReady(videoRef.current);
              }
            }).catch((err) => {
              console.error('Error playing video:', err);
              const error = new Error('Failed to play video');
              setError(error.message);
              onError?.(error);
            });
          }
        };

        videoRef.current.onerror = (err) => {
          console.error('Video error:', err);
          const error = new Error('Video stream error');
          setError(error.message);
          onError?.(error);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      const error = err instanceof Error ? err : new Error('Failed to access camera');
      setError(error.message);
      setHasPermission(false);
      onError?.(error);
    }
  }, [onVideoReady, onError]);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsReady(false);
    setHasPermission(false);
  }, []);

  /**
   * Initialize camera on mount
   */
  useEffect(() => {
    initCamera();

    return () => {
      stopCamera();
    };
  }, [initCamera, stopCamera]);

  return (
    <div className={`relative ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
        style={{
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Guide Overlay */}
      {showGuide && isReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="border-2 border-dashed border-gray-400 rounded-full transition-all duration-300"
            style={{
              width: 'min(320px, 60vw)',
              height: 'min(400px, 70vh)',
              opacity: 0.6,
            }}
          />
        </div>
      )}

      {/* Loading State */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-2 text-white">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={initCamera}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Guide Text */}
      {showGuide && isReady && guideText && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {guideText}
        </div>
      )}
    </div>
  );
}

