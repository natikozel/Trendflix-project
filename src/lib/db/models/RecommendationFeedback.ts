import { UserInput } from '@/store/recommendationsSlice';

/**
 * Model representing user feedback on movie recommendations
 */
interface RecommendationFeedback {
  id: string;                  // Unique identifier for the feedback
  movieId: string;             // ID of the movie that was recommended
  liked: boolean;              // Whether the user liked the recommendation
  timestamp: number;           // When the feedback was submitted
  userInputData: UserInput;    // The user input that led to this recommendation
  recommendationScore?: number; // The similarity score that led to this recommendation
}

/**
 * Factory function to create a new feedback entry
 */
export function createFeedback(
  movieId: string, 
  liked: boolean, 
  userInputData: UserInput,
  recommendationScore?: number
): RecommendationFeedback {
  return {
    id: crypto.randomUUID(),
    movieId,
    liked,
    timestamp: Date.now(),
    userInputData,
    recommendationScore
  };
}

export default RecommendationFeedback; 