// Face Recognition API wrapper
import {
  FaceDetection,
  FaceEmbedding,
  ComparisonResult,
  WorkerMessage,
  DetectionRequest,
  EmbeddingRequest,
} from './types';
import { cosineSimilarity } from './utils/math';

class FaceAPI {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Next.js Web Worker path
      this.worker = new Worker(
        new URL('./faceWorker.ts', import.meta.url),
        { type: 'module' }
      );
    }
  }

  private async init(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Initialization timeout'));
        }, 30000);

        const handler = (event: MessageEvent<WorkerMessage>) => {
          if (event.data.type === 'READY') {
            clearTimeout(timeout);
            this.worker!.removeEventListener('message', handler);
            resolve();
          } else if (event.data.type === 'ERROR') {
            clearTimeout(timeout);
            this.worker!.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };

        this.worker.addEventListener('message', handler);
        this.worker.postMessage({ type: 'INIT' } as WorkerMessage);
      });
    }

    return this.initPromise;
  }

  async detectFaces(imageData: ImageData): Promise<FaceDetection[]> {
    await this.init();
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Detection timeout'));
      }, 30000);

      const handler = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === 'DETECTION_RESULT') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', handler);
          resolve(event.data.payload as FaceDetection[]);
        } else if (event.data.type === 'ERROR') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'DETECT_FACES',
        payload: { imageData } as DetectionRequest,
      } as WorkerMessage);
    });
  }

  async computeEmbedding(
    imageData: ImageData,
    bbox: FaceDetection['bbox'],
    keypoints: FaceDetection['keypoints']
  ): Promise<Float32Array> {
    await this.init();
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Embedding computation timeout'));
      }, 30000);

      const handler = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === 'EMBEDDING_RESULT') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', handler);
          resolve(event.data.payload as Float32Array);
        } else if (event.data.type === 'ERROR') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'COMPUTE_EMBEDDING',
        payload: { imageData, bbox, keypoints } as EmbeddingRequest,
      } as WorkerMessage);
    });
  }

  compareFaces(
    embedding1: Float32Array,
    embedding2: Float32Array,
    threshold: number = 0.6
  ): ComparisonResult {
    const similarity = cosineSimilarity(embedding1, embedding2);
    return {
      similarity,
      match: similarity >= threshold,
      threshold,
    };
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initPromise = null;
    }
  }
}

export const faceAPI = new FaceAPI();

