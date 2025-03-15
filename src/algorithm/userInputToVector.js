import natural from 'natural';
import { english } from 'stopwords';


class UserInputProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stopwords = new Set(english);
    // this.vectorProcessor = new VectorProcessor();
    
    // Adjust weights to give more importance to direct keyword matches
    this.weights = {
      keywords: 0.8,  // Increased from 0.6
      genres: 0.15,   // Reduced from 0.3
      mood: 0.05     // Reduced from 0.1
    };

    // Expanded genre set with related terms
    this.genres = new Set([
      'action', 'adventure', 'animation', 'comedy', 'crime',
      'documentary', 'drama', 'fantasy', 'horror', 'mystery',
      'romance', 'sci-fi', 'thriller', 'space', 'scientific',
      'philosophical', 'emotional', 'psychological'
    ]);

    // Expanded mood keywords with more nuanced terms
    this.moodKeywords = {
      positive: ['fun', 'happy', 'uplifting', 'light', 'inspiring', 'amazing', 'brilliant', 'innovative', 'groundbreaking', 'masterpiece'],
      negative: ['dark', 'serious', 'intense', 'heavy', 'tragic', 'complex', 'challenging', 'thought-provoking'],
      neutral: ['thoughtful', 'complex', 'intelligent', 'artistic', 'philosophical', 'technical', 'scientific', 'dramatic']
    };

    // Add concept mappings to handle semantic relationships
    this.conceptMappings = {
      'space': ['universe', 'galaxy', 'cosmic', 'interstellar', 'planet', 'stellar'],
      'science': ['scientific', 'technology', 'physics', 'theoretical', 'quantum'],
      'adventure': ['journey', 'exploration', 'mission', 'discovery'],
      'emotional': ['touching', 'moving', 'powerful', 'heartfelt'],
      'complex': ['complicated', 'intricate', 'deep', 'thought-provoking']
    };

    // Add common movie-related terms that should get higher weights
    this.importantTerms = new Set([
      'space', 'time', 'journey', 'adventure', 'exploration',
      'science', 'future', 'technology', 'humanity', 'discovery',
      'mission', 'universe', 'cosmic', 'interstellar', 'stellar',
      'astronaut', 'spacecraft', 'planet', 'galaxy', 'dimension'
    ]);
  }

  // preprocessText(text) {
  //   return this.vectorProcessor.preprocessText(text);
  // }

  customTokenize(text) {
    // First, temporarily replace hyphens in known compound words with a special marker
    const preserveHyphenWords = ['sci-fi'];
    let processedText = text.toLowerCase();
    
    preserveHyphenWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      processedText = processedText.replace(regex, word.replace('-', '_HYPHEN_'));
    });

    // Remove punctuation except our special marker
    processedText = processedText
      .replace(/[^\w\s_HYPHEN_]/g, '')
      .replace(/_HYPHEN_/g, '-');

    // Split into tokens and filter stopwords
    return processedText
      .split(/\s+/)
      .filter(token => token.length > 0)
      .map(token => token.toLowerCase());
  }

  extractKeywords(text) {
    const tokens = this.customTokenize(text);
    const keywords = tokens.filter(word => 
      !this.stopwords.has(word) && 
      word.length >= 2
    );
    
    // Process keywords and their related concepts
    const processedKeywords = new Map();
    
    keywords.forEach(word => {
      // Add the original word with its weight
      const baseWeight = this.importantTerms.has(word) ? 1.5 : 1.0;
      processedKeywords.set(word, baseWeight);
      
      // Add related concept terms
      Object.entries(this.conceptMappings).forEach(([concept, related]) => {
        if (related.includes(word)) {
          // Add the concept with a reduced weight
          const conceptWeight = (processedKeywords.get(concept) || 0) + (baseWeight * 0.5);
          processedKeywords.set(concept, conceptWeight);
          
          // Add other related terms with further reduced weights
          related.forEach(relatedTerm => {
            if (relatedTerm !== word) {
              const relatedWeight = (processedKeywords.get(relatedTerm) || 0) + (baseWeight * 0.3);
              processedKeywords.set(relatedTerm, relatedWeight);
            }
          });
        }
      });
    });
    
    return Array.from(processedKeywords.entries()).map(([term, weight]) => ({
      term,
      weight
    }));
  }

  identifyGenres(text) {
    const tokens = new Set(this.customTokenize(text));
    return Array.from(this.genres).filter(genre => 
      tokens.has(genre)
    );
  }

  analyzeMood(text) {
    const tokens = new Set(this.customTokenize(text));
    const moodScores = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    Object.entries(this.moodKeywords).forEach(([mood, keywords]) => {
      keywords.forEach(keyword => {
        if (tokens.has(keyword)) {
          moodScores[mood]++;
        }
      });
    });

    return moodScores;
  }

  processUserInput(input) {
    try {
      const {
        freeText,
        age,
        gender,
        preferredDuration,
        additionalParams = {}
      } = input;

      // Process free text input
      const keywords = this.extractKeywords(freeText);
      const genres = this.identifyGenres(freeText);
      const moodScores = this.analyzeMood(freeText);

      // Create vector representation
      const vector = {};
      
      // Add keyword weights with importance multiplier
      keywords.forEach(({term, weight}) => {
        vector[term] = (this.weights.keywords * weight) / Math.sqrt(keywords.length);
      });

      // Add genre weights with concept expansion
      genres.forEach(genre => {
        vector[genre] = (this.weights.genres * 1.2) / Math.sqrt(genres.length);
        
        // Add related concept terms for genres
        Object.entries(this.conceptMappings).forEach(([concept, related]) => {
          if (related.includes(genre)) {
            vector[concept] = (vector[concept] || 0) + 
              (this.weights.genres * 0.6) / Math.sqrt(genres.length);
          }
        });
      });

      // Add mood weights
      Object.entries(moodScores).forEach(([mood, score]) => {
        if (score > 0) {
          vector[mood] = (this.weights.mood * score) / 
            Math.sqrt(Object.values(moodScores).reduce((a, b) => a + b, 0));
        }
      });

      // Normalize vector using L2 normalization
      const magnitude = Math.sqrt(
        Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0)
      );

      Object.keys(vector).forEach(term => {
        vector[term] = vector[term] / magnitude;
      });

      return {
        processedInput: {
          keywords: keywords.map(k => k.term),
          genres,
          moodScores,
          demographics: {
            age,
            gender
          },
          preferences: {
            preferredDuration,
            ...additionalParams
          }
        },
        vector
      };
    } catch (error) {
      console.error('Error processing user input:', error);
      throw error;
    }
  }
}



export default UserInputProcessor;
