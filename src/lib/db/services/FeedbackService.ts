import RecommendationFeedback, { createFeedback } from '../models/RecommendationFeedback';
import { UserInput } from '@/store/recommendationsSlice';

/**
 * Service for managing recommendation feedback data
 */
class FeedbackService {
  private feedbackData: RecommendationFeedback[] = [];
  private static instance: FeedbackService;
  private initialized = false;
  private storageKey = 'recommendation_feedback';

  // Singleton pattern to ensure we only have one instance
  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  /**
   * Initialize the feedback service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // In a real app, this would load from a database
      // For now, we'll use localStorage in the browser
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem(this.storageKey);
        if (storedData) {
          this.feedbackData = JSON.parse(storedData);
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing feedback service:', error);
    }
  }

  /**
   * Save feedback about a movie recommendation
   */
  async saveFeedback(
    movieId: string,
    liked: boolean,
    userInputData: UserInput,
    recommendationScore?: number
  ): Promise<RecommendationFeedback> {
    await this.initialize();

    const feedback = createFeedback(movieId, liked, userInputData, recommendationScore);
    this.feedbackData.push(feedback);
    
    // Save to storage (in a real app, this would be a database write)
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.feedbackData));
    }
    
    return feedback;
  }

  /**
   * Get all feedback
   */
  async getAllFeedback(): Promise<RecommendationFeedback[]> {
    await this.initialize();
    return this.feedbackData;
  }

  /**
   * Get feedback by movie ID
   */
  async getFeedbackByMovieId(movieId: string): Promise<RecommendationFeedback[]> {
    await this.initialize();
    return this.feedbackData.filter(feedback => feedback.movieId === movieId);
  }

  /**
   * Clear all feedback (for testing purposes)
   */
  async clearAllFeedback(): Promise<void> {
    this.feedbackData = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

const feedbackService = FeedbackService.getInstance();
export default feedbackService; 