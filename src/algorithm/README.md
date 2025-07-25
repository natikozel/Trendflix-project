# Trendflix Recommendation Algorithm Documentation

## Overview

The algorithm folder contains the core recommendation engine for the Trendflix platform. This system implements a sophisticated hybrid recommendation approach that combines content-based filtering, collaborative filtering, and LLM-enhanced preference extraction.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │  Movie Reviews  │    │   User Feedback │
│   Processing    │    │  Vectorization  │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  LLM Analysis   │    │   TF-IDF Calc   │    │ Similarity Calc │
│  & Extraction   │    │  & Normalize    │    │  & Weighting    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Recommendation Engine                       │
│  • Cosine Similarity Calculation                              │
│  • Metadata-based Weighting                                   │
│  • Feedback-weighted Adjustments                              │
│  • Final Ranking & Filtering                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

### Core Recommendation Engine
- **`recommender.js`** - Main recommendation orchestrator
- **`userInputToVector.js`** - User input processing and vectorization
- **`movieReviewsToVector.js`** - TF-IDF vectorization of movie reviews

### LLM Integration
- **`LLM.js`** - Google Gemini API integration
- **`getGenreVector.js`** - LLM-based genre vector generation
- **`matchUserPreference.js`** - LLM-powered preference matching

### Feedback System
- **`feedbackUtils.js`** - User feedback integration and similarity analysis

## 🧠 Algorithm Details

### 1. User Input Processing (`userInputToVector.js`)

**Purpose**: Converts natural language user input into high-dimensional vectors

**Process**:
1. **Text Preprocessing**: Tokenization, stopword removal, compound word preservation
2. **LLM Analysis**: Extracts preferences, genres, movie titles, and mood
3. **Feature Engineering**: Combines LLM insights with demographic data
4. **Vector Normalization**: L2 normalization for consistent similarity calculations

**Key Features**:
- Semantic concept mapping for related terms
- Multi-level keyword weighting
- LLM-powered movie title extraction
- Demographic and preference integration

**Example**:
```javascript
// User input: "I love sci-fi movies with space exploration like Interstellar"
// LLM extracts: { keywords: ["sci-fi", "space", "exploration"], 
//                movieTitles: ["Interstellar"], 
//                genres: ["sci-fi", "adventure"] }
// Vector: { "sci-fi": 0.15, "space": 0.12, "interstellar": 0.20, ... }
```

### 2. Movie Review Vectorization (`movieReviewsToVector.js`)

**Purpose**: Converts movie reviews into TF-IDF vectors representing content characteristics

**Process**:
1. **Text Preprocessing**: Lowercase conversion, punctuation removal, stopword filtering
2. **TF-IDF Calculation**: Term frequency × inverse document frequency
3. **Semantic Expansion**: Adds related concept terms through mapping
4. **Vector Normalization**: L2 normalization for similarity calculations

**Key Features**:
- TF-IDF-based content analysis
- Semantic concept mapping
- Domain-specific term weighting
- Compound word preservation

**Example**:
```javascript
// Movie reviews: ["Amazing space exploration", "Great sci-fi effects"]
// TF-IDF Vector: { "space": 0.18, "exploration": 0.15, "sci-fi": 0.12, ... }
```

### 3. Recommendation Engine (`recommender.js`)

**Purpose**: Orchestrates the entire recommendation process

**Process**:
1. **User Vector Creation**: Process user input into vector representation
2. **Movie Vector Retrieval**: Get pre-computed movie vectors from database
3. **Similarity Calculation**: Cosine similarity between user and movie vectors
4. **Metadata Weighting**: Apply genre, year, duration, and other weights
5. **Feedback Integration**: Adjust scores based on user feedback
6. **Final Ranking**: Sort and return top recommendations

**Key Features**:
- Multi-factor similarity calculation
- Metadata-based weighting system
- Feedback-weighted adjustments
- Age-appropriate content filtering

**Example**:
```javascript
// User vector: { "sci-fi": 0.15, "space": 0.12, ... }
// Movie vector: { "space": 0.18, "exploration": 0.15, ... }
// Cosine similarity: 0.85
// Metadata weighting: +0.1 (genre match), +0.05 (year preference)
// Final score: 0.95
```

### 4. LLM Integration (`LLM.js`)

**Purpose**: Provides natural language understanding capabilities

**Process**:
1. **Prompt Engineering**: Structured prompts for specific tasks
2. **API Communication**: Google Gemini API integration
3. **Response Processing**: JSON parsing and validation
4. **Error Handling**: Robust fallback mechanisms

**Key Features**:
- Structured JSON response parsing
- Response text cleaning and normalization
- Error handling and fallbacks
- Integration with Google Gemini API

### 5. Genre Vector Generation (`getGenreVector.js`)

**Purpose**: Creates 21-dimensional genre vectors for movies using LLM analysis

**Process**:
1. **Review Loading**: Load movie reviews from JSON files
2. **LLM Analysis**: Structured prompt for genre attribute extraction
3. **Vector Generation**: 21 normalized attributes summing to 1.0
4. **Database Storage**: Persist vectors for recommendation use

**Key Features**:
- 21-dimensional genre attribute analysis
- LLM-powered content understanding
- Normalized vector generation
- Batch processing capabilities

**Attributes**:
- Content: Action, Romance, SciFiFantasy, Comedy, ThrillerSuspense
- Emotional: EmotionalDepth, StoryDarkness, Horror
- Technical: VisualEffects, CinematicScore, DialogueComplexity
- Audience: FamilyFriendliness, Violence, CognitiveLoad
- Structural: Pace, DialogueVsAction, TwistFactor, MovieLength
- Thematic: PoliticalSocial, Realism, HumorType

### 6. User Preference Matching (`matchUserPreference.js`)

**Purpose**: Analyzes how well a movie matches user preferences using LLM

**Process**:
1. **Genre Vector Retrieval**: Get movie's 21-dimensional genre vector
2. **LLM Analysis**: Compare movie characteristics with user input
3. **Match Scoring**: Generate precise match score (0.00-1.00)
4. **Validation**: Ensure score is within valid bounds

**Key Features**:
- LLM-powered preference analysis
- Genre vector integration
- Precise match scoring
- Natural language understanding

### 7. Feedback Integration (`feedbackUtils.js`)

**Purpose**: Integrates user feedback to improve future recommendations

**Process**:
1. **Feedback Retrieval**: Get all feedback for a specific movie
2. **User Similarity**: Calculate similarity between current user and feedback providers
3. **Weighted Adjustment**: Apply feedback based on user similarity
4. **Score Normalization**: Ensure scores remain within bounds

**Key Features**:
- Multi-factor user similarity calculation
- Weighted feedback integration
- Demographic and preference-based matching
- Semantic text similarity analysis

**Similarity Factors**:
- Genre preferences (Jaccard similarity)
- Age similarity (linear decay)
- Language preferences (exact match)
- Release year preferences (overlap analysis)
- Duration preferences (linear decay)
- Text-based preferences (Jaccard similarity)

## 🔧 Configuration Parameters

### Recommendation Engine
```javascript
const options = {
  maxResults: 6,              // Number of recommendations
  similarityThreshold: 0.03,  // Minimum similarity score
  includeMetadata: true,      // Include movie metadata
  useFeedbackData: true       // Enable feedback integration
};
```

### Vector Processing
```javascript
// Important terms for boosted weighting
const importantTerms = new Set([
  'space', 'time', 'journey', 'adventure',
  'science', 'future', 'technology', 'humanity'
]);

// Semantic concept mappings
const conceptMappings = {
  'space': ['universe', 'galaxy', 'cosmic', 'interstellar'],
  'science': ['scientific', 'technology', 'physics', 'theoretical']
};
```

### LLM Integration
```javascript
// Model configuration
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-preview-04-17' 
});
```

## 📊 Performance Metrics

### Similarity Score Distribution
- **High Similarity (0.8-1.0)**: Excellent matches
- **Medium Similarity (0.4-0.8)**: Good matches
- **Low Similarity (0.0-0.4)**: Poor matches

### Feedback Impact
- **Positive Feedback**: Boosts similar movie scores
- **Negative Feedback**: Reduces similar movie scores
- **User Similarity**: Weights feedback impact

### Processing Performance
- **Vector Generation**: ~2-3 seconds per movie
- **Recommendation Generation**: ~1-2 seconds
- **LLM Analysis**: ~3-5 seconds per request

## 🛠️ Development Guidelines

### Adding New Features

1. **Algorithm Enhancements**
   - Modify core files in the algorithm folder
   - Update similarity calculations as needed
   - Add new weighting factors to `recommender.js`

2. **LLM Integration**
   - Create structured prompts in new files
   - Use `generateGeminiResponse()` for API calls
   - Implement proper error handling

3. **Vector Processing**
   - Add new terms to `importantTerms` sets
   - Update `conceptMappings` for semantic relationships
   - Modify TF-IDF processing as needed

### Testing Recommendations

```javascript
// Test user input processing
const userProcessor = new UserInputProcessor();
const result = await userProcessor.processUserInput({
  freeText: "I love sci-fi movies",
  age: 25,
  genres: ["sci-fi", "adventure"]
});

// Test recommendation generation
const recommender = new Recommender();
const recommendations = await recommender.getRecommendations(userInput, {
  maxResults: 5,
  similarityThreshold: 0.05
});
```

### Debugging

1. **Enable Logging**: Check console output for processing steps
2. **Vector Inspection**: Log vector contents for analysis
3. **Similarity Debugging**: Track similarity calculations
4. **LLM Response**: Validate LLM response format

## 🔮 Future Enhancements

### Planned Improvements

1. **Advanced NLP**: Implement more sophisticated text analysis
2. **Deep Learning**: Add neural network-based similarity
3. **Real-time Learning**: Continuous model updates
4. **Multi-modal**: Include image and audio analysis
5. **Personalization**: User-specific model adaptation

### Research Areas

1. **Semantic Similarity**: Advanced semantic understanding
2. **Contextual Analysis**: Temporal and cultural context
3. **Ensemble Methods**: Multiple algorithm combination
4. **A/B Testing**: Recommendation quality measurement
5. **Scalability**: Performance optimization for large datasets

---

**Note**: This documentation is maintained by the Trendflix development team. For questions or contributions, please refer to the main project README. 