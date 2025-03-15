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
  }

  // Preprocess text by removing punctuation, converting to lowercase, and removing stopwords
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => !this.stopwords.has(word) && word.length > 2)
      .join(' ');
  }

  // Process reviews and create a TF-IDF vector
  processReviews(reviews) {
    // Add all reviews to TF-IDF
    reviews.forEach(review => {
      const processedText = this.preprocessText(review.text);
      this.tfidf.addDocument(processedText);
    });

    // Extract key terms and their weights
    const vector = {};
    const terms = new Set();

    // Get unique terms from all documents
    this.tfidf.documents.forEach(doc => {
      Object.keys(doc).forEach(term => terms.add(term));
    });

    // Calculate weights for each term
    terms.forEach(term => {
      let totalWeight = 0;
      this.tfidf.documents.forEach((_, index) => {
        totalWeight += this.tfidf.tfidf(term, index);
      });
      if (totalWeight > 0) {
        vector[term] = totalWeight / this.tfidf.documents.length;
      }
    });

    // Normalize vector weights
    const magnitude = Math.sqrt(
      Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0)
    );

    Object.keys(vector).forEach(term => {
      vector[term] = vector[term] / magnitude;
    });

    return {
      dimensions: Object.keys(vector),
      vector: vector
    };
  }

  // Process a single movie's reviews and generate its vector representation
  processMovie(movieData) {
    const { reviews } = movieData;
    
    // Process all reviews to create the movie's vector representation
    const { dimensions, vector } = this.processReviews(reviews);
    
    return {
      movieId: movieData.movie_id,
      movieName: movieData.movie_name,
      vector: vector,
      dimensions: dimensions
    };
  }
}

// Load and process the movie data
async function processMovieData() {
  try {
    const reviewsPath = join(__dirname, '../data/reviews.json');
    const rawData = await readFile(reviewsPath, 'utf8');
    const movieData = JSON.parse(rawData);
    
    const processor = new VectorProcessor();
    const movieVector = processor.processMovie(movieData);
    
    // Sort vector terms by weight and display
    const sortedTerms = Object.entries(movieVector.vector)
      .sort(([,a], [,b]) => b - a)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    console.log('\nTop terms by weight:');
    Object.entries(sortedTerms).forEach(([term, weight]) => {
      console.log(`${term}: ${weight.toFixed(4)}`);
    });


    const totalWeight = Object.values(sortedTerms)
      .reduce((sum, weight) => sum + weight, 0);
    console.log('\nSum of all weights:', totalWeight.toFixed(4));


    const sumOfSquares = Object.values(sortedTerms)
      .reduce((sum, weight) => sum + weight * weight, 0);
    console.log('\nSum of squares (should be 1.0):', sumOfSquares.toFixed(4));

    return movieVector;
  } catch (error) {
    console.error('Error processing movie data:', error);
    throw error;
  }
}

// Execute the processing
processMovieData().catch(console.error);

export default VectorProcessor;
