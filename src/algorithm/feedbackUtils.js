/**
 * Feedback Integration and User Similarity Analysis Module
 * 
 * This module implements collaborative filtering techniques by analyzing user feedback
 * to improve recommendation quality. It uses user similarity calculations to weight
 * feedback from similar users more heavily than feedback from dissimilar users.
 * 
 * The feedback system works by:
 * 1. Storing user feedback on movie recommendations
 * 2. Calculating similarity between current user and previous feedback providers
 * 3. Adjusting movie scores based on weighted feedback
 * 4. Continuously improving recommendations through user interaction
 * 
 * Key Features:
 * - Multi-factor user similarity calculation
 * - Weighted feedback integration
 * - Demographic and preference-based matching
 * - Robust error handling and fallbacks
 * - Semantic text similarity analysis
 * 
 * @author Trendflix Team
 * @version 1.0.0
 */

import feedbackService from '../lib/db/services/FeedbackService';

/**
 * Feedback Utilities Class
 * 
 * This class provides utilities for integrating user feedback into the recommendation
 * algorithm. It implements collaborative filtering by analyzing feedback from similar
 * users to adjust movie recommendation scores.
 * 
 * The system uses a sophisticated user similarity calculation that considers:
 * - Genre preferences and overlaps
 * - Demographic factors (age, gender)
 * - Language and cultural preferences
 * - Movie duration and release year preferences
 * - Text-based preference similarity
 * 
 * This creates a more personalized recommendation experience that improves over time
 * as more users provide feedback.
 */
class FeedbackUtils {
  /**
   * Adjusts a movie's similarity score based on past user feedback
   * 
   * This method implements collaborative filtering by:
   * 1. Retrieving all feedback for the specific movie
   * 2. Calculating similarity between current user and each feedback provider
   * 3. Weighting feedback based on user similarity
   * 4. Applying weighted adjustments to the movie's score
   * 
   * The adjustment process ensures that feedback from users with similar tastes
   * has more influence than feedback from users with different preferences.
   * 
   * @param {string} movieId - The ID of the movie being evaluated
   * @param {number} currentScore - The current similarity score for the movie
   * @param {Object} userPreferences - The current user's preferences
   * @param {string} userPreferences.freeText - User's text description of preferences
   * @param {number} userPreferences.age - User's age
   * @param {string} userPreferences.gender - User's gender
   * @param {Array} userPreferences.genres - User's preferred genres
   * @param {number} userPreferences.preferredDuration - Preferred movie duration
   * @param {string} userPreferences.preferredLanguage - Preferred language
   * @param {Object} userPreferences.yearRange - Preferred year range
   * @returns {Promise<number>} - The adjusted similarity score
   */
  static async adjustScoreBasedOnFeedback(movieId, currentScore, userPreferences) {
    try {
      // Get all feedback for this movie from the feedback service
      const movieFeedback = await feedbackService.getFeedbackByMovieId(movieId);
      
      if (!movieFeedback || movieFeedback.length === 0) {
        return currentScore;
      }
      
      let adjustedScore = currentScore;
      let totalWeight = 0;
      
      // Process each feedback entry to calculate weighted adjustments
      for (const feedback of movieFeedback) {
        // Calculate similarity between current user and feedback provider
        const userSimilarity = this.calculateUserSimilarity(
          userPreferences,
          feedback.userInputData
        );
        
        // Skip feedback from users with very different preferences (similarity < 0.1)
        if (userSimilarity < 0.1) continue;
        
        // Apply feedback: boost score for similar users who liked, reduce for those who disliked
        const feedbackAdjustment = feedback.liked ? 0.01 : -0.01;
        const weightedAdjustment = feedbackAdjustment * userSimilarity;
        
        // Apply the weighted adjustment to the score
        adjustedScore += weightedAdjustment;
        totalWeight += userSimilarity;
      }
      
      // Normalize adjustments if we applied any weights
      if (totalWeight > 0) {
        // Ensure the score stays in reasonable bounds (0 to 1)
        adjustedScore = Math.max(0, Math.min(adjustedScore, 1));
      }
      
      console.log(`Adjusted score for ${movieId}: ${currentScore} → ${adjustedScore}`);
      return adjustedScore;
    } catch (error) {
      console.error('Error adjusting score based on feedback:', error);
      return currentScore;
    }
  }
  
  /**
   * Calculate similarity between two users based on their preferences
   * 
   * This method implements a multi-factor user similarity calculation that considers:
   * - Genre preferences and overlaps (Jaccard similarity)
   * - Age similarity (linear decay with age difference)
   * - Language preferences (exact match)
   * - Release year preferences (overlap analysis)
   * - Duration preferences (linear decay)
   * - Text-based preferences (Jaccard similarity on keywords)
   * 
   * The similarity score ranges from 0 (completely different) to 1 (identical preferences).
   * 
   * @param {Object} userA - First user's preferences
   * @param {Object} userB - Second user's preferences
   * @returns {number} - Similarity score between 0 and 1
   */
  static calculateUserSimilarity(userA, userB) {
    if (!userA || !userB) return 0;
    
    let similarityScore = 0;
    let factorsCount = 0;
    
    // Compare genres using Jaccard similarity
    if (userA.genres && userB.genres && userA.genres.length > 0 && userB.genres.length > 0) {
      const commonGenres = userA.genres.filter(genre => userB.genres.includes(genre));
      const totalUniqueGenres = new Set([...userA.genres, ...userB.genres]).size;
      
      if (totalUniqueGenres > 0) {
        // Jaccard similarity: intersection size / union size
        similarityScore += (commonGenres.length / totalUniqueGenres);
        factorsCount++;
      }
    }
    
    // Compare age groups with linear decay
    if (userA.age && userB.age) {
      const ageDiff = Math.abs(userA.age - userB.age);
      const ageSimilarity = Math.max(0, 1 - (ageDiff / 50));
      
      similarityScore += ageSimilarity;
      factorsCount++;
    }
    
    // Compare preferred language (exact match)
    if (userA.preferredLanguage && userB.preferredLanguage) {
      if (userA.preferredLanguage === userB.preferredLanguage) {
        similarityScore += 1; // Full similarity for same language
      }
      factorsCount++;
    }
    
    // Compare preference for new releases (exact match)
    if (userA.preferNewReleases !== undefined && userB.preferNewReleases !== undefined) {
      if (userA.preferNewReleases === userB.preferNewReleases) {
        similarityScore += 1; // Full similarity for same preference
      }
      factorsCount++;
    }
    
    // Compare preferred movie duration with linear decay
    if (userA.preferredDuration && userB.preferredDuration) {
      const durationDiff = Math.abs(userA.preferredDuration - userB.preferredDuration);
      const durationSimilarity = Math.max(0, 1 - (durationDiff / 120));
      
      similarityScore += durationSimilarity;
      factorsCount++;
    }
    
    // Compare year range preferences using overlap analysis
    if (userA.yearRange && userB.yearRange) {
      // Calculate overlap between year ranges
      const overlapStart = Math.max(userA.yearRange.minYear, userB.yearRange.minYear);
      const overlapEnd = Math.min(userA.yearRange.maxYear, userB.yearRange.maxYear);
      
      if (overlapEnd >= overlapStart) {
        // Calculate overlap size and normalize by the larger range
        const overlapSize = overlapEnd - overlapStart;
        const rangeA = userA.yearRange.maxYear - userA.yearRange.minYear;
        const rangeB = userB.yearRange.maxYear - userB.yearRange.minYear;
        const maxRange = Math.max(rangeA, rangeB);
        
        const yearSimilarity = overlapSize / maxRange;
        similarityScore += yearSimilarity;
        factorsCount++;
      } else {
        // No overlap - zero similarity
        similarityScore += 0;
        factorsCount++;
      }
    }
    
    // Compare free text input using Jaccard similarity on keywords
    if (userA.freeText && userB.freeText) {
      // Tokenize and normalize text for comparison
      const tokenizeText = (text) => {
        return text.toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/) // Split on whitespace
          .filter(word => word.length > 2);  // Filter out short words
      };
      
      const wordsA = new Set(tokenizeText(userA.freeText));
      const wordsB = new Set(tokenizeText(userB.freeText));
      
      if (wordsA.size > 0 && wordsB.size > 0) {
        // Calculate Jaccard similarity on word sets
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        
        const jaccardSimilarity = intersection.size / union.size;
        similarityScore += jaccardSimilarity;
        factorsCount++;
      }
    }
    
    // Calculate average similarity across all factors
    // Return 0 if no factors could be compared
    return factorsCount > 0 ? (similarityScore / factorsCount) : 0;
  }
}

export default FeedbackUtils;