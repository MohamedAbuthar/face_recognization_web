import { NextResponse } from 'next/server';
import { getAllFaces } from '@/lib/firestore';

export const runtime = 'nodejs';

/**
 * GET /api/faces/health
 * Check if backend API and database are working
 */
export async function GET() {
  try {
    // Test database connection
    const faces = await getAllFaces();
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      registeredFaces: faces.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        status: 'unhealthy',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

