// Web Worker for ONNX model inference
import * as ort from 'onnxruntime-web';
import {
  FaceDetection,
  BoundingBox,
  KeyPoint,
  WorkerMessage,
  DetectionRequest,
  EmbeddingRequest,
} from './types';

// Worker context
declare const self: DedicatedWorkerGlobalScope;

let detectionSession: ort.InferenceSession | null = null;
let recognitionSession: ort.InferenceSession | null = null;
let isInitialized = false;

// Initialize ONNX Runtime with WebGPU fallback to WASM
async function initializeONNX() {
  try {
    // Try WebGPU first, fallback to WASM
    const executionProviders = ['webgpu', 'wasm'];
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    return executionProviders;
  } catch (error) {
    console.warn('WebGPU not available, using WASM');
    return ['wasm'];
  }
}

// Load detection model (SCRFD)
async function loadDetectionModel(): Promise<ort.InferenceSession> {
  const executionProviders = await initializeONNX();
  const modelPath = '/models/scrfd_2.5g_kps.onnx';
  
  try {
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders,
    });
    return session;
  } catch (error) {
    throw new Error(`Failed to load detection model: ${error}`);
  }
}

// Load recognition model (ArcFace R100)
async function loadRecognitionModel(): Promise<ort.InferenceSession> {
  const executionProviders = await initializeONNX();
  const modelPath = '/models/glintr100.onnx';
  
  try {
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders,
    });
    return session;
  } catch (error) {
    throw new Error(`Failed to load recognition model: ${error}`);
  }
}

// Preprocess image for detection
function preprocessDetection(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const inputSize = 640; // SCRFD input size
  const scale = Math.min(inputSize / width, inputSize / height);
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);
  
  const canvas = new OffscreenCanvas(inputSize, inputSize);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, inputSize, inputSize);
  
  // Create temporary canvas for resizing
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw resized image
  ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
  const resizedData = ctx.getImageData(0, 0, inputSize, inputSize);
  
  const input = new Float32Array(3 * inputSize * inputSize);
  const mean = [127.5, 127.5, 127.5];
  const std = [128.0, 128.0, 128.0];
  
  for (let i = 0; i < inputSize * inputSize; i++) {
    const r = resizedData.data[i * 4];
    const g = resizedData.data[i * 4 + 1];
    const b = resizedData.data[i * 4 + 2];
    
    input[i] = (r - mean[0]) / std[0];
    input[i + inputSize * inputSize] = (g - mean[1]) / std[1];
    input[i + 2 * inputSize * inputSize] = (b - mean[2]) / std[2];
  }
  
  return input;
}

// Detect faces using SCRFD
async function detectFaces(imageData: ImageData): Promise<FaceDetection[]> {
  if (!detectionSession) {
    detectionSession = await loadDetectionModel();
  }
  
  const input = preprocessDetection(imageData);
  const tensor = new ort.Tensor('float32', input, [1, 3, 640, 640]);
  
  const feeds = { [detectionSession.inputNames[0]]: tensor };
  const results = await detectionSession.run(feeds);
  
  // Parse SCRFD outputs (bboxes, scores, keypoints)
  const bboxes = results[detectionSession.outputNames[0]].data as Float32Array;
  const scores = results[detectionSession.outputNames[1]]?.data as Float32Array;
  const keypoints = results[detectionSession.outputNames[2]]?.data as Float32Array;
  
  const detections: FaceDetection[] = [];
  const numDetections = Math.min(bboxes.length / 4, 100);
  
  for (let i = 0; i < numDetections; i++) {
    const score = scores?.[i] || bboxes[i * 4 + 4];
    if (score < 0.5) continue;
    
    const x1 = bboxes[i * 4] / (640 / imageData.width);
    const y1 = bboxes[i * 4 + 1] / (640 / imageData.height);
    const x2 = bboxes[i * 4 + 2] / (640 / imageData.width);
    const y2 = bboxes[i * 4 + 3] / (640 / imageData.height);
    
    const kps: KeyPoint[] = [];
    if (keypoints) {
      for (let j = 0; j < 5; j++) {
        kps.push({
          x: keypoints[i * 10 + j * 2] / (640 / imageData.width),
          y: keypoints[i * 10 + j * 2 + 1] / (640 / imageData.height),
        });
      }
    }
    
    detections.push({
      bbox: { x1, y1, x2, y2, score },
      keypoints: kps,
    });
  }
  
  return detections;
}

// Align face using keypoints
function alignFace(
  imageData: ImageData,
  bbox: BoundingBox,
  keypoints: KeyPoint[]
): ImageData {
  if (keypoints.length < 5) {
    // Fallback to simple crop
    const x = Math.max(0, Math.floor(bbox.x1));
    const y = Math.max(0, Math.floor(bbox.y1));
    const w = Math.min(imageData.width - x, Math.floor(bbox.x2 - bbox.x1));
    const h = Math.min(imageData.height - y, Math.floor(bbox.y2 - bbox.y1));
    
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, -x, -y, x, y, w, h);
    return ctx.getImageData(0, 0, w, h);
  }
  
  // Use keypoints for alignment (simplified)
  const x = Math.max(0, Math.floor(bbox.x1));
  const y = Math.max(0, Math.floor(bbox.y1));
  const w = Math.min(imageData.width - x, Math.floor(bbox.x2 - bbox.x1));
  const h = Math.min(imageData.height - y, Math.floor(bbox.y2 - bbox.y1));
  
  // Extract face region
  const faceCanvas = new OffscreenCanvas(w, h);
  const faceCtx = faceCanvas.getContext('2d')!;
  const sourceCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.putImageData(imageData, 0, 0);
  faceCtx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);
  
  // Resize to 112x112
  const alignedCanvas = new OffscreenCanvas(112, 112);
  const alignedCtx = alignedCanvas.getContext('2d')!;
  alignedCtx.drawImage(faceCanvas, 0, 0, 112, 112);
  
  return alignedCtx.getImageData(0, 0, 112, 112);
}

// Preprocess face for recognition
function preprocessRecognition(faceData: ImageData): Float32Array {
  const size = 112; // ArcFace input size
  const input = new Float32Array(3 * size * size);
  const mean = [127.5, 127.5, 127.5];
  const std = [128.0, 128.0, 128.0];
  
  for (let i = 0; i < size * size; i++) {
    const r = faceData.data[i * 4] || 0;
    const g = faceData.data[i * 4 + 1] || 0;
    const b = faceData.data[i * 4 + 2] || 0;
    
    input[i] = (r - mean[0]) / std[0];
    input[i + size * size] = (g - mean[1]) / std[1];
    input[i + 2 * size * size] = (b - mean[2]) / std[2];
  }
  
  return input;
}

// Compute face embedding
async function computeEmbedding(
  imageData: ImageData,
  bbox: BoundingBox,
  keypoints: KeyPoint[]
): Promise<Float32Array> {
  if (!recognitionSession) {
    recognitionSession = await loadRecognitionModel();
  }
  
  const alignedFace = alignFace(imageData, bbox, keypoints);
  const input = preprocessRecognition(alignedFace);
  const tensor = new ort.Tensor('float32', input, [1, 3, 112, 112]);
  
  const feeds = { [recognitionSession.inputNames[0]]: tensor };
  const results = await recognitionSession.run(feeds);
  
  const embedding = results[recognitionSession.outputNames[0]]
    .data as Float32Array;
  
  // Normalize embedding
  const norm = Math.sqrt(
    Array.from(embedding).reduce((sum, val) => sum + val * val, 0)
  );
  return new Float32Array(embedding.map((val) => val / norm));
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    if (type === 'INIT') {
      await initializeONNX();
      isInitialized = true;
      self.postMessage({ type: 'READY' } as WorkerMessage);
    } else if (type === 'DETECT_FACES') {
      if (!isInitialized) {
        await initializeONNX();
        isInitialized = true;
      }
      const request = payload as DetectionRequest;
      const detections = await detectFaces(request.imageData);
      self.postMessage({
        type: 'DETECTION_RESULT',
        payload: detections,
      } as WorkerMessage);
    } else if (type === 'COMPUTE_EMBEDDING') {
      if (!isInitialized) {
        await initializeONNX();
        isInitialized = true;
      }
      const request = payload as EmbeddingRequest;
      const embedding = await computeEmbedding(
        request.imageData,
        request.bbox,
        request.keypoints
      );
      self.postMessage({
        type: 'EMBEDDING_RESULT',
        payload: embedding,
      } as WorkerMessage);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    } as WorkerMessage);
  }
};

