import { NextResponse } from 'next/server';
import { getAllFaces } from '@/lib/firestore';

export const runtime = 'nodejs';

/**
 * GET /api/faces/list
 * Get all registered faces (without embedding data for performance)
 */
export async function GET() {
  try {
    console.log('🔵 Backend: Fetching all registered faces');

    const faces = await getAllFaces();
    
    console.log(`✅ Backend: Found ${faces.length} registered faces`);

    // Return faces without embedding data (too large for response)
    const facesSummary = faces.map(face => ({
      id: face.id,
      name: face.name,
      createdAt: face.createdAt,
      embeddingLength: face.embedding.length,
    }));

    return NextResponse.json({
      success: true,
      count: faces.length,
      faces: facesSummary,
    });

  } catch (error) {
    console.error('❌ Backend: List faces error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list faces',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

