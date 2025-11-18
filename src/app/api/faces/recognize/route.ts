import { NextRequest, NextResponse } from 'next/server';
import { getAllFaces } from '@/lib/firestore';
import { generateFaceEmbedding, findBestMatch } from '@/lib/faceEmbedding';

export const runtime = 'nodejs';

/**
 * POST /api/faces/recognize
 * Recognize a face by comparing landmarks and image data with stored faces
 * 
 * Body:
 * {
 *   landmarks: { points: Array<{x: number, y: number, z: number}> },
 *   faceImageData: { data: number[], width: number, height: number }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { landmarks, faceImageData } = body;

    // Validate input
    if (!landmarks || !faceImageData) {
      return NextResponse.json(
        { error: 'Missing required fields: landmarks, faceImageData' },
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

    console.log('🔵 Backend: Recognizing face...');
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

    // Get all stored faces
    const storedFaces = await getAllFaces();
    console.log('   Comparing with', storedFaces.length, 'stored faces');

    // Handle empty database
    if (storedFaces.length === 0) {
      console.log('⚠️ Backend: No users registered in database');
      return NextResponse.json({
        success: false,
        match: null,
        message: 'No users registered in database',
        registered: false,
      });
    }

    // Find best match with VERY STRICT 85% threshold + gap analysis
    // This ensures iPhone-level accuracy
    const match = findBestMatch(
      embedding,
      storedFaces
        .filter(face => face.id)
        .map(face => ({
          id: face.id!,
          name: face.name,
          embedding: face.embedding,
        })),
      0.85 // 85% similarity threshold + 5% gap requirement
    );

    if (match) {
      console.log(`✅ Backend: Match found - ${match.name} (${(match.similarity * 100).toFixed(1)}%)`);
      
      // Get full user data
      const matchedUser = storedFaces.find(f => f.id === match.id);
      
      return NextResponse.json({
        success: true,
        match: {
          id: match.id,
          name: match.name,
          similarity: match.similarity,
          createdAt: matchedUser?.createdAt || new Date().toISOString(),
        },
        registered: true,
        message: `Face recognized as ${match.name}`,
      });
    } else {
      console.log('❌ Backend: No match found - similarities below threshold');
      return NextResponse.json({
        success: false,
        match: null,
        registered: false,
        message: 'Face not recognized - no match found',
      });
    }

  } catch (error) {
    console.error('❌ Backend: Recognition error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to recognize face',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

