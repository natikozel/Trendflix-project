import { NextResponse } from 'next/server';
import Recommender from '@/algorithm/recommender.js';

const recommender = new Recommender();

type ProcessedResult = {
  validationError?: boolean;
  errorMessage?: string;
  processedInput?: any;
  vector?: any;
};

export async function POST(request: Request) {
  try {
    let userInput = await request.json();
    
    const processedResult = await recommender.userProcessor.processUserInput(userInput) as ProcessedResult;
    if (processedResult.validationError) {
      return NextResponse.json({
        validationError: true,
        errorMessage: processedResult.errorMessage
      });
    }
    
    userInput.processedData = processedResult;
    const recommendations = await recommender.getRecommendations(userInput);
    
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}