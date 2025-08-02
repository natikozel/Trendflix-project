import feedbackService from '../lib/db/services/FeedbackService';

/**
 * Utility functions to integrate user feedback into the recommendation algorithm
 */
class FeedbackUtils {
  /**
   * Adjusts a movie's similarity score based on past user feedback
   * 
   * @param {string} movieId - The ID of the movie
   * @param {number} currentScore - The current similarity score
   * @param {object} userPreferences - The current user's preferences
   * @returns {Promise<number>} - The adjusted similarity score
   */
  static async adjustScoreBasedOnFeedback(movieId, currentScore, userPreferences) {
    try {
      // Get all feedback for this movie
      const movieFeedback = await feedbackService.getFeedbackByMovieId(movieId);
      
      if (!movieFeedback || movieFeedback.length === 0) {
        return currentScore; // No feedback yet, return original score
      }
      
      let adjustedScore = currentScore;
      let totalWeight = 0;
      
      // For each feedback entry, adjust the score based on similarity
      // between current user preferences and the preferences of users who gave feedback
      for (const feedback of movieFeedback) {
        // Calculate similarity between current user and feedback user
        const userSimilarity = this.calculateUserSimilarity(
          userPreferences,
          feedback.userInputData
        );
        
        // Skip if similarity is too low
        if (userSimilarity < 0.1) continue;
        
        // Apply feedback: boost score for similar users who liked, reduce for those who disliked
        const feedbackAdjustment = feedback.liked ? 0.01 : -0.01;
        const weightedAdjustment = feedbackAdjustment * userSimilarity;
        
        // Apply the weighted adjustment
        adjustedScore += weightedAdjustment;
        totalWeight += userSimilarity;
      }
      
      // Normalize if we applied any weights
      if (totalWeight > 0) {
        // Ensure the score stays in reasonable bounds
        adjustedScore = Math.max(0, Math.min(adjustedScore, 1));
      }
      
      console.log(`Adjusted score for ${movieId}: ${currentScore} → ${adjustedScore}`);
      return adjustedScore;
    } catch (error) {
      console.error('Error adjusting score based on feedback:', error);
      return currentScore; // Return original score if there's an error
    }
  }
  
  /**
   * Calculate similarity between two users based on their preferences
   * 
   * @param {object} userA - First user's preferences
   * @param {object} userB - Second user's preferences
   * @returns {number} - Similarity score (0-1)
   */
  static calculateUserSimilarity(userA, userB) {
    if (!userA || !userB) return 0;
    
    let similarityScore = 0;
    let factorsCount = 0;
    
    // Compare genres (if available)
    if (userA.genres && userB.genres && userA.genres.length > 0 && userB.genres.length > 0) {
      const commonGenres = userA.genres.filter(genre => userB.genres.includes(genre));
      const totalUniqueGenres = new Set([...userA.genres, ...userB.genres]).size;
      
      if (totalUniqueGenres > 0) {
        similarityScore += (commonGenres.length / totalUniqueGenres);
        factorsCount++;
      }
    }
    
    // Compare age groups
    if (userA.age && userB.age) {
      // Age similarity decreases linearly with age difference
      const ageDiff = Math.abs(userA.age - userB.age);
      const ageSimilarity = Math.max(0, 1 - (ageDiff / 50)); // 50 year difference = 0 similarity
      
      similarityScore += ageSimilarity;
      factorsCount++;
    }
    
    // Compare preferred language
    if (userA.preferredLanguage && userB.preferredLanguage) {
      if (userA.preferredLanguage === userB.preferredLanguage) {
        similarityScore += 1;
      }
      factorsCount++;
    }
    
    // Compare preference for new releases
    if (userA.preferNewReleases !== undefined && userB.preferNewReleases !== undefined) {
      if (userA.preferNewReleases === userB.preferNewReleases) {
        similarityScore += 1;
      }
      factorsCount++;
    }
    
    // Compare preferred movie duration
    if (userA.preferredDuration && userB.preferredDuration) {
      const durationDiff = Math.abs(userA.preferredDuration - userB.preferredDuration);
      const durationSimilarity = Math.max(0, 1 - (durationDiff / 120)); // 2 hour difference = 0 similarity
      
      similarityScore += durationSimilarity;
      factorsCount++;
    }
    
    // Compare year range preferences
    if (userA.yearRange && userB.yearRange) {
      // Get overlap of ranges
      const overlapStart = Math.max(userA.yearRange.minYear, userB.yearRange.minYear);
      const overlapEnd = Math.min(userA.yearRange.maxYear, userB.yearRange.maxYear);
      
      if (overlapEnd >= overlapStart) {
        const overlapSize = overlapEnd - overlapStart;
        const rangeA = userA.yearRange.maxYear - userA.yearRange.minYear;
        const rangeB = userB.yearRange.maxYear - userB.yearRange.minYear;
        const maxRange = Math.max(rangeA, rangeB);
        
        const yearSimilarity = overlapSize / maxRange;
        similarityScore += yearSimilarity;
        factorsCount++;
      } else {
        // No overlap
        similarityScore += 0;
        factorsCount++;
      }
    }
    
    // Compare free text input (text-based preferences) via Jaccard similarity
    if (userA.freeText && userB.freeText) {
      const tokenizeText = (text) => {
        return text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2);  // Filter out short words
      };
      
      const wordsA = new Set(tokenizeText(userA.freeText));
      const wordsB = new Set(tokenizeText(userB.freeText));
      
      if (wordsA.size > 0 && wordsB.size > 0) {
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        
        const jaccardSimilarity = intersection.size / union.size;
        similarityScore += jaccardSimilarity;
        factorsCount++;
      }
    }
    
    // Calculate average similarity, or return 0 if no factors could be compared
    return factorsCount > 0 ? (similarityScore / factorsCount) : 0;
  }
}

export default FeedbackUtils; 