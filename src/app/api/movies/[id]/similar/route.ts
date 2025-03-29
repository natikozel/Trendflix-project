import { NextResponse } from 'next/server';
import { getSimilarMovies } from '@/lib/movies';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    const similarMovies = await getSimilarMovies(id);
    return NextResponse.json(similarMovies);
  } catch (error) {
    console.error('Error getting similar movies:', error);
    return NextResponse.json(
      { error: 'Failed to get similar movies' },
      { status: 500 }
    );
  }
} 