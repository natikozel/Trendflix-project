// src/algorithm/interstellarToVector.js
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import VectorProcessor from './movieReviewsToVector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertInterstellarToVector() {
  try {
    console.log("Starting Interstellar vector conversion...");
    
    // Create a VectorProcessor instance
    const vectorProcessor = new VectorProcessor();
    console.log("VectorProcessor initialized");
    
    // Load Interstellar data from the data directory
    const dataDir = join(__dirname, '../data');
    const interstellarFilePath = join(dataDir, 'interstellar_reviews.json');
    
    console.log(`Reading Interstellar data from: ${interstellarFilePath}`);
    const rawData = await readFile(interstellarFilePath, 'utf8');
    const interstellarData = JSON.parse(rawData);
    
    // Display basic information about the loaded data
    console.log(`Movie: ${interstellarData.movie_name}`);
    console.log(`Movie ID: ${interstellarData.movie_id}`);
    console.log(`Total Reviews: ${interstellarData.reviews.length}`);
    
    // Process the movie data to generate a vector
    console.log("Processing Interstellar into a vector representation...");
    const vectorizedMovie = vectorProcessor.processMovie(interstellarData);
    
    // Output results
    console.log("\n=== Interstellar Vector Results ===");
    console.log(`Movie ID: ${vectorizedMovie.movieId}`);
    console.log(`Movie Name: ${vectorizedMovie.movieName}`);
    console.log(`Vector Dimensions Count: ${vectorizedMovie.dimensions.length}`);
    
    console.log(interstellarData)
    // Display top terms by weight
    console.log("\nTop 20 terms by weight:");
    const sortedTerms = Object.entries(vectorizedMovie.vector)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);
    
    sortedTerms.forEach(([term, weight], index) => {
      console.log(`${index + 1}. ${term}: ${weight.toFixed(4)}`);
    });
    
    // Verify the vector is normalized (magnitude should be close to 1)
    const magnitude = Math.sqrt(
      Object.values(vectorizedMovie.vector).reduce((sum, weight) => sum + weight * weight, 0)
    );
    console.log(`\nVector Magnitude: ${magnitude.toFixed(4)} (should be close to 1.0)`);
    
    // Output example of how to use this vector
    console.log("\n=== How to Use This Vector ===");
    console.log("This vector representation can be used for:");
    console.log("1. Finding similar movies via cosine similarity");
    console.log("2. Building a recommendation system");
    console.log("3. Analyzing thematic elements in the movie");
    
    console.log("\nTest completed successfully!");
    return vectorizedMovie;
  } catch (error) {
    console.error("Error converting Interstellar to vector:", error);
    console.error(error.stack);
  }
}

// Run the test
convertInterstellarToVector()
  .then(result => {
    if (result) {
      console.log("Successfully converted Interstellar to vector representation.");
    } else {
      console.log("Failed to convert Interstellar to vector representation.");
    }
  })
  .catch(error => {
    console.error("Unexpected error:", error);
  });