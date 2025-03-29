import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Recommender from './recommender.js';
import UserInputProcessor from './userInputToVector.js';
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadMovieData() {
  try {
    console.log("Loading movie data...");
    const dataDir = join(__dirname, '../data');
    
    // Check if directory exists
    try {
      await fs.promises.access(dataDir);
      console.log(`Data directory exists: ${dataDir}`);
    } catch (error) {
      console.error(`Data directory does not exist or is not accessible: ${dataDir}`);
      console.error(`Error: ${error.message}`);
      return [];
    }
    
    // List files in directory
    const files = await fs.promises.readdir(dataDir);
    console.log(`Found ${files.length} files in data directory:`, files);
    
    const movieData = [];

    // Check if we have any .json files
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.error("No JSON files found in data directory");
      console.log("Creating a sample movie object for testing...");
      
      // Create a sample movie object for testing if no data is available
      const sampleMovie = {
        movie_id: "sample_movie_001",
        movie_name: "Sample Sci-Fi Movie",
        imdbRating: 7.5,
        releaseYear: 2020,
        duration: 120,
        popularityScore: 0.75,
        reviews: [
          { 
            text: "This is a great sci-fi movie with amazing space visuals. The story is intense and the characters are well developed."
          },
          {
            text: "I enjoyed the scientific accuracy and the exciting plot. One of the best sci-fi adventures I've seen recently."
          }
        ]
      };
      
      movieData.push(sampleMovie);
      return movieData;
    }

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(dataDir, file);
        console.log(`Reading file: ${filePath}`);
        
        try {
          const rawData = await readFile(filePath, 'utf8');
          const data = JSON.parse(rawData);
          
          console.log(`Successfully parsed ${file}`);
          console.log(`Movie: ${data.movie_name || data.movie_id || 'Unknown'}`);
          
          // Validate the movie data structure
          if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
            console.warn(`Warning: Movie data in ${file} is missing reviews or has empty reviews array`);
            
            // Add some sample reviews for testing if needed
            data.reviews = data.reviews || [
              { text: "Sample review for testing purposes." },
              { text: "Another sample review with sci-fi and adventure keywords." }
            ];
            
            console.log("Added sample reviews for testing");
          } else {
            console.log(`Found ${data.reviews.length} reviews`);
          }
          
          movieData.push(data);
        } catch (error) {
          console.error(`Error reading or parsing ${file}:`, error.message);
        }
      }
    }

    console.log(`Successfully loaded ${movieData.length} movies`);
    return movieData;
  } catch (error) {
    console.error('Error loading movie data:', error);
    console.error(error.stack);
    return [];
  }
}

async function testUserInputProcessing() {
  try {
    console.log("\n========== TESTING USER INPUT PROCESSING ==========");
    const userProcessor = new UserInputProcessor();
    
    // Example user input
    const userInput = {
      freeText: "I want a film to view, i have only 110 minutes free time to spare and i want to watch a science fiction movie that is intense and exciting",
      genre: "Comedy", // Note: this is ignored in favor of LLM-detected genres from freeText
      age: 25,
      gender: "male",
      preferredDuration: 150,
      preferNewReleases: true,
      preferredLanguage: "English",
    };

    console.log('\nProcessing user input...');
    console.log('\nOriginal User Input:', JSON.stringify(userInput, null, 2));

    const processedInput = await userProcessor.processUserInput(userInput);
    
    console.log('\nProcessed Input:');
    console.log(JSON.stringify(processedInput.processedInput, null, 2));
    
    console.log('\nTop vector terms by weight:');
    const sortedTerms = Object.entries(processedInput.vector)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Show top 10 terms
      
    sortedTerms.forEach(([term, weight]) => {
      console.log(`${term}: ${weight.toFixed(4)}`);
    });
    
    return processedInput;
  } catch (error) {
    console.error('User input processing test failed:', error);
    console.error(error.stack);
    return null;
  }
}

async function testRecommendationSystem() {
  try {
    console.log("\n========== TESTING RECOMMENDATION SYSTEM ==========");
    const recommender = new Recommender();
    
    // Load movie database
    const movieDatabase = await loadMovieData();
    
    if (!movieDatabase || movieDatabase.length === 0) {
      console.error("No movie data available to process recommendations. Aborting test.");
      return;
    }
    
    console.log('\nTesting user input processing first...');
    const processedUserInput = await testUserInputProcessing();
    
    if (!processedUserInput) {
      console.error("User input processing failed. Aborting recommendation test.");
      return;
    }
    
    console.log('\nProcessing recommendation request...');

    const recommendations = await recommender.getRecommendations(processedUserInput, movieDatabase, {
      maxResults: 5,
      similarityThreshold: 0.01,
      includeMetadata: true
    });

    console.log('\nRecommendations:');
    console.log(JSON.stringify(recommendations, null, 2));

    // Validate results
    console.log('\nValidation:');
    if (recommendations.length === 0) {
      console.log("No recommendations found above similarity threshold");
    } else {
      recommendations.forEach(rec => {
        console.log(`\nMovie: ${rec.movieName}`);
        console.log(`Base Similarity: ${rec.similarity}`);
        console.log(`Final Score: ${rec.finalScore}`);
        if (rec.metadata) {
          console.log('Metadata:', JSON.stringify(rec.metadata, null, 2));
        }
      });
    }

    console.log("\n========== TEST COMPLETE ==========");
  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

console.log("Starting test script...");
await testRecommendationSystem();