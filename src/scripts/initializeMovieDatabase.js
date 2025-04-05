import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import VectorProcessor from '../algorithm/movieReviewsToVector.js';
import { connectToDatabase, closeDatabase } from '../lib/db/mongodb.js';
import Movie from '../lib/db/models/Movie.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';
import { loadMovieDataFromDirectory } from '../lib/utils/dataLoader.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize vector processor
const vectorProcessor = new VectorProcessor();

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const metadataOnly = args.includes('--metadata-only');

// Helper for logging when verbose is enabled
function log(...messages) {
  if (verbose) {
    console.log(...messages);
  }
}

/**
 * Initialize the movie database
 */
async function initializeMovieDatabase() {
  console.log('Initializing movie database...');
  console.log(`Force reprocessing: ${force ? 'Yes' : 'No'}`);
  console.log(`Metadata only: ${metadataOnly ? 'Yes' : 'No'}`);
  
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Get current statistics
    const totalCount = await Movie.countDocuments();
    const vectorizedCount = await Movie.countDocuments({ vectorProcessed: true });
    console.log(`Current database state: ${totalCount} movies, ${vectorizedCount} with vectors`);
    
    // Get existing movie IDs from the database if not forcing reprocessing
    let existingMovieIds = [];
    let vectorizedMovieIds = [];
    if (!force) {
      existingMovieIds = (await Movie.find({}, { movieId: 1, _id: 0 }))
        .map(doc => doc.movieId);
      
      vectorizedMovieIds = (await Movie.find({ vectorProcessed: true }, { movieId: 1, _id: 0 }))
        .map(doc => doc.movieId);
      
      log(`Found ${existingMovieIds.length} existing movies, ${vectorizedMovieIds.length} with vectors`);
    }
    
    // Path to data folder containing movie JSONs
    const dataFolder = path.join(process.cwd(), 'src', 'data');
    console.log(`Looking for movie data in: ${dataFolder}`);
    
    // Load all movie data from the directory
    const movies = loadMovieDataFromDirectory(dataFolder);
    
    // Track statistics
    let processed = 0;
    let vectorized = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each movie
    for (const { data: movieData, source } of movies) {
      try {
        log(`Processing ${source}...`);
        
        // Skip if movie exists and not forcing update
        if (!force && existingMovieIds.includes(movieData.movie_id)) {
          log(`Movie ${movieData.movie_name} already exists in database`);
          
          // If we're only updating vectors, check if it already has a vector
          if (!metadataOnly && !vectorizedMovieIds.includes(movieData.movie_id)) {
            log(`Movie ${movieData.movie_name} exists but needs vector processing`);
          } else {
            log(`Skipping ${movieData.movie_name}: Already processed`);
            skipped++;
            continue;
          }
        }
        
        // Always store metadata
        try {
          await movieDatabaseService.storeMovie(movieData);
          processed++;
          log(`Stored metadata for ${movieData.movie_name}`);
        } catch (metadataError) {
          console.error(`Error storing metadata for ${source}:`, metadataError);
          errors++;
          continue;
        }
        
        // Skip vector processing if we're only updating metadata
        if (metadataOnly) {
          continue;
        }
        
        // Check if movie has reviews for vector processing
        if (!movieData.reviews || !Array.isArray(movieData.reviews) || movieData.reviews.length === 0) {
          console.warn(`Skipping vector processing for ${movieData.movie_name}: No valid reviews found`);
          continue;
        }
        
        // Process the movie vector if we're updating vectors
        try {
          const movieVector = vectorProcessor.processMovie(movieData);
          
          // Update just the vector part
          await movieDatabaseService.updateVector(movieData.movie_id, movieVector);
          
          vectorized++;
          console.log(`Successfully processed vector for ${movieData.movie_name}`);
        } catch (vectorError) {
          console.error(`Error processing vector for ${source}:`, vectorError);
          errors++;
        }
        
      } catch (fileError) {
        console.error(`Error processing movie from ${source}:`, fileError);
        errors++;
      }
    }
    
    // Get updated statistics
    const newTotalCount = await Movie.countDocuments();
    const newVectorizedCount = await Movie.countDocuments({ vectorProcessed: true });
    
    console.log('\nInitialization complete:');
    console.log(`Movies processed: ${processed}`);
    console.log(`Vectors generated: ${vectorized}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`\nDatabase state:`);
    console.log(`Total movies: ${totalCount} → ${newTotalCount} (${newTotalCount - totalCount} new)`);
    console.log(`Vectorized movies: ${vectorizedCount} → ${newVectorizedCount} (${newVectorizedCount - vectorizedCount} new)`);
    
    return {
      processed,
      vectorized,
      skipped,
      errors,
      totalMovies: newTotalCount,
      vectorizedMovies: newVectorizedCount
    };
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    console.log('Closing database connection...');
    await closeDatabase();
    console.log('Database connection closed');
  }
}

// Run the initialization script
initializeMovieDatabase()
  .then(stats => {
    console.log('Database initialization completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Initialization failed:', error);
    closeDatabase()
      .then(() => process.exit(1))
      .catch(() => process.exit(1));
  }); 