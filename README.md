# Trendflix - Advanced Movie Recommendation System

A sophisticated movie recommendation platform that leverages multiple machine learning algorithms and natural language processing techniques to provide highly personalized film recommendations based on user preferences, behavior, and contextual data.

## 🎯 Core Functionality

**Trendflix** is an intelligent movie recommendation engine that combines:
- **Semantic Analysis** of user input using Natural Language Processing
- **Vector-based Similarity Matching** using TF-IDF and cosine similarity
- **Content-based Filtering** with weighted metadata scoring
- **Hybrid Recommendation** combining multiple algorithmic approaches
- **Real-time Personalization** with feedback learning

## 🧠 Key Algorithms & Techniques

### 1. Text Processing & Vectorization
- **TF-IDF (Term Frequency-Inverse Document Frequency)** for content analysis
- **Natural Language Processing** using the `natural` library for tokenization
- **Stopword filtering** and custom vocabulary processing
- **Semantic keyword extraction** with concept mapping

### 2. Similarity Computation
- **Cosine Similarity** for vector comparison between user preferences and movie content
- **Multi-dimensional similarity** for comprehensive matching
- **Custom similarity algorithms** for algorithm selection based on data characteristics

### 3. Machine Learning Integration
- **Google Gemini AI** integration for advanced natural language understanding
- **Vector database** for efficient similarity searches
- **Feedback learning system** for continuous improvement

### 4. Recommendation Scoring
- **Multi-factor scoring** combining content similarity, metadata matching, and user preferences
- **Weighted boosting** for genre matching, release year preferences, and popularity
- **Dynamic filtering** for excluded content and user constraints

## 📁 Core Code Structure

### Critical Algorithm Files (src/algorithm/)
```
📁 algorithm/
├── 🔥 recommender.js              # Main recommendation engine (447 lines)
├── 🔥 userInputToVector.js        # User input processing & vectorization (490 lines)
├── 🔥 movieReviewsToVector.js     # Movie content vectorization (286 lines)
├── 🔥 vectorComparison.js         # Similarity computation algorithms (196 lines)
├── 🔥 feedbackUtils.js            # User feedback processing (238 lines)
├── getGenreVector.js              # Genre-based vectorization (360 lines)
├── userPreferenceAnalyzer.js      # Preference pattern analysis (100 lines)
├── matchUserPreference.js         # Preference matching algorithms (131 lines)
├── LLM.js                         # Gemini AI integration (100 lines)
└── README.md                      # Algorithm documentation (319 lines)
```

### Application Architecture (src/)
```
📁 src/
├── 📁 app/                        # Next.js App Router
│   ├── page.tsx                   # Main application entry
│   ├── api/                       # API endpoints
│   │   ├── recommend/             # Recommendation API
│   │   └── movies/                # Movie data API
│   ├── movie/                     # Movie detail pages
│   ├── recommend/                 # Recommendation interface
│   └── actions/                   # Server actions
├── 📁 components/                 # React UI components
│   ├── recommend/                 # Recommendation interface
│   ├── movies/                    # Movie display components
│   ├── movie/                     # Movie detail components
│   ├── admin/                     # Admin dashboard components
│   ├── common/                    # Shared components
│   └── ui/                        # Reusable UI components
├── 📁 lib/                        # Core services
│   └── db/                        # Database layer
│       ├── models/                # Data models
│       └── services/              # Business logic services
│           ├── MovieDatabaseService.js
│           ├── VectorDatabaseService.js
│           ├── FeedbackService.js
│           └── genreVectorService.js
├── 📁 data/                       # Movie dataset (200+ movie review files)
├── 📁 store/                      # Redux state management
└── 📁 scripts/                    # Database initialization
```

## 🔬 Algorithm Deep Dive

### 1. [User Input Processing](https://github.com/natikozel/trendflix/blob/production/src/algorithm/userInputToVector.js) (`userInputToVector.js`)
**Purpose**: Converts natural language user preferences into mathematical vectors
**Key Functions**:
- `processUserInput()` - Main processing pipeline
- `extractKeywords()` - Semantic keyword extraction with concept mapping
- `identifyGenres()` - Genre classification from text
- `analyzeMood()` - Sentiment analysis for mood-based recommendations

**Algorithm**: Uses NLP tokenization, stopword filtering, and semantic expansion to create weighted keyword vectors.

### 2. [Movie Content Vectorization](https://github.com/natikozel/trendflix/blob/production/src/algorithm/movieReviewsToVector.js) (`movieReviewsToVector.js`)
**Purpose**: Transforms movie reviews and metadata into searchable vectors
**Key Functions**:
- `processMovie()` - Complete movie processing pipeline
- `calculateTFIDF()` - TF-IDF calculation for movie content
- `normalizeVector()` - Vector normalization for comparison

**Algorithm**: Implements TF-IDF with custom weighting for movie-specific terms and metadata integration.

### 3. [Recommendation Engine](https://github.com/natikozel/trendflix/blob/production/src/algorithm/recommender.js) (`recommender.js`)
**Purpose**: Core recommendation logic combining multiple algorithms
**Key Functions**:
- `getRecommendations()` - Main recommendation pipeline
- `calculateCosineSimilarity()` - Vector similarity computation
- `applyMetadataWeights()` - Multi-factor scoring with dynamic weighting
- `applyPrecomputedFeedbackAdjustment()` - Feedback-based score adjustment

**Algorithm**: Hybrid approach combining cosine similarity, metadata boosting, and feedback learning.

### 4. [Similarity Computation](https://github.com/natikozel/trendflix/blob/production/src/algorithm/vectorComparison.js) (`vectorComparison.js`)
**Purpose**: Advanced similarity measurements between user preferences and movies
**Key Functions**:
- `compareGenreVectors()` - Genre-specific comparison
- `computeWeightedSimilarity()` - Multi-dimensional similarity scoring
- `calculateSimilarity()` - Core similarity calculation

## 📊 Data Processing Pipeline

1. **Data Ingestion** (`scripts/initializeMovieDatabase.js`)
   - Loads 200+ movie files with reviews and metadata
   - Processes ~100,000+ individual movie reviews
   - Creates TF-IDF vectors for each movie

2. **Vector Storage** (`lib/db/services/VectorDatabaseService.js`)
   - Stores computed vectors in MongoDB
   - Implements efficient similarity search
   - Manages vector updates and retrieval

3. **Real-time Processing** (`app/api/recommend/`)
   - Processes user input in real-time
   - Computes similarity scores against entire database
   - Returns ranked recommendations with explanations

## 🧪 Testing & Validation

The system includes comprehensive testing:
```
📁 __tests__/
├── api/                           # API endpoint tests
├── components/                    # UI component tests
├── performance/                   # Performance tests
├── reliability/                   # Reliability tests
├── supportability/                # Supportability tests
└── utils/                         # Utility function tests
```

## 🚀 Quick Start for Evaluation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Up Environment** (Required for Gemini AI):
   ```bash
   # Create .env.local
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_connection_string
   ```

3. **Initialize Movie Database**:
   ```bash
   npm run init-db
   ```
   *Note: This processes 200+ movie files (~100MB data) and may take 10-15 minutes*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Access Application**:
   Open [http://localhost:3000](http://localhost:3000)

## 📈 Performance Characteristics

- **Dataset Size**: 200+ movies with ~100,000 reviews
- **Vector Dimensions**: Variable (typically 200-500 features per movie)
- **Response Time**: ~100-500ms for recommendations
- **Scalability**: Designed for 1000+ movies with MongoDB indexing

## 🎓 Academic Evaluation Points

### Core Algorithms to Review:
1. **[`src/algorithm/recommender.js`](https://github.com/natikozel/trendflix/blob/production/src/algorithm/recommender.js)** - Main recommendation logic
2. **[`src/algorithm/userInputToVector.js`](https://github.com/natikozel/trendflix/blob/production/src/algorithm/userInputToVector.js)** - NLP processing
3. **[`src/algorithm/movieReviewsToVector.js`](https://github.com/natikozel/trendflix/blob/production/src/algorithm/movieReviewsToVector.js)** - TF-IDF implementation
4. **[`src/algorithm/vectorComparison.js`](https://github.com/natikozel/trendflix/blob/production/src/algorithm/vectorComparison.js)** - Similarity algorithms

### Key Technical Innovations:
- **Hybrid scoring** combining multiple similarity measures
- **Semantic keyword expansion** for better matching
- **Dynamic metadata weighting** based on content similarity
- **Feedback integration** for personalization improvement
- **Real-time NLP processing** with Gemini AI integration

### Testing Coverage:
- **Unit Tests**: Algorithm validation
- **Integration Tests**: End-to-end recommendation flow
- **Performance Tests**: Response time measurement

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Framer Motion
- **Backend**: Node.js, Next.js API Routes
- **Database**: MongoDB with vector storage
- **ML/AI**: Natural.js, Google Gemini AI, Custom TF-IDF
- **State Management**: Redux Toolkit
- **Testing**: Jest, React Testing Library

## 📚 Dependencies

### Core ML Libraries:
- `natural` - Natural Language Processing
- `@google/generative-ai` - Gemini AI integration
- `stopwords` - Text preprocessing

### Performance & Utilities:
- `class-variance-authority` - Component styling
- `framer-motion` - Animations
- `tailwind-merge` - CSS optimization

## 📝 License

MIT License - Academic use encouraged

---

**For Academic Review**: Focus on the [`/src/algorithm/`](https://github.com/natikozel/trendflix/tree/production/src/algorithm) directory for core computational logic and [`/src/app/api/`](https://github.com/natikozel/trendflix/tree/production/src/app/api) for the recommendation API implementation. The system demonstrates practical application of information retrieval, natural language processing, and machine learning concepts in a full-stack web application.
