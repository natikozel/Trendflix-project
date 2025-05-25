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

  async storeMovie(movieData, vectorData = null) {
    await this.initialize();

    try {
      if (!movieData || !movieData.movie_id) {
        throw new Error('Invalid movie data: missing movie_id');
      }
      
      const normalizedData = normalizeMovieData(movieData);
      
      const dbMovie = convertToDbFormat(normalizedData);
      
      if (vectorData && vectorData.vector && vectorData.dimensions) {
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
  
  async updateVector(movieId, vectorData) {
    await this.initialize();
    
    try {
      if (!movieId) {
        throw new Error('Invalid movieId: missing or empty');
      }
      
      if (!vectorData || !vectorData.vector || !vectorData.dimensions) {
        throw new Error('Invalid vector data: missing vector or dimensions');
      }
      
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

  async getMovie(movieId) {
    await this.initialize();
    
    try {
      return await Movie.findOne({ movieId });
    } catch (error) {
      console.error('Error retrieving movie:', error);
      return null;
    }
  }
  
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
  
  async getVectorizedMovies(limit = 100, skip = 0) {
    await this.initialize();
    
    try {
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
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Error retrieving vectorized movies:', error);
      return [];
    }
  }
  
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

  async getMovieVectors(genres = null) {
    await this.initialize();
    
    try {
      const query = { vectorProcessed: true };
      if (genres && Array.isArray(genres) && genres.length > 0) {
        query.genres = { $in: genres };
      }
      
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
      
      const movieIds = movies.map(movie => movie.movieId);
      
      const genreVectors = await GenreVector.find({ movieId: { $in: movieIds } }).lean();
      
      const genreVectorMap = {};
      for (const genreVector of genreVectors) {
        genreVectorMap[genreVector.movieId] = genreVector.genreVector;
      }
      
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

const movieDatabaseService = new MovieDatabaseService();

export default movieDatabaseService;