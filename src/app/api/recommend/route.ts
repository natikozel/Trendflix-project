import { NextResponse } from 'next/server';
import Recommender from '@/algorithm/recommender';
import { loadMovieData } from "../util"
export async function POST(request: Request) {
  try {
    const userInput = await request.json();
    console.log("USERINPUT", userInput)
    // Initialize recommender
    const recommender = new Recommender();
    
    // Load movie data
    const movieDatabase = await loadMovieData()
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