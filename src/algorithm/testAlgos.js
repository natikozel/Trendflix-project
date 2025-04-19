/**
 * Test Script for Different Similarity Measures
 * 
 * This script demonstrates how to use different similarity measures for recommendation
 * and compares their results.
 */

import SimilarityFactory from './similarityFactory.js';

// Sample user input for testing
const sampleUserInput = {
  freeText: "A magnificent ocean liner, unsinkable in design yet doomed by fate. The ship stands as a testament to human ambition, with ornate grand staircases and luxurious first-class accommodations contrasting with the cramped quarters below decks. On its maiden voyage across the icy North Atlantic, disaster strikes as it collides with an iceberg, sending over 1,500 souls into the frigid waters. The tragedy forever altered maritime safety regulations and remains one of history's most haunting maritime disasters.",
  preferNewReleases: true,
  preferredDuration: 120
};

// Create the similarity factory
const similarityFactory = new SimilarityFactory();

// Function to test a specific similarity measure
async function testSimilarityMeasure(type) {
  console.log(`\n===== Testing ${type.toUpperCase()} similarity =====`);
  
  try {
    // Get recommendations using the specified similarity measure
    const recommendations = await similarityFactory.getRecommendations(type, sampleUserInput, {
      maxResults: 5,
      includeMetadata: true
    });
    
    // Display the recommendations
    console.log(`Top 5 recommendations using ${type} similarity:`);
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. "${rec.movieName}" - Similarity: ${rec.similarity.toFixed(4)}, Final Score: ${rec.finalScore.toFixed(4)}`);
    });
    
    return recommendations;
  } catch (error) {
    console.error(`Error testing ${type} similarity:`, error);
    return null;
  }
}

// Function to compare all similarity measures
async function compareAllSimilarityMeasures() {
  console.log("Comparing all similarity measures...");
  
  try {
    // Get all available recommender types
    const recommenderTypes = similarityFactory.getAvailableRecommenders();
    
    // Test each similarity measure
    const results = {};
    for (const type of recommenderTypes) {
      results[type] = await testSimilarityMeasure(type);
    }
    
    // Analyze the differences between similarity measures
    console.log("\n===== Similarity Measure Comparison =====");
    
    // Check for common movies across methods
    const movieSets = {};
    const allMovieIds = new Set();
    
    for (const type in results) {
      if (results[type]) {
        movieSets[type] = new Set(results[type].map(rec => rec.movieId));
        results[type].forEach(rec => allMovieIds.add(rec.movieId));
      }
    }
    
    // Find movies that appear in all methods
    const commonMovies = Array.from(allMovieIds).filter(movieId => {
      return Object.values(movieSets).every(set => set.has(movieId));
    });
    
    console.log(`\nMovies common to all similarity measures: ${commonMovies.length}`);
    
    // Find movies unique to each method
    console.log("\nMovies unique to each similarity measure:");
    for (const type in movieSets) {
      const uniqueMovies = Array.from(movieSets[type]).filter(movieId => {
        return Object.entries(movieSets)
          .filter(([otherType]) => otherType !== type)
          .every(([_, otherSet]) => !otherSet.has(movieId));
      });
      
      console.log(`${type}: ${uniqueMovies.length} unique movies`);
    }
    
    return results;
  } catch (error) {
    console.error("Error comparing similarity measures:", error);
    return null;
  }
}

// Main function to run the tests
async function main() {
  console.log("Starting similarity measure tests...");
  
  // Test individual similarity measures
  await testSimilarityMeasure('cosine');
  await testSimilarityMeasure('jaccard');
  await testSimilarityMeasure('euclidean');
  await testSimilarityMeasure('pearson');
  
  // Compare all similarity measures
  await compareAllSimilarityMeasures();
  
  console.log("\nTest complete!");
}

// Run the tests
main().catch(error => {
  console.error("Error running tests:", error);
});
