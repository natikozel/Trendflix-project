'use server';

import feedbackService from '@/lib/db/services/FeedbackService';

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

function safeSerialize(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

export async function saveFeedback(
  movieId: string,
  liked: boolean,
  userInputData: UserInput,
  recommendationScore?: string
): Promise<{ success: boolean; feedback?: Feedback; error?: string }> {
  try {
    if (!movieId || liked === undefined || !userInputData) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }
    
    const scoreValue = recommendationScore ? parseFloat(recommendationScore) : undefined;
    
    const feedbackData = await feedbackService.saveFeedback(
      movieId,
      liked,
      userInputData,
      scoreValue
    );
    
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

export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    const feedbackData = await feedbackService.getAllFeedback();
    return safeSerialize(feedbackData);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return [];
  }
}

export async function getFeedbackByMovie(movieId: string): Promise<Feedback[]> {
  try {
    const feedbackData = await feedbackService.getFeedbackByMovieId(movieId);
    return safeSerialize(feedbackData);
  } catch (error) {
    console.error(`Error retrieving feedback for movie ${movieId}:`, error);
    return [];
  }
}

export async function getAggregatedFeedback(): Promise<any[]> {
  try {
    const aggregatedData = await feedbackService.getAggregatedFeedback();
    return safeSerialize(aggregatedData);
  } catch (error) {
    console.error('Error retrieving aggregated feedback:', error);
    return [];
  }
}