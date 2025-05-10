import { NextResponse } from 'next/server';
import Recommender from '@/algorithm/recommender.js';

// Create a new recommender instance
const recommender = new Recommender();

// Define a type for the validation result
type ProcessedResult = {
  validationError?: boolean;
  errorMessage?: string;
  processedInput?: any;
  vector?: any;
};

export async function POST(request: Request) {
  try {
    const userInput = await request.json();
    
    // Process user input which now includes validation
    const processedResult = await recommender.userProcessor.processUserInput(userInput) as ProcessedResult;
    
    // Check if there was a validation error
    if (processedResult.validationError) {
      return NextResponse.json({
        validationError: true,
        errorMessage: processedResult.errorMessage
      });
    }
    
    // If input is valid, get recommendations
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