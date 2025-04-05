/**
 * Vector Database for storing and retrieving movie vectors
 * This reduces computation time by avoiding reprocessing movies for each recommendation
 */
class VectorDatabase {
  constructor() {
    this.vectorStore = new Map();
    this.initialized = false;
  }

  // Store a movie vector in the database
  storeVector(movieId, vectorData) {
    if (!movieId) {
      console.error("Cannot store vector: Missing movieId");
      return false;
    }

    this.vectorStore.set(movieId, {
      ...vectorData,
      timestamp: Date.now()
    });
    return true;
  }

  // Retrieve a movie vector from the database
  getVector(movieId) {
    if (!movieId) return null;
    return this.vectorStore.get(movieId) || null;
  }

  // Check if a movie vector exists in the database
  hasVector(movieId) {
    return this.vectorStore.has(movieId);
  }

  // Initialize the database with a batch of movies
  async initializeWithMovies(movies, vectorProcessor) {
    console.log(`Initializing vector database with ${movies.length} movies...`);
    let processedCount = 0;

    for (const movie of movies) {
      if (!movie.movie_id) {
        console.warn("Movie missing ID, skipping", movie.movie_name);
        continue;
      }

      try {
        // Process and store the vector
        const movieVector = vectorProcessor.processMovie(movie);
        this.storeVector(movie.movie_id, movieVector);
        processedCount++;
      } catch (error) {
        console.error(`Error processing movie ${movie.movie_name || movie.movie_id}:`, error);
      }
    }

    this.initialized = true;
    console.log(`Vector database initialized with ${processedCount} movie vectors`);
    return processedCount;
  }

  // Get all stored vectors
  getAllVectors() {
    return Array.from(this.vectorStore.values());
  }

  // Get stats about the database
  getStats() {
    return {
      totalVectors: this.vectorStore.size,
      initialized: this.initialized,
      movieIds: Array.from(this.vectorStore.keys())
    };
  }
}

export default VectorDatabase; 