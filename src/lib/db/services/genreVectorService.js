import GenreVector from '../models/GenreVector.js';
import { connectToDatabase } from '../mongodb.js';

// Initialize database connection once at the module level
let dbInitialized = false;
const initDB = async () => {
    if (!dbInitialized) {
        await connectToDatabase();
        dbInitialized = true;
    }
};

/**
 * Service class for handling GenreVector database operations
 */
class GenreVectorService {
    /**
     * Get a genre vector by movie ID
     * @param {string} movieId - The ID of the movie
     * @returns {Promise<Object|null>} The genre vector document or null if not found
     */
    static async getByMovieId(movieId) {
        try {
            await initDB();
            return await GenreVector.findOne({ movieId }).lean();
        } catch (error) {
            console.error('Error fetching genre vector:', error);
            throw error;
        }
    }

    /**
     * Get multiple genre vectors by movie IDs
     * @param {string[]} movieIds - Array of movie IDs
     * @returns {Promise<Object[]>} Array of genre vector documents
     */
    static async getByMovieIds(movieIds) {
        try {
            await initDB();
            return await GenreVector.find({ movieId: { $in: movieIds } }).lean();
        } catch (error) {
            console.error('Error fetching genre vectors:', error);
            throw error;
        }
    }

    /**
     * Save or update a genre vector
     * @param {Object} vectorData - The genre vector data to save
     * @returns {Promise<Object>} The saved genre vector document
     */
    static async save(vectorData) {
        try {
            await initDB();
            return await GenreVector.findOneAndUpdate(
                { movieId: vectorData.movieId },
                vectorData,
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error saving genre vector:', error);
            throw error;
        }
    }

    /**
     * Delete a genre vector by movie ID
     * @param {string} movieId - The ID of the movie
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    static async deleteByMovieId(movieId) {
        try {
            await initDB();
            const result = await GenreVector.deleteOne({ movieId });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting genre vector:', error);
            throw error;
        }
    }
}

export default GenreVectorService; 