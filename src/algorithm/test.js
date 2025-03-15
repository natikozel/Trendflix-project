import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Recommender from './recommender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadMovieData() {
  try {
    const reviewsPath = join(__dirname, '../data/reviews.json');
    const rawData = await readFile(reviewsPath, 'utf8');
    const movieData = JSON.parse(rawData);
    
    // Add metadata for testing
    return [{
      ...movieData,
      // movieId: "tt0816692",
      // movieName: "Interstellar",
      // imdbRating: 8.6,
      // releaseYear: 2014,
      // duration: 169,
      // popularityScore: 0.85
    }];
  } catch (error) {
    console.error('Error loading movie data:', error);
    throw error;
  }
}

async function testRecommendationSystem() {
  try {
    const recommender = new Recommender();
    
    // Load movie database
    const movieDatabase = await loadMovieData();
    
    // Example user input
    const userInput = {
      freeText: "Looking for an intense sci-fi movie with complex plot and inspiring message",
      age: 25,
      gender: "male",
      preferredDuration: 150,
      preferNewReleases: true,
      additionalParams: {
        preferredLanguage: "English",
        watchingTime: "evening"
      }
    };

    console.log('\nProcessing recommendation request...');
    console.log('\nUser Input:', JSON.stringify(userInput, null, 2));

    const recommendations = await recommender.getRecommendations(userInput, movieDatabase, {
      maxResults: 5,
      similarityThreshold: 0.01,
      includeMetadata: true
    });

    console.log('\nRecommendations:');
    console.log(JSON.stringify(recommendations, null, 2));

    // Validate results
    console.log('\nValidation:');
    recommendations.forEach(rec => {
      console.log(`\nMovie: ${rec.movieName}`);
      console.log(`Base Similarity: ${rec.similarity}`);
      console.log(`Final Score: ${rec.finalScore}`);
      if (rec.metadata) {
        console.log('Metadata:', JSON.stringify(rec.metadata, null, 2));
      }
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

await testRecommendationSystem();