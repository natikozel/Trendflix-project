/**
 * Get Genre Vector - LLM-based movie genre vector generator
 * 
 * This module uses an LLM to analyze movie reviews and generate a normalized 
 * vector of 21 genre attributes that sum up to 1.0, representing the movie's
 * key characteristics based on user reviews.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateGeminiResponse } from './LLM.js';
import { connectToDatabase } from '../lib/db/mongodb.js';
import GenreVector from '../lib/db/models/GenreVector.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path to data directory containing review JSON files
const DATA_DIR = path.join(__dirname, '../data');

// Initialize database connection once at the module level
let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    await connectToDatabase();
    dbInitialized = true;
  }
};

/**
 * The LLM prompt template for generating genre vectors from movie reviews
 */
const GENRE_VECTOR_PROMPT = `
Movie Review Analysis Task

You will be given a collection of user reviews for a movie. Your job is to analyze these reviews and create a numerical representation of the movie's attributes based on what reviewers mentioned.

INSTRUCTIONS:
1. Read all the provided user reviews carefully.
2. Based on these reviews, create a vector of 21 attributes (numbered 0-20) that characterizes the movie.
3. Each attribute should have a value between 0 and 1 and it's completely independent from the others.
4. Allocate higher values to attributes that are more prominent or frequently mentioned in the reviews.

ATTRIBUTES TO ANALYZE:
0. Action: From no action (0) to high-intensity action (1)
1. Romance: From no romance (0) to heavily romantic (1)
2. SciFiFantasy: From realistic (0) to heavily sci-fi/fantasy (1)
3. Comedy: From not funny (0) to very humorous (1)
4. ThrillerSuspense: From no suspense (0) to extremely suspenseful (1)
5. EmotionalDepth: From lighthearted (0) to emotionally profound (1)
6. Violence: From non-violent (0) to extremely violent (1)
7. FamilyFriendliness: From adult-oriented (0) to suitable for all ages (1)
8. Pace: From very slow (0) to fast-paced (1)
9. VisualEffects: From minimal effects (0) to CGI-heavy (1)
10. CinematicScore: From forgettable soundtrack (0) to music-driven (1)
11. DialogueComplexity: From simple conversations (0) to deep, complex dialogue (1)
12. HumorType: From dry, subtle humor (0) to obvious slapstick comedy (1)
13. StoryDarkness: From uplifting (0) to dark and tragic (1)
14. Realism: From completely fictional (0) to based on true events (1)
15. DialogueVsAction: From dialogue-heavy (0) to action-driven (1)
16. PoliticalSocial: From no message (0) to strong political themes (1)
17. TwistFactor: From completely predictable (0) to shocking plot twists (1)
18. Horror: From not scary at all (0) to extremely frightening (1)
19. CognitiveLoad: From easy-to-watch (0) to requires full concentration (1)
20. MovieLength: From short film (0) to lengthy epic (1)

IMPORTANT: Do not use any special characters, dots, or spaces in the attribute names. Use the exact attribute names provided above.

OUTPUT FORMAT:
Provide your analysis as a JSON object where keys are the attribute names (0-20) and values are decimal numbers between 0 and 1.
There can't be two vector values that are the same. The numbers must be diversed so that the reader can understand which attribute is superior to others.

Example output format:
{
  "SciFiFantasy": 0.8,
  "Action": 0.4,
  "VisualEffects": 0.9,
  "Pace": 0.6,
  "ThrillerSuspense": 0.7,
  "EmotionalDepth": 0.3,
  "DialogueComplexity": 0.2,
  "DialogueVsAction": 0.1,
  "StoryDarkness": 0.5,
  "Romance": 0.8,
  "Violence": 0.6,
  "CinematicScore": 0.9,
  "Realism": 0.4,
  "TwistFactor": 0.7,
  "Comedy": 0.3,
  "CognitiveLoad": 0.5,
  "HumorType": 0.2,
  "FamilyFriendliness": 0.8,
  "PoliticalSocial": 0.6,
  "Horror": 0.4,
  "MovieLength": 0.9
}
Here are the reviews to analyze:
{REVIEWS}

`
;

/**
 * Loads a movie's review data from a JSON file
 * @param {string} movieId - The ID of the movie to load reviews for
 * @returns {Object|null} The movie review data or null if not found
 */
function loadMovieReviews(movieId) {
  try {
    const filePath = path.join(DATA_DIR, `${movieId}_reviews.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`Review file not found for movie: ${movieId}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading reviews for movie ${movieId}:`, error);
    return null;
  }
}

/**
 * Prepares a subset of reviews for the LLM to analyze
 * @param {Array} reviews - Array of review objects
 * @param {number} maxReviews - Maximum number of reviews to include
 * @returns {string} Formatted review text
 */
function prepareReviewsForLLM(reviews, maxReviews = 50) {
  if (!reviews || reviews.length === 0) {
    return "No reviews available for this movie.";
  }
  
  // Limit the number of reviews to avoid token limits
  const selectedReviews = reviews.slice(0, maxReviews);
  
  // Format reviews as text
  return selectedReviews.map((review, index) => {
    return `Review ${index + 1}: "${review.text}"`;
  }).join("\n\n");
}

/**
 * Generate a genre vector for a movie using LLM analysis of its reviews
 * @param {string} movieId - The ID of the movie to analyze
 * @returns {Promise<Object|null>} The genre vector or null if processing failed
 */
export async function getGenreVector(movieId) {
  try {
    // Load movie review data
    const movieData = loadMovieReviews(movieId);
    if (!movieData) {
      throw new Error(`Could not load review data for movie: ${movieId}`);
    }
    
    // Prepare reviews for the LLM
    const reviewsText = prepareReviewsForLLM(movieData.reviews);
    
    // Create the prompt with reviews inserted
    const prompt = GENRE_VECTOR_PROMPT.replace('{REVIEWS}', reviewsText);
    // Get the LLM response
    const response = await generateGeminiResponse(prompt);
    
    // Verify that all keys are present and values sum to 1.0
    let sum = 0;
    
    // Calculate sum of values
    Object.values(response).forEach(value => {
      sum += parseFloat(value);
    });
    
    // Check if sum is approximately 1.0 (allowing for floating point errors)
    if (Math.abs(sum - 1.0) > 0.01) {
      console.warn(`Values do not sum to 1.0. Actual sum: ${sum}`);
    }
    
    const result = {
      movieId: movieData.movie_id,
      movieName: movieData.movie_name,
      genreVector: response
    };

    // Ensure DB is initialized
    await initDB();
    
    // Save to database - update if exists, create if not
    await GenreVector.findOneAndUpdate(
      { movieId: result.movieId },
      result,
      { upsert: true, new: true }
    );
    
    console.log(`Saved genre vector for movie: ${result.movieName}`);
    
    return result;
  } catch (error) {
    console.error('Error generating genre vector:', error);
    return null;
  }
}

/**
 * Process all movie files in the data directory and generate genre vectors
 * @returns {Promise<Array>} Array of movie genre vectors
 */
export async function processAllMovies() {
  try {
    // Initialize database connection
    await initDB();
    
    // Get all JSON files in the data directory
    const files = fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('_reviews.json'));
    
    console.log(`Found ${files.length} movie review files to process`);
    
    const results = [];
    
    // Process each file
    for (const file of files) {
    
      try {
        const movieId = file.replace('_reviews.json', '');
        const movieData = loadMovieReviews(movieId);
        if (!movieData) {
          console.error(`Could not load review data for file: ${file}`);
          continue;
        }
        console.log(`Checking movie: ${movieData.movie_id}`);
        const existingVector = await GenreVector.findOne({ movieId: movieData.movie_id });
        if (existingVector) {
          console.log(`Skipping movie ${movieId}: Genre vector already exists in the database`);
          results.push(existingVector.toObject());
          continue;
        }      
        console.log(`Processing movie: ${movieId}`);
        const vector = await getGenreVector(movieId);
        console.log(vector);
        if (vector) {
          results.push(vector);
          console.log(`Successfully generated vector for: ${vector.movieName}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    console.log(`Successfully processed ${results.length} movies`);
    return results;
  } catch (error) {
    console.error('Error processing movies:', error);
    return [];
  }
}

/**
 * Retrieves genre vectors from the database
 * @param {string} movieId - Optional movie ID to filter by
 * @returns {Promise<Array>} Array of genre vectors
 */
export async function getGenreVectorsFromDB(movieId = null) {
  try {
    await initDB();
    
    const query = movieId ? { movieId } : {};
    const vectors = await GenreVector.find(query).lean();
    
    return vectors;
  } catch (error) {
    console.error('Error retrieving genre vectors:', error);
    return [];
  }
}

// Import path.dirname here to avoid reference error
import { dirname } from 'path';

// Export default function for module
export default getGenreVector;

/**
 * Main function to run the script from the terminal
 */
async function main() {
  try {
    const results = await processAllMovies();
    console.log('Genre vector generation complete.');
    console.log('Results:', results);
  } catch (error) {
    console.error('Error running main function:', error);
  }
}

// Run the main function
main();