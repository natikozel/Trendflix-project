import { connectToDatabase } from '../mongodb.js';
import Movie from '../models/Movie.js';
import { normalizeMovieData, convertToDbFormat } from '../../utils/movieDataProcessor.js';
import GenreVector from '../models/GenreVector.js';
class MovieDatabaseService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await connectToDatabase();
      this.initialized = true;
    }
  }

  // Store a complete movie (metadata and vector) in the database
  async storeMovie(movieData, vectorData = null) {
    await this.initialize();

    try {
      // Validate inputs
      if (!movieData || !movieData.movie_id) {
        throw new Error('Invalid movie data: missing movie_id');
      }
      
      // Normalize movie data
      const normalizedData = normalizeMovieData(movieData);
      
      // Convert to database format
      const dbMovie = convertToDbFormat(normalizedData);
      
      // Add vector data if provided
      if (vectorData && vectorData.vector && vectorData.dimensions) {
        // Convert Map to regular object if needed
        if (vectorData.vector instanceof Map) {
          const vectorObj = {};
          for (const [key, value] of vectorData.vector.entries()) {
            vectorObj[key] = value;
          }
          dbMovie.vector = vectorObj;
        } else {
          dbMovie.vector = vectorData.vector;
        }
        
        dbMovie.dimensions = vectorData.dimensions;
        dbMovie.vectorProcessed = true;
      }
      
      // Update in the database (upsert)
      const result = await Movie.findOneAndUpdate(
        { movieId: dbMovie.movieId },
        dbMovie,
        { upsert: true, new: true }
      );
      
      return result;
    } catch (error) {
      console.error('Error storing movie:', error);
      throw error;
    }
  }
  
  // Update just the vector part of a movie
  async updateVector(movieId, vectorData) {
    await this.initialize();
    
    try {
      // Validate inputs
      if (!movieId) {
        throw new Error('Invalid movieId: missing or empty');
      }
      
      if (!vectorData || !vectorData.vector || !vectorData.dimensions) {
        throw new Error('Invalid vector data: missing vector or dimensions');
      }
      
      // Update just the vector fields
      const result = await Movie.findOneAndUpdate(
        { movieId },
        { 
          vector: vectorData.vector,
          dimensions: vectorData.dimensions,
          vectorProcessed: true,
          updatedAt: Date.now() 
        },
        { new: true }
      );
      
      return result;
    } catch (error) {
      console.error('Error updating vector:', error);
      throw error;
    }
  }

  // Get a movie from the database
  async getMovie(movieId) {
    await this.initialize();
    
    try {
      return await Movie.findOne({ movieId });
    } catch (error) {
      console.error('Error retrieving movie:', error);
      return null;
    }
  }
  
  // Get all movies (with optional limit and skip)
  async getAllMovies(limit = 100, skip = 0) {
    await this.initialize();
    
    try {
      return await Movie.find({})
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Error retrieving all movies:', error);
      return [];
    }
  }
  
  // Get all vectorized movies without reviews for recommendation
  async getVectorizedMovies(limit = 100, skip = 0) {
    await this.initialize();
    
    try {
      // Use only inclusion (fields with 1), no exclusions
      return await Movie.find({ vectorProcessed: true })
        .select({
          movieId: 1,
          movieName: 1,
          vector: 1,
          releaseYear: 1,
          duration: 1,
          genres: 1,
          synopsis: 1,
          popularity: 1,
          posterUrl: 1,
          updatedAt: 1,
          _id: 0
          // Don't list reviews and dimensions - they'll be excluded by not listing them
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Error retrieving vectorized movies:', error);
      return [];
    }
  }
  
  // Get vectorized movies for specific genres
  async getVectorizedMoviesByGenres(genres, limit = 100) {
    await this.initialize();
    
    try {
      return await Movie.find({ 
        vectorProcessed: true,
        genres: { $in: genres }
      })
      .select({
        movieId: 1,
        movieName: 1,
        vector: 1,
        releaseYear: 1,
        duration: 1,
        genres: 1,
        synopsis: 1,
        popularity: 1,
        posterUrl: 1,
        updatedAt: 1,
        _id: 0
      })
      .sort({ updatedAt: -1 })
      .limit(limit);
    } catch (error) {
      console.error('Error retrieving movies by genres:', error);
      return [];
    }
  }
  
  // Get movie with only vector data, no metadata (for fast similarity calculations)
  async getMovieVector(movieId) {
    await this.initialize();
    
    try {
      return await Movie.findOne({ movieId, vectorProcessed: true })
        .select({
          movieId: 1,
          vector: 1,
          _id: 0
        });
    } catch (error) {
      console.error('Error retrieving movie vector:', error);
      return null;
    }
  }
  
  // Get movie metadata without vector or reviews
  async getMovieMetadata(movieId) {
    await this.initialize();
    
    try {
      return await Movie.findOne({ movieId })
        .select({
          movieId: 1,
          movieName: 1,
          releaseYear: 1,
          duration: 1,
          genres: 1,
          synopsis: 1,
          popularity: 1,
          posterUrl: 1,
          updatedAt: 1,
          _id: 0,
          vector: 0,
          dimensions: 0,
          reviews: 0
        });
    } catch (error) {
      console.error('Error retrieving movie metadata:', error);
      return null;
    }
  }

  // Get all movie ids that have vectors
  async getAllMovieIds() {
    await this.initialize();
    
    try {
      const movies = await Movie.find({}, { movieId: 1, _id: 0 });
      return movies.map(m => m.movieId);
    } catch (error) {
      console.error('Error retrieving movie ids:', error);
      return [];
    }
  }
  
  // Check if a movie exists in the database
  async movieExists(movieId) {
    await this.initialize();
    
    try {
      const count = await Movie.countDocuments({ movieId });
      return count > 0;
    } catch (error) {
      console.error('Error checking if movie exists:', error);
      return false;
    }
  }
  
  // Check if a movie has been vectorized
  async isVectorized(movieId) {
    await this.initialize();
    
    try {
      const count = await Movie.countDocuments({ movieId, vectorProcessed: true });
      return count > 0;
    } catch (error) {
      console.error('Error checking if movie is vectorized:', error);
      return false;
    }
  }
  
  // Get database stats
  async getStats() {
    await this.initialize();
    
    try {
      const [totalCount, vectorizedCount, recentMovies] = await Promise.all([
        Movie.countDocuments(),
        Movie.countDocuments({ vectorProcessed: true }),
        Movie.find({})
          .sort({ updatedAt: -1 })
          .limit(5)
          .select('movieId movieName updatedAt vectorProcessed')
      ]);
      
      return {
        totalMovies: totalCount,
        vectorizedMovies: vectorizedCount,
        recentMovies: recentMovies.map(m => ({
          movieId: m.movieId,
          movieName: m.movieName,
          vectorized: m.vectorProcessed,
          updatedAt: m.updatedAt
        }))
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { totalMovies: 0, vectorizedMovies: 0, recentMovies: [] };
    }
  }

  // Get all movie vectors as a map for efficient recommendation lookup
  async getMovieVectors(genres = null) {
    await this.initialize();
    
    try {
      // Build the query based on whether genres are specified
      const query = { vectorProcessed: true };
      if (genres && Array.isArray(genres) && genres.length > 0) {
        query.genres = { $in: genres };
      }
      
      // Fetch the movies
      const movies = await Movie.find(query)
        .select({
          movieId: 1,
          movieName: 1,
          vector: 1,
          releaseYear: 1,
          duration: 1,
          genres: 1,
          ageRating: 1,
          popularity: 1,
          synopsis: 1,
          posterUrl: 1,
          updatedAt: 1,
          _id: 0
        })
        .sort({ updatedAt: -1 })
      
      // Get all movie IDs to fetch genre vectors
      const movieIds = movies.map(movie => movie.movieId);
      
      // Fetch genre vectors for these movies
      const genreVectors = await GenreVector.find({ movieId: { $in: movieIds } }).lean();
      
      // Create a map of genre vectors by movieId for quick lookup
      const genreVectorMap = {};
      for (const genreVector of genreVectors) {
        genreVectorMap[genreVector.movieId] = genreVector.genreVector;
      }
      
      // Convert to a Map with movieId as the key
      const vectorMap = {};
      
      for (const movie of movies) {
        vectorMap[movie.movieId] = {
          movieName: movie.movieName,
          vector: movie.vector,
          releaseYear: movie.releaseYear,
          duration: movie.duration,
          genres: movie.genres,
          ageRating: movie.ageRating,
          popularity: movie.popularity,
          synopsis: movie.synopsis,
          posterUrl: movie.posterUrl,
          genreVector: genreVectorMap[movie.movieId] || null
        };
      }
      
      return vectorMap;
    } catch (error) {
      console.error('Error retrieving movie vectors:', error);
      return {};
    }
  }
}

// Create a singleton instance
const movieDatabaseService = new MovieDatabaseService();

export default movieDatabaseService; 