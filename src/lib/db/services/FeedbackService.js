import RecommendationFeedback from '../models/RecommendationFeedback';
import { connectToDatabase } from '../mongodb';

/**
 * Service for managing recommendation feedback data in MongoDB
 */
class FeedbackService {
  static instance;

  // Singleton pattern to ensure we only have one instance
  static getInstance() {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  /**
   * Helper to convert Mongoose documents to plain objects
   * @param {Object|Array} doc - Mongoose document or array of documents
   * @returns {Object|Array} - Plain JavaScript object(s)
   */
  _convertToPlainObject(doc) {
    if (!doc) return null;
    
    // Use JSON parse/stringify for a complete serialization
    // This ensures we have a plain JS object without any Mongoose-specific properties
    return JSON.parse(JSON.stringify(doc));
  }

  /**
   * Save feedback about a movie recommendation
   */
  async saveFeedback(
    movieId,
    liked,
    userInputData,
    recommendationScore
  ) {
    await connectToDatabase();
    
    const feedback = new RecommendationFeedback({
      movieId,
      liked,
      timestamp: Date.now(),
      userInputData,
      recommendationScore
    });
    
    const savedFeedback = await feedback.save();
    return this._convertToPlainObject(savedFeedback);
  }

  /**
   * Get all feedback
   */
  async getAllFeedback() {
    await connectToDatabase();
    const feedback = await RecommendationFeedback.find({}).sort({ timestamp: -1 });
    return this._convertToPlainObject(feedback);
  }

  /**
   * Get feedback by movie ID
   */
  async getFeedbackByMovieId(movieId) {
    await connectToDatabase();
    const feedback = await RecommendationFeedback.find({ movieId }).sort({ timestamp: -1 });
    return this._convertToPlainObject(feedback);
  }

  /**
   * Get aggregated feedback data (for analytics)
   */
  async getAggregatedFeedback() {
    await connectToDatabase();
    
    const aggregatedData = await RecommendationFeedback.aggregate([
      {
        $group: {
          _id: '$movieId',
          totalFeedback: { $sum: 1 },
          positiveFeedback: { 
            $sum: { $cond: [{ $eq: ['$liked', true] }, 1, 0] }
          },
          averageScore: { $avg: '$recommendationScore' }
        }
      },
      {
        $project: {
          movieId: '$_id',
          _id: 0,
          totalFeedback: 1,
          positiveFeedback: 1,
          negativeFeedback: { $subtract: ['$totalFeedback', '$positiveFeedback'] },
          positivePercentage: { 
            $multiply: [
              { $divide: ['$positiveFeedback', { $max: ['$totalFeedback', 1] }] }, 
              100
            ] 
          },
          averageScore: 1
        }
      },
      { $sort: { totalFeedback: -1 } }
    ]);
    
    return this._convertToPlainObject(aggregatedData);
  }

  /**
   * Clear all feedback (for testing purposes)
   */
  async clearAllFeedback() {
    await connectToDatabase();
    return await RecommendationFeedback.deleteMany({});
  }
}

const feedbackService = FeedbackService.getInstance();
export default feedbackService; 