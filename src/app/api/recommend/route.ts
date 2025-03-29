import { NextResponse } from 'next/server';
import Recommender from '@/algorithm/recommender';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const userInput = await request.json();
    
    // Initialize recommender
    const recommender = new Recommender();
    
    // Load movie data
    const dataDir = join(process.cwd(), 'src/data');
    const files = await readFile(join(dataDir, 'movies.json'), 'utf8');
    const movieDatabase = JSON.parse(files);
    
    // Get recommendations
    const recommendations = await recommender.getRecommendations(userInput, movieDatabase, {
      maxResults: 6,
      similarityThreshold: 0.01,
      includeMetadata: true
    });
    
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
} 