import n from 'natural'
import { english } from 'stopwords';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VectorProcessor {
  constructor() {
    this.tfidf = new n.TfIdf();
    this.dimensions = [];
    this.stopwords = new Set(english);
    this.preserveHyphenWords = ['sci-fi'];
    
    // Add important terms that should get higher weights
    this.importantTerms = new Set([
      'space', 'time', 'journey', 'adventure', 'exploration',
      'science', 'future', 'technology', 'humanity', 'discovery',
      'mission', 'universe', 'cosmic', 'interstellar', 'stellar',
      'astronaut', 'spacecraft', 'planet', 'galaxy', 'dimension',
      'sci-fi', 'philosophical', 'emotional', 'psychological'
    ]);

    // Add concept mappings to handle semantic relationships
    this.conceptMappings = {
      'space': ['universe', 'galaxy', 'cosmic', 'interstellar', 'planet', 'stellar'],
      'science': ['scientific', 'technology', 'physics', 'theoretical', 'quantum'],
      'adventure': ['journey', 'exploration', 'mission', 'discovery'],
      'emotional': ['touching', 'moving', 'powerful', 'heartfelt'],
      'complex': ['complicated', 'intricate', 'deep', 'thought-provoking']
    };
    
    console.log("VectorProcessor initialized");
  }

  // Preprocess text by removing punctuation, converting to lowercase, and removing stopwords
  preprocessText(text) {
    // console.log(`Preprocessing text (${text.length} characters)`);
    
    let processedText = text.toLowerCase();

    // Preserve hyphenated words by replacing hyphen with a special marker
    this.preserveHyphenWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      processedText = processedText.replace(regex, word.replace('-', '_HYPHEN_'));
    });

    // Remove punctuation except our special marker
    processedText = processedText
      .replace(/[^\w\s_HYPHEN_]/g, '')
      .replace(/_HYPHEN_/g, '-');

    // Split into tokens and filter
    const tokens = processedText
      .split(/\s+/)
      .filter(word => !this.stopwords.has(word) && word.length > 2);
    
    // console.log(`Preprocessed to ${tokens.length} tokens`);

    // Join back into a string for TF-IDF processing
    return tokens.join(' ');
  }

  // Process reviews and create a TF-IDF vector
  processReviews(reviews) {
    console.log(`Processing ${reviews ? reviews.length : 'undefined'} reviews`);
    
    if (!reviews || reviews.length === 0) {
      console.error("No reviews found to process");
      // Return a minimal valid vector to prevent errors downstream
      return {
        dimensions: [],
        vector: {}
      };
    }
    
    // Add all reviews to TF-IDF
    this.tfidf = new n.TfIdf(); // Reset TF-IDF for each batch of reviews
    
    reviews.forEach((review, index) => {
      if (!review || !review.text) {
        console.error(`Review at index ${index} is missing or has no text property`);
        return;
      }
      
      try {
        const processedText = this.preprocessText(review.text);
        this.tfidf.addDocument(processedText);
        // console.log(`Added review ${index+1}/${reviews.length} (${processedText.length} characters)`);
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

    console.log(`Successfully processed ${this.tfidf.documents.length} reviews`);

    // Extract key terms and their weights
    const vector = {};
    const terms = new Set();

    // Get unique terms from all documents
    this.tfidf.documents.forEach(doc => {
      Object.keys(doc).forEach(term => terms.add(term));
    });
    
    console.log(`Found ${terms.size} unique terms across all reviews`);

    // Calculate weights for each term
    terms.forEach(term => {
      let totalWeight = 0;
      this.tfidf.documents.forEach((_, index) => {
        totalWeight += this.tfidf.tfidf(term, index);
      });
      
      if (totalWeight > 0) {
        // Apply higher weights to important terms and their related concepts
        let importanceMultiplier = this.importantTerms.has(term) ? 1.5 : 1.0;
        
        // Check if term is related to any concepts and boost accordingly
        Object.entries(this.conceptMappings).forEach(([concept, related]) => {
          if (related.includes(term)) {
            importanceMultiplier *= 1.2;
          }
        });

        vector[term] = (totalWeight / this.tfidf.documents.length) * importanceMultiplier;

        // Add related concept terms with reduced weights
        Object.entries(this.conceptMappings).forEach(([concept, related]) => {
          if (related.includes(term)) {
            vector[concept] = (vector[concept] || 0) + 
              ((totalWeight / this.tfidf.documents.length) * importanceMultiplier * 0.5);
          }
        });
      }
    });
    
    console.log(`Created vector with ${Object.keys(vector).length} dimensions`);

    // Normalize vector weights
    const magnitude = Math.sqrt(
      Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0) || 1
    );
    
    console.log(`Vector magnitude before normalization: ${magnitude.toFixed(4)}`);

    Object.keys(vector).forEach(term => {
      vector[term] = vector[term] / magnitude;
    });
    
    // Verify normalization
    const newMagnitude = Math.sqrt(
      Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0)
    );
    console.log(`Vector magnitude after normalization: ${newMagnitude.toFixed(4)} (should be 1.0)`);

    return {
      dimensions: Object.keys(vector),
      vector: vector
    };
  }

  // Process a single movie's reviews and generate its vector representation
  processMovie(movieData) {
    console.log(`Processing movie: ${movieData.movie_name || movieData.movie_id || 'Unknown'}`);
    
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
    
    console.log(`Finished processing movie. Created vector with ${dimensions.length} dimensions`);
    
    return {
      movieId: movieData.movie_id,
      movieName: movieData.movie_name,
      vector: vector,
      dimensions: dimensions
    };
  }
}

// // Load and process the movie data
// async function processMovieData() {
//   try {
//     const reviewsPath = join(__dirname, '../data/reviews.json');
//     const rawData = await readFile(reviewsPath, 'utf8');
//     const movieData = JSON.parse(rawData);
    
//     const processor = new VectorProcessor();
//     const movieVector = processor.processMovie(movieData);
    
//     // Sort vector terms by weight and display
//     // const sortedTerms = Object.entries(movieVector.vector)
//     //   .sort(([,a], [,b]) => b - a)
//     //   .reduce((obj, [key, value]) => {
//     //     obj[key] = value;
//     //     return obj;
//     //   }, {});

//     // console.log('\nTop terms by weight:');
//     // Object.entries(sortedTerms).forEach(([term, weight]) => {
//     //   console.log(`${term}: ${weight.toFixed(4)}`);
//     // });
//     //
//     //
//     // const totalWeight = Object.values(sortedTerms)
//     //   .reduce((sum, weight) => sum + weight, 0);
//     // console.log('\nSum of all weights:', totalWeight.toFixed(4));
//     //
//     //
//     // const sumOfSquares = Object.values(sortedTerms)
//     //   .reduce((sum, weight) => sum + weight * weight, 0);
//     // console.log('\nSum of squares (should be 1.0):', sumOfSquares.toFixed(4));

//     return movieVector;
//   } catch (error) {
//     console.error('Error processing movie data:', error);
//     throw error;
//   }
// }

// // Execute the processing
// processMovieData().catch(console.error);

export default VectorProcessor;
