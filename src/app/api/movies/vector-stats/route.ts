import { NextResponse } from 'next/server';
import vectorDatabaseService from '@/lib/db/services/VectorDatabaseService.js';

export async function GET() {
  try {
    const stats = await vectorDatabaseService.getStats();
    
    return NextResponse.json({
      status: 'success',
      stats
    });
  } catch (error) {
    console.error('Error getting vector database stats:', error);
    return NextResponse.json(
      { error: 'Failed to get vector database stats' },
      { status: 500 }
    );
  }
} 