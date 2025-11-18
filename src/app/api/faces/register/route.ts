import { NextRequest, NextResponse } from 'next/server';
import { saveFaceEmbedding } from '@/lib/firestore';
import { generateFaceEmbedding } from '@/lib/faceEmbedding';

export const runtime = 'nodejs';

/**
 * POST /api/faces/register
 * Register a new face with landmarks and image data
 * 
 * Body:
 * {
 *   name: string,
 *   landmarks: { points: Array<{x: number, y: number, z: number}> },
 *   faceImageData: { data: number[], width: number, height: number }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, landmarks, faceImageData } = body;

    // Validate input
    if (!name || !landmarks || !faceImageData) {
      return NextResponse.json(
        { error: 'Missing required fields: name, landmarks, faceImageData' },
        { status: 400 }
      );
    }

    if (!landmarks.points || !Array.isArray(landmarks.points)) {
      console.error('❌ Backend: Invalid landmarks structure:', landmarks);
      return NextResponse.json(
        { error: 'Invalid landmarks: points array is missing or invalid' },
        { status: 400 }
      );
    }

    if (landmarks.points.length !== 468) {
      console.error(`❌ Backend: Invalid landmarks count: ${landmarks.points.length} (expected 468)`);
      return NextResponse.json(
        { 
          error: `Invalid landmarks: must have 468 points, received ${landmarks.points.length}`,
          received: landmarks.points.length,
          expected: 468
        },
        { status: 400 }
      );
    }

    console.log('🔵 Backend: Registering face for', name);
    console.log('   Landmarks points:', landmarks.points.length);
    console.log('   Image size:', faceImageData.width, 'x', faceImageData.height);

    // Convert image data back to ImageData format
    const imageData = {
      data: new Uint8ClampedArray(faceImageData.data),
      width: faceImageData.width,
      height: faceImageData.height,
      colorSpace: 'srgb' as PredefinedColorSpace,
    };

    // Generate face embedding
    const embedding = generateFaceEmbedding(landmarks, imageData);

    console.log('   Generated embedding length:', embedding.length);

    // Save to Firestore
    const docId = await saveFaceEmbedding(name, embedding);

    console.log('✅ Backend: Face registered successfully', docId);

    return NextResponse.json({
      success: true,
      id: docId,
      message: 'Face registered successfully',
      embeddingLength: embedding.length,
    });

  } catch (error) {
    console.error('❌ Backend: Registration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to register face',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

