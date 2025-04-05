import { connectToDatabase } from '../mongodb.js';
import MovieVector from '../models/MovieVector';
import mongoose from 'mongoose';

class VectorDatabaseService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await connectToDatabase();
      this.initialized = true;
    }
  }

  // Store a movie vector in the database
  async storeVector(vectorData) {
    await this.initialize();

    try {
      // Extract vector related data
      const { movieId, movieName, vector, dimensions, rating, releaseYear, duration, genres, popularity, posterUrl, synopsis } = vectorData;
      console.log(vectorData)
      // Extract metadata that might be useful for filtering/ranking
      const metadata = {
        movieId,
        movieName,
        rating,
        releaseYear,
        duration,
        genres,
        popularity,
        posterUrl,
        synopsis,
      };

      // Update if exists, insert if not (upsert)
      const result = await MovieVector.findOneAndUpdate(
        { movieId },
        { 
          movieId, 
          movieName, 
          vector, 
          dimensions, 
          metadata,
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );

      console.log(`Stored vector for movie: ${movieName} (${movieId})`);
      return result;
    } catch (error) {
      console.error('Error storing vector:', error);
      throw error;
    }
  }

  // Retrieve a movie vector from the database
  async getVector(movieId) {
    await this.initialize();
    
    try {
      const movieVector = await MovieVector.findOne({ movieId });
      return movieVector ? {
        movieId: movieVector.movieId,
        movieName: movieVector.movieName,
        vector: movieVector.vector,
        dimensions: movieVector.dimensions
      } : null;
    } catch (error) {
      console.error('Error retrieving vector:', error);
      return null;
    }
  }

  // Check if a movie vector exists in the database
  async hasVector(movieId) {
    await this.initialize();
    
    try {
      const count = await MovieVector.countDocuments({ movieId });
      return count > 0;
    } catch (error) {
      console.error('Error checking vector existence:', error);
      return false;
    }
  }

  // Get all movie vectors (with optional limit and skip)
  async getAllVectors(limit = 100, skip = 0) {
    await this.initialize();
    
    try {
      const movieVectors = await MovieVector.find({})
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return movieVectors.map(mv => ({
        movieId: mv.movieId,
        movieName: mv.movieName,
        vector: mv.vector,
        dimensions: mv.dimensions
      }));
    } catch (error) {
      console.error('Error retrieving all vectors:', error);
      return [];
    }
  }

  // Get all movie ids that have vectors
  async getAllMovieIds() {
    await this.initialize();
    
    try {
      const movieIds = await MovieVector.find({}, { movieId: 1, _id: 0 });
      return movieIds.map(m => m.movieId);
    } catch (error) {
      console.error('Error retrieving movie ids:', error);
      return [];
    }
  }

  // Delete a movie vector
  async deleteVector(movieId) {
    await this.initialize();
    
    try {
      const result = await MovieVector.deleteOne({ movieId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting vector:', error);
      return false;
    }
  }

  // Get database stats
  async getStats() {
    await this.initialize();
    
    try {
      const count = await MovieVector.countDocuments();
      const recentUpdates = await MovieVector.find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('movieId movieName updatedAt');
      
      return {
        totalVectors: count,
        recentUpdates: recentUpdates.map(doc => ({
          movieId: doc.movieId,
          movieName: doc.movieName,
          updatedAt: doc.updatedAt
        }))
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { totalVectors: 0, recentUpdates: [] };
    }
  }

  // Add a method to close connections when the service is no longer needed
  // This can be useful in one-off scripts
  async closeConnection() {
    if (this.initialized) {
      await mongoose.connection.close();
      this.initialized = false;
      console.log('VectorDatabaseService: Database connection closed');
    }
  }
}

// Create a singleton instance
const vectorDatabaseService = new VectorDatabaseService();

// Add a cleanup handler for process termination
process.on('SIGINT', async () => {
  await vectorDatabaseService.closeConnection();
});

process.on('SIGTERM', async () => {
  await vectorDatabaseService.closeConnection();
});

export default vectorDatabaseService; 