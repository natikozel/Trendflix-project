declare interface UserInput {
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

declare interface Feedback {
  _id?: string;
  movieId: string;
  liked: boolean;
  timestamp: Date;
  userInputData: Record<string, any>;
  recommendationScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

declare interface AggregatedFeedback {
  movieId: string;
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  positivePercentage: number;
  averageScore?: number;
}

declare class FeedbackService {
  static getInstance(): FeedbackService;
  
  saveFeedback(
    movieId: string,
    liked: boolean,
    userInputData: UserInput,
    recommendationScore?: number
  ): Promise<Feedback>;
  
  getAllFeedback(): Promise<Feedback[]>;
  
  getFeedbackByMovieId(movieId: string): Promise<Feedback[]>;
  
  getAggregatedFeedback(): Promise<AggregatedFeedback[]>;
  
  clearAllFeedback(): Promise<any>;
}

declare const feedbackService: FeedbackService;
export default feedbackService; 