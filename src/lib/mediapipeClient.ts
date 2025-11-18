/**
 * MediaPipe Face Detection and Face Mesh Client
 * Handles initialization and detection using MediaPipe Tasks Vision
 */

import {
  FaceDetector,
  FaceLandmarker,
  FilesetResolver,
  Detection,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision';

// Types for our results
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface FaceLandmarks {
  points: Array<{ x: number; y: number; z?: number }>;
}

export interface FaceDetectionResult {
  boxes: FaceBox[];
  landmarks: FaceLandmarks[];
}

class MediaPipeClient {
  private faceDetector: FaceDetector | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private wasmLoaded = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize MediaPipe WASM and models
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing MediaPipe...');

      // Load WASM files
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      );

      this.wasmLoaded = true;
      console.log('WASM loaded successfully');

      // Initialize Face Detector
      this.faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });

      console.log('Face Detector initialized');

      // Initialize Face Landmarker (468 landmarks)
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 5,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      console.log('Face Landmarker initialized');
      console.log('MediaPipe initialization complete');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Detect faces in a video frame
   */
  async detectFaces(
    video: HTMLVideoElement,
    timestamp?: number
  ): Promise<Detection[]> {
    if (!this.faceDetector) {
      console.warn('Face detector not initialized');
      return [];
    }

    try {
      const ts = timestamp ?? performance.now();
      const result = this.faceDetector.detectForVideo(video, ts);
      return result.detections || [];
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  }

  /**
   * Detect face landmarks (468 points)
   */
  async detectLandmarks(
    video: HTMLVideoElement,
    timestamp?: number
  ): Promise<{
    faceLandmarks: NormalizedLandmark[][];
    faceBlendshapes: any[];
    facialTransformationMatrixes: any[];
  }> {
    if (!this.faceLandmarker) {
      console.warn('Face landmarker not initialized');
      return {
        faceLandmarks: [],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };
    }

    try {
      const ts = timestamp ?? performance.now();
      const result = this.faceLandmarker.detectForVideo(video, ts);
      
      return {
        faceLandmarks: result.faceLandmarks || [],
        faceBlendshapes: result.faceBlendshapes || [],
        facialTransformationMatrixes: result.facialTransformationMatrixes || [],
      };
    } catch (error) {
      console.error('Error detecting landmarks:', error);
      return {
        faceLandmarks: [],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };
    }
  }

  /**
   * Combined detection - returns both boxes and landmarks
   */
  async detectFacesAndLandmarks(
    video: HTMLVideoElement,
    timestamp?: number
  ): Promise<FaceDetectionResult> {
    // Check if initialized
    if (!this.isInitialized()) {
      console.warn('MediaPipe not fully initialized');
      return { boxes: [], landmarks: [] };
    }

    try {
      const ts = timestamp ?? performance.now();

      const [detections, landmarkResult] = await Promise.all([
        this.detectFaces(video, ts),
        this.detectLandmarks(video, ts),
      ]);

      // Convert detections to our format
      const boxes: FaceBox[] = detections.map((detection) => {
        const bbox = detection.boundingBox;
        return {
          x: bbox?.originX || 0,
          y: bbox?.originY || 0,
          width: bbox?.width || 0,
          height: bbox?.height || 0,
          score: detection.categories?.[0]?.score || 0,
        };
      });

      // Convert landmarks to our format
      const landmarks: FaceLandmarks[] = landmarkResult.faceLandmarks.map(
        (faceLandmarks) => ({
          points: faceLandmarks.map((landmark) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
          })),
        })
      );

      return { boxes, landmarks };
    } catch (error) {
      console.error('Error in detectFacesAndLandmarks:', error);
      return { boxes: [], landmarks: [] };
    }
  }

  /**
   * Get face embedding from detected face region
   * This extracts the face region and returns it as ImageData
   */
  extractFaceRegion(
    video: HTMLVideoElement,
    box: FaceBox,
    padding: number = 0.2
  ): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Add padding
    const paddingX = box.width * padding;
    const paddingY = box.height * padding;

    const x = Math.max(0, box.x - paddingX);
    const y = Math.max(0, box.y - paddingY);
    const width = Math.min(
      video.videoWidth - x,
      box.width + paddingX * 2
    );
    const height = Math.min(
      video.videoHeight - y,
      box.height + paddingY * 2
    );

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      video,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height
    );

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Check if MediaPipe is initialized
   */
  isInitialized(): boolean {
    return this.wasmLoaded && this.faceDetector !== null && this.faceLandmarker !== null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.faceDetector) {
      this.faceDetector.close();
      this.faceDetector = null;
    }
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.wasmLoaded = false;
    this.initPromise = null;
  }
}

// Singleton instance
export const mediaPipeClient = new MediaPipeClient();

// Export for convenience
export default mediaPipeClient;

