/**
 * Backend API Client
 * Handles all communication with Next.js API routes
 */

export interface RegisterFaceRequest {
  name: string;
  landmarks: {
    points: Array<{ x: number; y: number; z: number }>;
  };
  faceImageData: {
    data: number[];
    width: number;
    height: number;
  };
}

export interface RegisterFaceResponse {
  success: boolean;
  id?: string;
  message?: string;
  embeddingLength?: number;
  error?: string;
  details?: string;
}

export interface RecognizeFaceRequest {
  landmarks: {
    points: Array<{ x: number; y: number; z: number }>;
  };
  faceImageData: {
    data: number[];
    width: number;
    height: number;
  };
}

export interface RecognizeFaceResponse {
  success: boolean;
  match?: {
    id: string;
    name: string;
    similarity: number;
    createdAt: string;
  } | null;
  registered: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export interface ListFacesResponse {
  success: boolean;
  count: number;
  faces: Array<{
    id: string;
    name: string;
    createdAt: string;
    embeddingLength: number;
  }>;
  error?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  status: string;
  database: string;
  registeredFaces?: number;
  timestamp: string;
  error?: string;
}

/**
 * Register a new face
 */
export async function registerFace(data: RegisterFaceRequest): Promise<RegisterFaceResponse> {
  try {
    console.log('📤 Frontend: Sending registration request to backend API');
    
    const response = await fetch('/api/faces/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Frontend: Registration failed', result);
      throw new Error(result.error || 'Registration failed');
    }

    console.log('✅ Frontend: Registration successful', result);
    return result;
    
  } catch (error) {
    console.error('❌ Frontend: API call error', error);
    throw error;
  }
}

/**
 * Recognize a face
 */
export async function recognizeFace(data: RecognizeFaceRequest): Promise<RecognizeFaceResponse> {
  try {
    console.log('📤 Frontend: Sending recognition request to backend API');
    
    const response = await fetch('/api/faces/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Frontend: Recognition failed', result);
      throw new Error(result.error || 'Recognition failed');
    }

    console.log('📥 Frontend: Recognition response', result);
    return result;
    
  } catch (error) {
    console.error('❌ Frontend: API call error', error);
    throw error;
  }
}

/**
 * Get list of all registered faces
 */
export async function listFaces(): Promise<ListFacesResponse> {
  try {
    console.log('📤 Frontend: Fetching registered faces list');
    
    const response = await fetch('/api/faces/list', {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Frontend: List faces failed', result);
      throw new Error(result.error || 'Failed to list faces');
    }

    console.log('📥 Frontend: Received faces list', result);
    return result;
    
  } catch (error) {
    console.error('❌ Frontend: API call error', error);
    throw error;
  }
}

/**
 * Health check - verify backend is working
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch('/api/faces/health', {
      method: 'GET',
    });

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('❌ Frontend: Health check error', error);
    throw error;
  }
}

/**
 * Helper: Convert ImageData to plain object for JSON serialization
 */
export function serializeImageData(imageData: ImageData) {
  return {
    data: Array.from(imageData.data),
    width: imageData.width,
    height: imageData.height,
  };
}

