import { NextResponse } from 'next/server';
import Recommender from '@/algorithm/recommender.js';

// Create a new recommender instance
const recommender = new Recommender();

export async function POST(request: Request) {
  try {
    const userInput = await request.json();
    // Get recommendations with lower threshold to ensure we get more results
    const recommendations = await recommender.getRecommendations(userInput, {
      maxResults: 6,
      similarityThreshold: 0.02, // Lower threshold to get more results
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