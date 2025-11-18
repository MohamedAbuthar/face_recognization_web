// Type definitions for Face Recognition App

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
}

export interface KeyPoint {
  x: number;
  y: number;
}

export interface FaceDetection {
  bbox: BoundingBox;
  keypoints: KeyPoint[]; // 5 keypoints
  alignedFace?: ImageData;
}

export interface FaceEmbedding {
  vector: Float32Array; // 512-dim embedding
}

export interface StoredIdentity {
  id?: string; // Firestore document ID
  name: string;
  embedding: Float32Array;
  createdAt: Date;
}

export type WorkerMessageType =
  | 'INIT'
  | 'DETECT_FACES'
  | 'COMPUTE_EMBEDDING'
  | 'READY'
  | 'ERROR'
  | 'DETECTION_RESULT'
  | 'EMBEDDING_RESULT';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: any;
  error?: string;
}

export interface DetectionRequest {
  imageData: ImageData;
}

export interface EmbeddingRequest {
  imageData: ImageData;
  bbox: BoundingBox;
  keypoints: KeyPoint[];
}

export interface ComparisonResult {
  similarity: number;
  match: boolean;
  threshold?: number;
}

