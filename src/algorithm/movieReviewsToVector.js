/**
 * Movie Review Vectorization Module
 * 
 * This module is responsible for converting movie reviews into high-dimensional
 * vector representations using TF-IDF (Term Frequency-Inverse Document Frequency).
 * These vectors capture the semantic content of movies based on their reviews,
 * enabling similarity calculations for recommendation purposes.
 * 
 * The vectorization process includes:
 * 1. Text preprocessing and normalization
 * 2. TF-IDF calculation for term importance
 * 3. Semantic concept mapping and expansion
 * 4. Vector normalization for consistent similarity calculations
 * 5. Integration of movie metadata
 * 
 * Key Features:
 * - TF-IDF-based content analysis
 * - Semantic concept mapping for related terms
 * - Domain-specific term weighting
 * - Robust error handling and fallbacks
 * - Support for compound words and special terms
 * 
 * @author Trendflix Team
 * @version 1.0.0
 */

import n from 'natural'
import { english } from 'stopwords';

/**
 * Vector Processor Class
 * 
 * This class handles the conversion of movie reviews into vector representations
 * that can be used for similarity calculations. It uses TF-IDF to identify
 * important terms in the reviews and creates weighted vectors that capture
 * the semantic content of each movie.
 * 
 * The processor implements several advanced features:
 * - Intelligent text preprocessing with compound word preservation
 * - TF-IDF-based term weighting
 * - Semantic concept mapping for related terms
 * - Domain-specific importance weighting
 * - Vector normalization for consistent calculations
 */
class VectorProcessor {
  constructor() {
    // Initialize TF-IDF processor for term frequency analysis
    this.tfidf = new n.TfIdf();
    this.dimensions = [];
    
    // Stopwords to filter out common, non-meaningful words
    this.stopwords = new Set(english);
    
    // Compound words that should be preserved (like 'sci-fi')
    this.preserveHyphenWords = ['sci-fi'];
    
    // High-importance terms that should receive boosted weights
    // These are domain-specific terms that strongly indicate movie content
    this.importantTerms = new Set([
      'space', 'time', 'journey', 'adventure', 'exploration',
      'science', 'future', 'technology', 'humanity', 'discovery',
      'mission', 'universe', 'cosmic', 'interstellar', 'stellar',
      'astronaut', 'spacecraft', 'planet', 'galaxy', 'dimension',
      'sci-fi', 'philosophical', 'emotional', 'psychological'
    ]);

    // Semantic concept mappings for related terms
    // This helps capture semantic relationships that simple TF-IDF might miss
    this.conceptMappings = {
      'space': ['universe', 'galaxy', 'cosmic', 'interstellar', 'planet', 'stellar'],
      'science': ['scientific', 'technology', 'physics', 'theoretical', 'quantum'],
      'adventure': ['journey', 'exploration', 'mission', 'discovery'],
      'emotional': ['touching', 'moving', 'powerful', 'heartfelt'],
      'complex': ['complicated', 'intricate', 'deep', 'thought-provoking']
    };
    
    console.log("VectorProcessor initialized");
  }

  /**
   * Preprocess text by removing punctuation, converting to lowercase, and removing stopwords
   * 
   * This method performs intelligent text preprocessing that:
   * - Converts text to lowercase for consistency
   * - Preserves important compound words (like 'sci-fi')
   * - Removes punctuation while maintaining word boundaries
   * - Filters out stopwords and short words
   * - Prepares text for TF-IDF processing
   * 
   * @param {string} text - Raw text to preprocess
   * @returns {string} - Preprocessed text ready for TF-IDF analysis
   */
  preprocessText(text) {
    let processedText = text.toLowerCase();

    // Preserve hyphenated words by replacing hyphen with a special marker
    // This prevents compound words like 'sci-fi' from being split
    this.preserveHyphenWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      processedText = processedText.replace(regex, word.replace('-', '_HYPHEN_'));
    });

    // Remove punctuation except our special marker
    processedText = processedText
      .replace(/[^\w\s_HYPHEN_]/g, '')
      .replace(/_HYPHEN_/g, '-');

    // Split into tokens and filter out stopwords and short words
    const tokens = processedText
      .split(/\s+/)
      .filter(word => !this.stopwords.has(word) && word.length > 2);

    // Join back into a string for TF-IDF processing
    return tokens.join(' ');
  }

  /**
   * Process reviews and create a TF-IDF vector representation
   * 
   * This method is the core of the vectorization process. It:
   * 1. Preprocesses all reviews in the collection
   * 2. Calculates TF-IDF scores for each term
   * 3. Applies semantic concept mapping
   * 4. Normalizes the resulting vector
   * 
   * TF-IDF (Term Frequency-Inverse Document Frequency) measures how important
   * a term is to a document in a collection. It considers both:
   * - How frequently a term appears in the document (TF)
   * - How rare the term is across all documents (IDF)
   * 
   * @param {Array} reviews - Array of review objects with text properties
   * @returns {Object} - Vector representation with dimensions and weights
   */
  processReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      console.error("No reviews found to process");
      // Return a minimal valid vector to prevent errors downstream
      return {
        dimensions: [],
        vector: {}
      };
    }
    
    // Reset TF-IDF processor for each batch of reviews
    this.tfidf = new n.TfIdf();
    
    // Add all reviews to TF-IDF for analysis
    reviews.forEach((review, index) => {
      if (!review || !review.text) {
        console.error(`Review at index ${index} is missing or has no text property`);
        return;
      }
      
      try {
        const processedText = this.preprocessText(review.text);
        this.tfidf.addDocument(processedText);
      } catch (error) {
        console.error(`Error processing review ${index}:`, error.message);
      }
    });
    
    if (this.tfidf.documents.length === 0) {
      console.error("No documents were successfully added to TF-IDF");
      return {
        dimensions: [],
        vector: {}
      };
    }

    // Extract key terms and their weights
    const vector = {};
    const terms = new Set();

    // Get unique terms from all documents
    this.tfidf.documents.forEach(doc => {
      Object.keys(doc).forEach(term => terms.add(term));
    });
    
    // Calculate TF-IDF weights for each term
    terms.forEach(term => {
      let totalWeight = 0;
      
      // Sum TF-IDF scores across all documents for this term
      this.tfidf.documents.forEach((_, index) => {
        totalWeight += this.tfidf.tfidf(term, index);
      });
      
      if (totalWeight > 0) {
        // Apply higher weights to important terms and their related concepts
        let importanceMultiplier = this.importantTerms.has(term) ? 1.5 : 1.0;
        
        // Check if term is related to any concepts and boost accordingly
        Object.entries(this.conceptMappings).forEach(([_, related]) => {
          if (related.includes(term)) {
            importanceMultiplier *= 1.2;
          }
        });

        // Calculate average weight and apply importance multiplier
        vector[term] = (totalWeight / this.tfidf.documents.length) * importanceMultiplier;

        // Add related concept terms with reduced weights through semantic mapping
        Object.entries(this.conceptMappings).forEach(([concept, related]) => {
          if (related.includes(term)) {
            vector[concept] = (vector[concept] || 0) + 
              ((totalWeight / this.tfidf.documents.length) * importanceMultiplier * 0.5);
          }
        });
      }
    });
    
    // Normalize vector weights using L2 normalization
    // This ensures consistent similarity calculations regardless of vector magnitude
    const magnitude = Math.sqrt(
      Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0) || 1
    );
    
    
    Object.keys(vector).forEach(term => {
      vector[term] = vector[term] / magnitude;
    });
  
    return {
      dimensions: Object.keys(vector),
      vector: vector
    };
  }

  /**
   * Process a single movie's reviews and generate its complete vector representation
   * 
   * This method combines the vectorization process with movie metadata to create
   * a comprehensive representation of the movie that includes both content-based
   * features (from reviews) and metadata features.
   * 
   * @param {Object} movieData - Movie data object containing reviews and metadata
   * @param {Array} movieData.reviews - Array of review objects
   * @param {string} movieData.movie_id - Unique movie identifier
   * @param {string} movieData.movie_name - Movie title
   * @param {string} movieData.poster_url - Movie poster URL
   * @param {number} movieData.popularity - Movie popularity score
   * @param {number} movieData.release_year - Movie release year
   * @param {number} movieData.duration - Movie duration in minutes
   * @param {Array} movieData.genres - Array of movie genres
   * @param {string} movieData.synopsis - Movie synopsis
   * @returns {Object} - Complete movie representation with vector and metadata
   */
  processMovie(movieData) {
    
    if (!movieData) {
      console.error("MovieData is undefined or null");
      throw new Error("Invalid movie data: undefined or null");
    }
    
    if (!movieData.reviews) {
      console.error("Movie has no reviews property");
      throw new Error("Missing reviews in movie data");
    }
    
    const { reviews } = movieData;
    
    // Process all reviews to create the movie's vector representation
    const { dimensions, vector } = this.processReviews(reviews);
    
    // Return complete movie representation with both vector and metadata
    return {
      movieId: movieData.movie_id,
      movieName: movieData.movie_name,      
      posterUrl : movieData.poster_url,
      rating : movieData.popularity,
      releaseYear: movieData.release_year,
      duration: movieData.duration,
      genres: movieData.genres,
      synopsis: movieData.synopsis,
      reviews: reviews,
      vector: vector,
      dimensions: dimensions
    };
  }
}

export default VectorProcessor;
