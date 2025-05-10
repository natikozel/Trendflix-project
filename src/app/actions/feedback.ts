'use server';

import feedbackService from '@/lib/db/services/FeedbackService';

// Define types for our application
interface UserInput {
  genres?: string[];
  age?: number;
  preferredLanguage?: string;
  preferNewReleases?: boolean;
  preferredDuration?: number;
  yearRange?: {
    minYear: number;
    maxYear: number;
  };
  freeText?: string;
  [key: string]: any;
}

interface Feedback {
  _id?: string;
  movieId: string;
  liked: boolean;
  timestamp: Date;
  userInputData: Record<string, any>;
  recommendationScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Helper function to safely serialize data to plain objects
 */
function safeSerialize(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Server action to save user feedback about a movie recommendation
 */
export async function saveFeedback(
  movieId: string,
  liked: boolean,
  userInputData: UserInput,
  recommendationScore?: string
): Promise<{ success: boolean; feedback?: Feedback; error?: string }> {
  try {
    // Validate required fields
    if (!movieId || liked === undefined || !userInputData) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }
    
    // Convert string score to number if provided
    const scoreValue = recommendationScore ? parseFloat(recommendationScore) : undefined;
    
    // Save the feedback
    const feedbackData = await feedbackService.saveFeedback(
      movieId,
      liked,
      userInputData,
      scoreValue
    );
    
    // Ensure we are returning plain objects
    const feedback = safeSerialize(feedbackData);
    
    return { success: true, feedback };
  } catch (error) {
    console.error('Error saving feedback:', error);
    return {
      success: false,
      error: 'Failed to save feedback'
    };
  }
}

/**
 * Server action to get all feedback data (for admin dashboards)
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    const feedbackData = await feedbackService.getAllFeedback();
    return safeSerialize(feedbackData);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return [];
  }
}

/**
 * Server action to get feedback for a specific movie
 */
export async function getFeedbackByMovie(movieId: string): Promise<Feedback[]> {
  try {
    const feedbackData = await feedbackService.getFeedbackByMovieId(movieId);
    return safeSerialize(feedbackData);
  } catch (error) {
    console.error(`Error retrieving feedback for movie ${movieId}:`, error);
    return [];
  }
}

/**
 * Server action to get aggregated feedback data
 */
export async function getAggregatedFeedback(): Promise<any[]> {
  try {
    const aggregatedData = await feedbackService.getAggregatedFeedback();
    return safeSerialize(aggregatedData);
  } catch (error) {
    console.error('Error retrieving aggregated feedback:', error);
    return [];
  }
} 