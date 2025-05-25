import feedbackService from '../lib/db/services/FeedbackService';

class FeedbackUtils {
  static async adjustScoreBasedOnFeedback(movieId, currentScore, userPreferences) {
    try {
      const movieFeedback = await feedbackService.getFeedbackByMovieId(movieId);

      if (!movieFeedback || movieFeedback.length === 0) {
        return currentScore;
      }
      
      let adjustedScore = currentScore;
      let totalWeight = 0;
      
      for (const feedback of movieFeedback) {
        const userSimilarity = this.calculateUserSimilarity(
          userPreferences,
          feedback.userInputData
        );
        if (userSimilarity < 0.1) continue;
        
        const feedbackAdjustment = feedback.liked ? 0.1 : -0.1;
        const weightedAdjustment = feedbackAdjustment * userSimilarity;
        
        adjustedScore += weightedAdjustment;
        totalWeight += userSimilarity;
      }
      
      if (totalWeight > 0) {
        adjustedScore = Math.max(0, Math.min(adjustedScore, 1));
      }
      
      console.log(`Adjusted score for ${movieId}: ${currentScore} → ${adjustedScore}`);
      return adjustedScore;
    } catch (error) {
      console.error('Error adjusting score based on feedback:', error);
      return currentScore;
    }
  }
  
  static calculateUserSimilarity(userA, userB) {
    if (!userA || !userB) return 0;
    
    let similarityScore = 0;
    let factorsCount = 0;
    
    if (userA.genres && userB.genres && userA.genres.length > 0 && userB.genres.length > 0) {
      const commonGenres = userA.genres.filter(genre => userB.genres.includes(genre));
      const totalUniqueGenres = new Set([...userA.genres, ...userB.genres]).size;
      
      if (totalUniqueGenres > 0) {
        similarityScore += (commonGenres.length / totalUniqueGenres);
        factorsCount++;
      }
    }
    
    if (userA.age && userB.age) {
      const ageDiff = Math.abs(userA.age - userB.age);
      const ageSimilarity = Math.max(0, 1 - (ageDiff / 50));
      
      similarityScore += ageSimilarity;
      factorsCount++;
    }
    
    if (userA.preferredLanguage && userB.preferredLanguage) {
      if (userA.preferredLanguage === userB.preferredLanguage) {
        similarityScore += 1;
      }
      factorsCount++;
    }
    
    if (userA.preferNewReleases !== undefined && userB.preferNewReleases !== undefined) {
      if (userA.preferNewReleases === userB.preferNewReleases) {
        similarityScore += 1;
      }
      factorsCount++;
    }
    
    if (userA.preferredDuration && userB.preferredDuration) {
      const durationDiff = Math.abs(userA.preferredDuration - userB.preferredDuration);
      const durationSimilarity = Math.max(0, 1 - (durationDiff / 120));
      
      similarityScore += durationSimilarity;
      factorsCount++;
    }
    
    if (userA.yearRange && userB.yearRange) {
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
        similarityScore += 0;
        factorsCount++;
      }
    }
    
    if (userA.freeText && userB.freeText) {
      const tokenizeText = (text) => {
        return text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2);
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
    
    return factorsCount > 0 ? (similarityScore / factorsCount) : 0;
  }
}

export default FeedbackUtils;