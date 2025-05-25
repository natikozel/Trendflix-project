import path from 'path';
import { fileURLToPath } from 'url';
import VectorProcessor from '../algorithm/movieReviewsToVector.js';
import { connectToDatabase, closeDatabase } from '../lib/db/mongodb.js';
import Movie from '../lib/db/models/Movie.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';
import { loadMovieDataFromDirectory } from '../lib/utils/dataLoader.js';

const __filename = fileURLToPath(import.meta.url);

const vectorProcessor = new VectorProcessor();

const args = process.argv.slice(2);
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const metadataOnly = args.includes('--metadata-only');

function log(...messages) {
  if (verbose) {
    console.log(...messages);
  }
}

async function initializeMovieDatabase() {
  console.log('Initializing movie database...');
  console.log(`Force reprocessing: ${force ? 'Yes' : 'No'}`);
  console.log(`Metadata only: ${metadataOnly ? 'Yes' : 'No'}`);
  
  try {
    await connectToDatabase();
    
    const totalCount = await Movie.countDocuments();
    const vectorizedCount = await Movie.countDocuments({ vectorProcessed: true });
    console.log(`Current database state: ${totalCount} movies, ${vectorizedCount} with vectors`);
    
    let existingMovieIds = [];
    let vectorizedMovieIds = [];
    if (!force) {
      existingMovieIds = (await Movie.find({}, { movieId: 1, _id: 0 }))
        .map(doc => doc.movieId);
      
      vectorizedMovieIds = (await Movie.find({ vectorProcessed: true }, { movieId: 1, _id: 0 }))
        .map(doc => doc.movieId);
      
      log(`Found ${existingMovieIds.length} existing movies, ${vectorizedMovieIds.length} with vectors`);
    }
    
    const dataFolder = path.join(process.cwd(), 'src', 'data');
    console.log(`Looking for movie data in: ${dataFolder}`);
    
    const movies = loadMovieDataFromDirectory(dataFolder);
    
    let processed = 0;
    let vectorized = 0;
    let skipped = 0;
    let errors = 0;
    let updatedAgeRating = 0;
    let updatedAuthors = 0;
    
    for (const { data: movieData, source } of movies) {
      try {
        log(`Processing ${source}...`);
        
        const hasAgeRating = movieData.age_rating !== undefined || movieData.ageRating !== undefined;
        const hasAuthors = movieData.reviews && movieData.reviews.some(r => 
          typeof r === 'object' && (r.author || r.reviewer));
        
        if (hasAgeRating) {
          log(`Movie ${movieData.movie_name} has age_rating: ${movieData.age_rating || movieData.ageRating}`);
          updatedAgeRating++;
        }
        
        if (hasAuthors) {
          log(`Movie ${movieData.movie_name} has review authors`);
          updatedAuthors++;
        }
        
        const shouldUpdate = force || hasAgeRating || hasAuthors;
        
        if (!shouldUpdate && existingMovieIds.includes(movieData.movie_id)) {
          log(`Movie ${movieData.movie_name} already exists in database`);
          
          if (!metadataOnly && !vectorizedMovieIds.includes(movieData.movie_id)) {
            log(`Movie ${movieData.movie_name} exists but needs vector processing`);
          } else {
            log(`Skipping ${movieData.movie_name}: Already processed`);
            skipped++;
            continue;
          }
        }
        
        try {
          await movieDatabaseService.storeMovie(movieData);
          processed++;
          log(`Stored metadata for ${movieData.movie_name}`);
        } catch (metadataError) {
          console.error(`Error storing metadata for ${source}:`, metadataError);
          errors++;
          continue;
        }
        
        if (metadataOnly) {
          continue;
        }
        
        if (!movieData.reviews || !Array.isArray(movieData.reviews) || movieData.reviews.length === 0) {
          console.warn(`Skipping vector processing for ${movieData.movie_name}: No valid reviews found`);
          continue;
        }
        
        try {
          const movieVector = vectorProcessor.processMovie(movieData);
          
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
    
    const newTotalCount = await Movie.countDocuments();
    const newVectorizedCount = await Movie.countDocuments({ vectorProcessed: true });
    
    console.log('\nInitialization complete:');
    console.log(`Movies processed: ${processed}`);
    console.log(`Vectors generated: ${vectorized}`);
    console.log(`Movies with age_rating updated: ${updatedAgeRating}`);
    console.log(`Movies with review authors updated: ${updatedAuthors}`);
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
      updatedAgeRating,
      updatedAuthors,
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