'use server';

import { UserInput } from '@/store/recommendationsSlice';
import feedbackService from '@/lib/db/services/FeedbackService';
import RecommendationFeedback from '@/lib/db/models/RecommendationFeedback';

/**
 * Server action to save user feedback about a movie recommendation
 */
export async function saveFeedback(
  movieId: string,
  liked: boolean,
  userInputData: UserInput,
  recommendationScore?: string
): Promise<{ success: boolean; feedback?: RecommendationFeedback; error?: string }> {
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
    const feedback = await feedbackService.saveFeedback(
      movieId,
      liked,
      userInputData,
      scoreValue
    );
    
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
export async function getAllFeedback(): Promise<RecommendationFeedback[]> {
  try {
    return await feedbackService.getAllFeedback();
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return [];
  }
}

/**
 * Server action to get feedback for a specific movie
 */
export async function getFeedbackByMovie(movieId: string): Promise<RecommendationFeedback[]> {
  try {
    return await feedbackService.getFeedbackByMovieId(movieId);
  } catch (error) {
    console.error(`Error retrieving feedback for movie ${movieId}:`, error);
    return [];
  }
} 