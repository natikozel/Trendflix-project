import { NextResponse } from 'next/server';
import OptimizedRecommender from '@/algorithm/OptimizedRecommender.js';

// Create instance of optimized recommender
const recommender = new OptimizedRecommender();

export async function POST(request: Request) {
  try {
    const userInput = await request.json();
    
    // Get performance measurement
    const startTime = Date.now();
    
    // Get recommendations
    const recommendations = await recommender.getRecommendations(userInput, {
      maxResults: 5,
      similarityThreshold: 0.02,
      includeMetadata: true
    });
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      recommendations,
      performance: {
        executionTimeMs: executionTime,
        resultCount: recommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting optimized recommendations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get recommendations',
      },
      { status: 500 }
    );
  }
} 