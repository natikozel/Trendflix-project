/**
 * Similarity Measure Factory
 * 
 * This utility provides a unified interface for accessing different similarity measures.
 * It allows for easy switching between different algorithms for testing and comparison.
 */

import CosineRecommender from './recommender.js';
import JaccardSimilarityRecommender from './jaccardSimilarity.js';
import EuclideanDistanceRecommender from './euclideanDistance.js';
import PearsonCorrelationRecommender from './pearsonCorrelation.js';

class SimilarityFactory {
  constructor() {
    this.recommenders = {
      'cosine': new CosineRecommender(),
      'jaccard': new JaccardSimilarityRecommender(),
      'euclidean': new EuclideanDistanceRecommender(),
      'pearson': new PearsonCorrelationRecommender(),
    };
  }
  
  /**
   * Get a recommender by type
   * @param {string} type - The type of similarity measure to use (cosine, jaccard, euclidean, pearson)
   * @returns {Object} The recommender instance
   */
  getRecommender(type = 'cosine') {
    const lowerType = type.toLowerCase();
    if (!this.recommenders[lowerType]) {
      console.warn(`Recommender type '${type}' not found. Using cosine similarity instead.`);
      return this.recommenders.cosine;
    }
    return this.recommenders[lowerType];
  }
  
  /**
   * Get recommendations using a specific algorithm
   * @param {string} type - The type of similarity measure to use
   * @param {Object} userInputData - The user input data
   * @param {Object} options - Additional options for the recommendation algorithm
   * @returns {Array} The recommendations
   */
  async getRecommendations(type, userInputData, options = {}) {
    const recommender = this.getRecommender(type);
    return await recommender.getRecommendations(userInputData, options);
  }
  
  /**
   * Get a list of available recommender types
   * @returns {Array<string>} The available recommender types
   */
  getAvailableRecommenders() {
    return Object.keys(this.recommenders);
  }
  
  /**
   * Compare results across all recommender types
   * @param {Object} userInputData - The user input data
   * @param {Object} options - Additional options for the recommendation algorithm
   * @returns {Object} The comparison results
   */
  async compareAllRecommenders(userInputData, options = {}) {
    const results = {};
    const recommenderTypes = this.getAvailableRecommenders();
    
    console.log(`Comparing ${recommenderTypes.length} recommender algorithms...`);
    
    for (const type of recommenderTypes) {
      console.log(`\n===== Testing ${type.toUpperCase()} similarity =====`);
      try {
        results[type] = await this.getRecommendations(type, userInputData, options);
      } catch (error) {
        console.error(`Error with ${type} recommender:`, error);
        results[type] = { error: error.message };
      }
    }
    
    return results;
  }
}

export default SimilarityFactory;
