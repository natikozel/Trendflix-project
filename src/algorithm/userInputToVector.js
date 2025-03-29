import natural from 'natural';
import { english } from 'stopwords';
import { generateGeminiResponse } from './LLM.js';

class UserInputProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stopwords = new Set(english);
    // this.vectorProcessor = new VectorProcessor();
 
    this.weights = {
      keywords: 0.8,  
      genres: 0.15,  
      mood: 0.05     
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

  async processUserInput(input) {
    try {
      const {
        freeText,
        age,
        gender,
        preferredDuration,
        preferNewReleases,
        preferredLanguage,
        ...additionalParams
      } = input;

      // Create a more structured prompt for the LLM that will return data in a usable format
      const llmPrompt = `
        You are a movie recommendation system analyzing user input.
        Extract and classify the following from the user's request:
        
        1. Keywords: Identify the main meaningful words (nouns, adjectives, verbs) that describe what the user wants
        2. Genres: Identify any specific movie genres mentioned or implied (action, comedy, drama, sci-fi, etc.)
        3. Mood: Classify the overall mood the user is looking for (exciting, relaxing, intense, thought-provoking, etc.)
        4. Time/Duration preferences: Any mentions of movie length or time constraints
        5. Content preferences: Any specific themes, plot elements, or content types

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
            "timeConstraint": number in minutes or null
          }
        }

        User input: "${freeText}"
      `;

      // Get processed input from LLM
      const llmResponse = await generateGeminiResponse(llmPrompt);
      
      // Log the response for debugging
      console.log("LLM Processed Input:", JSON.stringify(llmResponse, null, 2));
      
      // Extract the processed structure from the LLM response
      const processedData = llmResponse.processedInput;
      
      // Create vector representation from the processed data
      const vector = {};
      
      // Add keyword weights
      if (processedData.keywords && processedData.keywords.length > 0) {
        // Create weighted keywords by mapping them to our existing knowledge of important terms
        processedData.keywords.forEach(keyword => {
          const baseWeight = this.importantTerms.has(keyword) ? 1.5 : 1.0;
          vector[keyword] = (this.weights.keywords * baseWeight) / Math.sqrt(processedData.keywords.length);
          
          // Add related concept terms
          Object.entries(this.conceptMappings).forEach(([concept, related]) => {
            if (related.includes(keyword)) {
              vector[concept] = (vector[concept] || 0) + 
                (this.weights.keywords * 0.6) / Math.sqrt(processedData.keywords.length);
              
              // Add other related terms with further reduced weights
              related.forEach(relatedTerm => {
                if (relatedTerm !== keyword) {
                  vector[relatedTerm] = (vector[relatedTerm] || 0) + 
                    (this.weights.keywords * 0.3) / Math.sqrt(processedData.keywords.length);
                }
              });
            }
          });
        });
      }
      
      // Add genre weights
      if (processedData.genres && processedData.genres.length > 0) {
        processedData.genres.forEach(genre => {
          vector[genre] = (this.weights.genres * 1.2) / Math.sqrt(processedData.genres.length);
          
          // Add related concept terms for genres
          Object.entries(this.conceptMappings).forEach(([concept, related]) => {
            if (related.includes(genre)) {
              vector[concept] = (vector[concept] || 0) +
                (this.weights.genres * 0.6) / Math.sqrt(processedData.genres.length);
            }
          });
        });
      }
      
      // Add mood weights
      if (processedData.moodScores) {
        const moodSum = 
          processedData.moodScores.positive +
          processedData.moodScores.negative +
          processedData.moodScores.neutral;
        
        if (moodSum > 0) {
          Object.entries(processedData.moodScores).forEach(([mood, score]) => {
            if (score > 0) {
              vector[mood] = (this.weights.mood * score) / moodSum;
            }
          });
        }
      }
      
      // Add demographic and preference information
      if (age) vector['age'] = age / 100; // Normalize age
      if (gender) vector[`gender_${gender}`] = 0.5;
      if (preferredDuration) vector['preferredDuration'] = preferredDuration / 200; // Normalize duration
      if (preferNewReleases) vector['newReleases'] = 0.5;
      if (preferredLanguage) vector[`language_${preferredLanguage.toLowerCase()}`] = 0.5;
      
      // Add any additional parameters
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (typeof value === 'number') {
          vector[key] = value / 10; // Normalize numeric values
        } else if (typeof value === 'boolean' && value) {
          vector[key] = 0.5;
        } else if (typeof value === 'string') {
          vector[`pref_${value.toLowerCase()}`] = 0.3;
        }
      });
      
      // Normalize vector using L2 normalization
      const magnitude = Math.sqrt(
        Object.values(vector).reduce((sum, weight) => sum + weight * weight, 0) || 1
      );
      
      Object.keys(vector).forEach(term => {
        vector[term] = vector[term] / magnitude;
      });
      
      // Combine processed data with the user's original input
      const result = {
        processedInput: {
          ...processedData,
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
      throw error;
    }
  }
}

export default UserInputProcessor;
