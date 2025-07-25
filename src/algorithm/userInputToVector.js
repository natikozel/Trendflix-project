/**
 * User Input Processing and Vectorization Module
 * 
 * This module is responsible for converting natural language user input into
 * high-dimensional vectors that can be compared with movie review vectors.
 * It uses a combination of NLP techniques and LLM processing to extract
 * meaningful features from user preferences.
 * 
 * The processing pipeline includes:
 * 1. Text preprocessing and tokenization
 * 2. Keyword extraction and weighting
 * 3. Genre identification and classification
 * 4. Mood analysis and sentiment scoring
 * 5. LLM-enhanced preference extraction
 * 6. Vector normalization and feature engineering
 * 
 * Key Features:
 * - Semantic concept mapping for related terms
 * - Multi-level keyword weighting based on importance
 * - LLM-powered movie title extraction
 * - Demographic and preference integration
 * - Robust error handling with fallback vectors
 * 
 * @author Trendflix Team
 * @version 1.0.0
 */

import natural from 'natural';
import { english } from 'stopwords';
import { generateGeminiResponse } from './LLM.js';

/**
 * User Input Processor Class
 * 
 * This class handles the complex task of converting user input (both text and
 * structured preferences) into a vector representation that can be used for
 * similarity calculations with movie vectors.
 * 
 * The processor uses multiple techniques:
 * - Traditional NLP (tokenization, stopword removal)
 * - Semantic concept mapping
 * - LLM-powered intelligent extraction
 * - Feature engineering for demographics and preferences
 */
class UserInputProcessor {
  constructor() {
    // Initialize NLP components
    this.tokenizer = new natural.WordTokenizer();
    this.stopwords = new Set(english);
 
    // Feature weighting scheme for different input types
    this.weights = {
      keywords: 0.8,    // Main content words from user text
      genres: 0.15,     // Genre preferences (explicit or inferred)
      mood: 0.05        // Emotional tone and mood indicators
    };

    // Comprehensive genre vocabulary with related terms
    this.genres = new Set([
      'action', 'adventure', 'animation', 'comedy', 'crime',
      'documentary', 'drama', 'fantasy', 'horror', 'mystery',
      'romance', 'sci-fi', 'thriller', 'space', 'scientific',
      'philosophical', 'emotional', 'psychological'
    ]);

    // Mood classification keywords for sentiment analysis
    this.moodKeywords = {
      positive: ['fun', 'happy', 'uplifting', 'light', 'inspiring', 'amazing', 'brilliant', 'innovative', 'groundbreaking', 'masterpiece'],
      negative: ['dark', 'serious', 'intense', 'heavy', 'tragic', 'complex', 'challenging', 'thought-provoking'],
      neutral: ['thoughtful', 'complex', 'intelligent', 'artistic', 'philosophical', 'technical', 'scientific', 'dramatic']
    };

    // Semantic concept mappings for related terms
    // This helps capture semantic relationships that simple keyword matching might miss
    this.conceptMappings = {
      'space': ['universe', 'galaxy', 'cosmic', 'interstellar', 'planet', 'stellar'],
      'science': ['scientific', 'technology', 'physics', 'theoretical', 'quantum'],
      'adventure': ['journey', 'exploration', 'mission', 'discovery'],
      'emotional': ['touching', 'moving', 'powerful', 'heartfelt'],
      'complex': ['complicated', 'intricate', 'deep', 'thought-provoking']
    };

    // High-importance terms that should receive boosted weights
    // These are domain-specific terms that strongly indicate movie preferences
    this.importantTerms = new Set([
      'space', 'time', 'journey', 'adventure', 'exploration',
      'science', 'future', 'technology', 'humanity', 'discovery',
      'mission', 'universe', 'cosmic', 'interstellar', 'stellar',
      'astronaut', 'spacecraft', 'planet', 'galaxy', 'dimension'
    ]);
  }

  /**
   * Custom tokenization with special handling for compound words
   * 
   * This method performs intelligent tokenization that:
   * - Preserves important compound words (like 'sci-fi')
   * - Removes punctuation while maintaining word boundaries
   * - Converts to lowercase for consistency
   * - Filters out empty tokens
   * 
   * @param {string} text - Input text to tokenize
   * @returns {Array<string>} - Array of processed tokens
   */
  customTokenize(text) {
    if (!text || typeof text !== 'string') return [];
    
    const preserveHyphenWords = ['sci-fi'];
    let processedText = text.toLowerCase();
    
    preserveHyphenWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      processedText = processedText.replace(regex, word.replace('-', '_HYPHEN_'));
    });

    processedText = processedText
      .replace(/[^\w\s_HYPHEN_]/g, '')
      .replace(/_HYPHEN_/g, '-');

    return processedText
      .split(/\s+/)
      .filter(token => token.length > 0)
      .map(token => token.toLowerCase());
  }

  /**
   * Extract and weight keywords from user input
   * 
   * This method identifies meaningful keywords and applies semantic concept mapping
   * to capture related terms that might not be explicitly mentioned but are
   * semantically related to the user's preferences.
   * 
   * @param {string} text - User input text
   * @returns {Array<Object>} - Array of keywords with weights
   */
  extractKeywords(text) {
    if (!text) return [];
    
    const tokens = this.customTokenize(text);
    const keywords = tokens.filter(word => 
      !this.stopwords.has(word) && 
      word.length >= 2
    );
    
    const processedKeywords = new Map();
    
    keywords.forEach(word => {
      const baseWeight = this.importantTerms.has(word) ? 1.5 : 1.0;
      processedKeywords.set(word, baseWeight);
      
      // Add related concept terms through semantic mapping
      Object.entries(this.conceptMappings).forEach(([concept, related]) => {
        if (related.includes(word)) {
          const conceptWeight = (processedKeywords.get(concept) || 0) + (baseWeight * 0.5);
          processedKeywords.set(concept, conceptWeight);
          
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

  /**
   * Identify genres mentioned in user input
   * 
   * @param {string} text - User input text
   * @returns {Array<string>} - Array of identified genres
   */
  identifyGenres(text) {
    if (!text) return [];
    
    const tokens = new Set(this.customTokenize(text));
    return Array.from(this.genres).filter(genre => 
      tokens.has(genre)
    );
  }

  /**
   * Analyze the emotional mood of user input
   * 
   * @param {string} text - User input text
   * @returns {Object} - Mood scores for positive, negative, and neutral
   */
  analyzeMood(text) {
    if (!text) return { positive: 0, negative: 0, neutral: 0 };
    
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

  /**
   * Main method to process user input into a vector representation
   * 
   * This method orchestrates the entire user input processing pipeline:
   * 1. Validates and structures input data
   * 2. Uses LLM to intelligently extract preferences
   * 3. Combines LLM insights with traditional NLP
   * 4. Creates a normalized vector representation
   * 5. Integrates demographic and preference data
   * 
   * @param {Object} input - User input object containing text and preferences
   * @param {string} input.freeText - Natural language description of preferences
   * @param {number} input.age - User's age
   * @param {string} input.gender - User's gender
   * @param {number} input.preferredDuration - Preferred movie duration
   * @param {boolean} input.preferNewReleases - Preference for newer movies
   * @param {string} input.preferredLanguage - Preferred language
   * @param {Array} input.genres - Explicit genre preferences
   * @returns {Promise<Object>} - Processed input with vector and metadata
   */
  async processUserInput(input) {
    try {
      if (!input || typeof input !== 'object') {
        throw new Error('Invalid input: must be an object');
      }

      const {
        freeText = '',
        age = 25,
        gender = 'any',
        preferredDuration = 120,
        preferNewReleases = false,
        preferredLanguage = 'English',
        genres = [],
        ...additionalParams
      } = input;

      // Create a structured prompt for the LLM to extract preferences intelligently
      const llmPrompt = `
        You are a movie recommendation system analyzing user input.
        
        FIRST STEP - INPUT VALIDATION:
        Evaluate if the user's input provides enough meaningful information to generate quality movie recommendations.
        The input should contain specific preferences, genres, themes, or movie qualities the user is interested in.
        
        Input quality requirements:
        - Must contain meaningful words (not just dots, single letters, or gibberish)
        - Must express actual movie preferences or interests
        - Must be specific enough to identify user tastes
        
        If the input fails these checks, return ONLY:
        {
          "validationError": true,
          "errorMessage": "Please provide more specific information about your movie preferences. For example, describe genres, themes, or movies you've enjoyed in the past."
        }
        
        SECOND STEP - ONLY IF INPUT IS VALID:
        Extract and classify the following from the user's request:
        
        1. Keywords: Identify the main meaningful words (nouns, adjectives, verbs) that describe what the user wants
        2. Genres: Identify any specific movie genres mentioned or implied (action, comedy, drama, sci-fi, etc.)
        3. Mood: Classify the overall mood the user is looking for (exciting, relaxing, intense, thought-provoking, etc.)
        4. Time/Duration preferences: Any mentions of movie length or time constraints
        5. Content preferences: Any specific themes, plot elements, or content types
        6. Movie Titles: Identify any specific movie titles mentioned by the user (these will be given higher priority)

        Return the result in JSON format with these exact keys:
        {
          "processedInput": {
            "keywords": ["keyword1", "keyword2", ...], 
            "genres": ["genre1", "genre2", ...],
            "moodScores": {
              "positive": number from 0-10,
              "negative": number from 0-10,
              "neutral": number from 0-10
            },
            "movieTitles": ["movie1", "movie2", ...] 
          }
        }

        User input: "${freeText}"
      `;

      const analysisResponse = await generateGeminiResponse(textAnalysisPrompt);
      
      console.log("Analysis Response:", JSON.stringify(analysisResponse, null, 2));
      
      if (analysisResponse?.validationError === true) {
        return {
          validationError: true,
          errorMessage: analysisResponse.errorMessage || "Please provide more specific information about your movie preferences."
        };
      }
      
      const processedData = {
        processedInput: {
          keywords: Array.isArray(analysisResponse?.processedInput?.keywords) ? analysisResponse.processedInput.keywords : [],
          genres: Array.isArray(analysisResponse?.processedInput?.genres) ? analysisResponse.processedInput.genres : [],
          moodScores: {
            positive: Number(analysisResponse?.processedInput?.moodScores?.positive) || 0,
            negative: Number(analysisResponse?.processedInput?.moodScores?.negative) || 0,
            neutral: Number(analysisResponse?.processedInput?.moodScores?.neutral) || 0
          },
          movieTitles: Array.isArray(analysisResponse?.processedInput?.movieTitles) ? analysisResponse.processedInput.movieTitles : [],
          timeConstraint: Number(analysisResponse?.processedInput?.timeConstraint) || null
        }
      };
      
      const vector = {};
      
      // Add movie titles as high-weight keywords (strongest signal)
      if (processedData.processedInput.movieTitles.length > 0) {
        processedData.processedInput.movieTitles.forEach(title => {
          vector[`title_${title.toLowerCase().replace(/\s+/g, '_')}`] = 2.0;
          
          const titleWords = title.toLowerCase().split(/\s+/);
          titleWords.forEach(word => {
            if (word.length > 3) {
              vector[word] = (vector[word] || 0) + 1.0;
            }
          });
        });
      }
      
      // Add keyword weights with semantic concept expansion
      if (processedData.processedInput.keywords.length > 0) {
        processedData.processedInput.keywords.forEach(keyword => {
          const baseWeight = this.importantTerms.has(keyword) ? 1.5 : 1.0;
          vector[keyword] = (this.weights.keywords * baseWeight) / Math.sqrt(processedData.processedInput.keywords.length);
          
          // Add related concept terms through semantic mapping
          Object.entries(this.conceptMappings).forEach(([concept, related]) => {
            if (related.includes(keyword)) {
              vector[concept] = (vector[concept] || 0) + 
                (this.weights.keywords * 0.6) / Math.sqrt(processedData.processedInput.keywords.length);
              
              related.forEach(relatedTerm => {
                if (relatedTerm !== keyword) {
                  vector[relatedTerm] = (vector[relatedTerm] || 0) + 
                    (this.weights.keywords * 0.3) / Math.sqrt(processedData.processedInput.keywords.length);
                }
              });
            }
          });
        });
      }
      
      // Add genre weights (combine LLM-extracted and user-provided genres)
      if (processedData.processedInput.genres.length > 0) {
        const allGenres = [...new Set([
          ...processedData.processedInput.genres,
          ...(Array.isArray(genres) ? genres : [])
        ])].map(g => g.toLowerCase());

        allGenres.forEach(genre => {
          vector[genre] = (this.weights.genres * 1.2) / Math.sqrt(allGenres.length);
          
          Object.entries(this.conceptMappings).forEach(([concept, related]) => {
            if (related.includes(genre)) {
              vector[concept] = (vector[concept] || 0) +
                (this.weights.genres * 0.6) / Math.sqrt(allGenres.length);
            }
          });
        });
      }
      
      // Add mood weights based on emotional tone analysis
      const moodScores = processedData.processedInput.moodScores;
      const moodSum = moodScores.positive + moodScores.negative + moodScores.neutral;
      
      if (moodSum > 0) {
        Object.entries(moodScores).forEach(([mood, score]) => {
          if (score > 0) {
            vector[mood] = (this.weights.mood * score) / moodSum;
          }
        });
      }
      
      // Add demographic and preference information as additional features
      if (age) vector['age'] = age / 100; // Normalize age to 0-1 range
      if (gender) vector[`gender_${gender}`] = 0.5;
      if (preferredDuration) vector['preferredDuration'] = preferredDuration / 200;
      if (preferNewReleases) vector['newReleases'] = 0.5;
      if (preferredLanguage) vector[`language_${preferredLanguage.toLowerCase()}`] = 0.5;
      
      // Add any additional parameters as features
      if (additionalParams && typeof additionalParams === 'object') {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (typeof value === 'number') {
            vector[key] = value / 10;
          } else if (typeof value === 'boolean' && value) {
            vector[key] = 0.5;
          } else if (typeof value === 'string') {
            vector[`pref_${value.toLowerCase()}`] = 0.3;
          }
        });
      }

      // Normalize vector using L2 normalization for consistent similarity calculations
      const magnitude = Math.sqrt(
        Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0) || 1
      );
      
      Object.keys(vector).forEach(term => {
        vector[term] = vector[term] / magnitude;
      });
      
      const result = {
        processedInput: {
          ...processedData.processedInput,
          demographics: {
            age,
            gender
          },
          preferences: {
            preferredDuration,
            preferNewReleases,
            preferredLanguage,
            ...additionalParams
          }
        },
        vector
      };
      
      return result;
    } catch (error) {
      console.error('Error processing user input:', error);
      // Return a default vector with basic preferences as fallback
      return {
        processedInput: {
          keywords: [],
          genres: [],
          moodScores: { positive: 0, negative: 0, neutral: 0 },
          movieTitles: [],
          timeConstraint: null,
          demographics: {
            age: 25,
            gender: 'any'
          },
          preferences: {
            preferredDuration: 120,
            preferNewReleases: false,
            preferredLanguage: 'English'
          }
        },
        vector: {
          age: 0.25,
          gender_any: 0.5,
          preferredDuration: 0.6,
          newReleases: 0,
          language_english: 0.5
        }
      };
    }
  }
}

export default UserInputProcessor;
