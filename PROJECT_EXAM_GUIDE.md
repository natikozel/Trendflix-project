# Trendflix Project - Complete Exam Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & File Structure](#architecture--file-structure)
4. [Core Features & Implementation](#core-features--implementation)
5. [Recommendation Algorithm Deep Dive](#recommendation-algorithm-deep-dive)
6. [Database & Data Management](#database--data-management)
7. [UI/UX Components](#uiux-components)
8. [State Management](#state-management)
9. [API & Server Actions](#api--server-actions)
10. [Testing & Quality Assurance](#testing--quality-assurance)
11. [Deployment & Performance](#deployment--performance)
12. [Common Questions & Answers](#common-questions--answers)

---

## Project Overview

**Trendflix** is an AI-powered movie recommendation system that uses advanced natural language processing and machine learning techniques to provide personalized movie suggestions. The application combines user input analysis, movie review vectorization, and collaborative filtering to deliver accurate recommendations.

### Key Features:
- **Natural Language Input Processing**: Users can describe their preferences in plain English
- **AI-Powered Recommendations**: Uses Google Gemini API for intelligent preference analysis
- **Feedback System**: Users can rate recommendations to improve future suggestions
- **Responsive Design**: Modern UI with smooth animations and transitions
- **Real-time Processing**: Instant recommendation generation

---

## Technology Stack

### Frontend Technologies
- **Next.js 15.2.2**: React framework with App Router for server-side rendering
- **React 19**: Latest React version with concurrent features
- **TypeScript**: Type-safe development
- **TailwindCSS 4**: Utility-first CSS framework
- **Framer Motion**: Animation library for smooth transitions
- **Redux Toolkit**: State management for recommendations and user input

### Backend & AI Technologies
- **Google Gemini AI**: Natural language processing and preference analysis
- **Natural.js**: NLP library for text processing and TF-IDF vectorization
- **Node.js**: Server-side JavaScript runtime
- **MongoDB**: Database for movie data and user feedback

### Development Tools
- **ESLint**: Code linting and quality assurance
- **Jest**: Testing framework
- **TypeScript**: Static type checking

---

## Architecture & File Structure

```
trendflix/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/           # Server Actions
│   │   ├── api/               # API Routes
│   │   ├── movie/[id]/        # Dynamic movie pages
│   │   ├── recommend/         # Recommendation page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── algorithm/             # Core recommendation engine
│   │   ├── recommender.js     # Main recommendation logic
│   │   ├── userInputToVector.js # User input processing
│   │   ├── movieReviewsToVector.js # Movie vectorization
│   │   ├── feedbackUtils.js   # Feedback integration
│   │   ├── LLM.js            # Google Gemini integration
│   │   ├── getGenreVector.js  # Genre analysis
│   │   └── matchUserPreference.js # Preference matching
│   ├── components/            # React components
│   │   ├── common/           # Shared components
│   │   ├── movie/            # Movie-related components
│   │   ├── recommend/        # Recommendation form components
│   │   └── ui/               # UI components (buttons, etc.)
│   ├── lib/                  # Utility libraries
│   │   ├── db/              # Database services
│   │   └── utils/            # Helper functions
│   ├── store/                # Redux store
│   └── data/                 # Movie data and reviews
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

---

## Core Features & Implementation

### 1. Natural Language Input Processing

**Location**: `src/algorithm/userInputToVector.js`

The system processes user input in natural language and converts it into mathematical vectors for comparison with movies.

**Key Implementation Details**:
```javascript
// Custom tokenization with stopwords removal
const tokens = this.customTokenize(userInput);
// Keyword extraction using TF-IDF
const keywords = this.extractKeywords(tokens);
// Genre identification using LLM
const genres = await this.identifyGenres(userInput);
// Mood analysis for emotional context
const mood = this.analyzeMood(userInput);
```

**File Structure**: 
- Main logic: `src/algorithm/userInputToVector.js`
- LLM integration: `src/algorithm/LLM.js`
- Stopwords: `src/algorithm/userInputToVector.js` (imported from 'stopwords')

### 2. Movie Review Vectorization

**Location**: `src/algorithm/movieReviewsToVector.js`

Converts movie reviews into numerical vectors using TF-IDF (Term Frequency-Inverse Document Frequency).

**Implementation Process**:
1. **Text Preprocessing**: Clean and normalize review text
2. **TF-IDF Calculation**: Compute term frequencies across all reviews
3. **Vector Creation**: Generate 21-dimensional feature vectors
4. **Normalization**: Scale vectors for consistent comparison

**Key Code Structure**:
```javascript
class MovieReviewsToVector {
  preprocessText(text) {
    // Remove special characters, convert to lowercase
  }
  
  processReviews(reviews) {
    // Apply TF-IDF to create feature vectors
  }
  
  processMovie(movieData) {
    // Combine all reviews into single vector
  }
}
```

### 3. Recommendation Engine

**Location**: `src/algorithm/recommender.js`

The core algorithm that combines multiple factors to generate recommendations.

**Algorithm Steps**:
1. **Cosine Similarity**: Compare user input vector with movie vectors
2. **Metadata Weighting**: Adjust scores based on movie properties
3. **Feedback Integration**: Use past user feedback to improve scores
4. **Final Ranking**: Sort movies by adjusted similarity scores

**Key Implementation**:
```javascript
class Recommender {
  calculateCosineSimilarity(vectorA, vectorB) {
    // Mathematical similarity calculation
  }
  
  applyMetadataWeights(similarity, movie) {
    // Adjust for rating, year, popularity, etc.
  }
  
  getRecommendations(userInput, limit = 10) {
    // Main recommendation generation
  }
}
```

### 4. Feedback System

**Location**: `src/components/common/FeedbackButtons.tsx`, `src/app/actions/feedback.ts`

Users can rate recommendations (like/dislike) to improve future suggestions.

**Implementation**:
- **UI Component**: `src/components/common/FeedbackButtons.tsx`
- **Server Action**: `src/app/actions/feedback.ts`
- **Database Model**: `src/lib/db/models/RecommendationFeedback.js`
- **Algorithm Integration**: `src/algorithm/feedbackUtils.js`

**Feedback Flow**:
1. User clicks like/dislike on movie card
2. Feedback sent via server action
3. Stored in database with user input context
4. Used to adjust future recommendation scores

---

## Recommendation Algorithm Deep Dive

### Algorithm Architecture

The recommendation system uses a **hybrid approach** combining:
- **Content-based filtering** (movie features)
- **Collaborative filtering** (user feedback)
- **AI-powered analysis** (natural language processing)

### Step-by-Step Process

#### 1. User Input Processing (`src/algorithm/userInputToVector.js`)

**Input Example**: "I want a romantic comedy from the 90s with good acting"

**Processing Steps**:
```javascript
// 1. Tokenization
tokens = ["romantic", "comedy", "90s", "good", "acting"]

// 2. Keyword extraction (TF-IDF)
keywords = {romantic: 0.8, comedy: 0.9, acting: 0.7}

// 3. Genre identification (LLM)
genres = ["Romance", "Comedy"]

// 4. Mood analysis
mood = "positive", "lighthearted"

// 5. Vector creation (21 dimensions)
vector = [0.8, 0.9, 0.7, ...] // 21 features
```

#### 2. Movie Vectorization (`src/algorithm/movieReviewsToVector.js`)

**Process**:
- Load movie reviews from JSON files
- Apply TF-IDF to create feature vectors
- Normalize vectors for comparison

**File Structure**: `src/data/` contains JSON files for each movie's reviews

#### 3. Similarity Calculation (`src/algorithm/recommender.js`)

**Cosine Similarity Formula**:
```
similarity = (A · B) / (||A|| × ||B||)
```

**Implementation**:
```javascript
calculateCosineSimilarity(vectorA, vectorB) {
  const dotProduct = vectorA.reduce((sum, val, i) => 
    sum + val * vectorB[i], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, val) => 
    sum + val * val, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, val) => 
    sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

#### 4. Metadata Weighting

**Factors Considered**:
- **Rating**: Higher ratings get bonus points
- **Release Year**: Recent movies get slight preference
- **Popularity**: Popular movies get small boost
- **Duration**: Matches user's preferred length
- **Genres**: Exact genre matches get significant bonus
- **Age Rating**: Ensures appropriate content

**Implementation**: `src/algorithm/recommender.js` - `applyMetadataWeights()`

#### 5. Feedback Integration (`src/algorithm/feedbackUtils.js`)

**Process**:
- Load user's past feedback
- Calculate user similarity
- Adjust scores based on similar users' preferences

**Formula**:
```
adjustedScore = originalScore + (feedbackWeight × userSimilarity)
```

### AI Integration (Google Gemini)

**Location**: `src/algorithm/LLM.js`

**Uses**:
1. **Genre Analysis**: Extract genres from user input
2. **Preference Matching**: Analyze user preferences in detail
3. **Natural Language Understanding**: Parse complex user requests

**Example Prompt**:
```
"Analyze this user input and extract movie preferences:
'I want a dark psychological thriller with complex characters'
Return JSON with genres, themes, and mood indicators."
```

---

## Database & Data Management

### Data Structure

#### Movie Data (`src/lib/db/models/Movie.js`)
```javascript
{
  movieId: String,
  movieName: String,
  releaseYear: Number,
  duration: Number,
  genres: [String],
  rating: Number,
  popularity: Number,
  ageRating: String,
  synopsis: String,
  posterUrl: String,
  vector: [Number] // 21-dimensional feature vector
}
```

#### Feedback Data (`src/lib/db/models/RecommendationFeedback.js`)
```javascript
{
  movieId: String,
  userDecision: Boolean, // true = like, false = dislike
  userInput: String,     // Original user input
  timestamp: Date,
  score: Number          // Original recommendation score
}
```

### Data Sources

1. **Movie Information**: Stored in MongoDB
2. **Movie Reviews**: JSON files in `src/data/`
3. **User Feedback**: MongoDB collection
4. **Genre Vectors**: Generated by LLM, stored in MongoDB

### Data Processing Pipeline

1. **Initial Setup**: `src/scripts/initializeMovieDatabase.js`
2. **Review Processing**: `src/algorithm/movieReviewsToVector.js`
3. **Vector Generation**: `src/algorithm/getGenreVector.js`
4. **Database Storage**: `src/lib/db/services/`

---

## UI/UX Components

### Component Architecture

#### 1. Main Pages
- **Home Page**: `src/app/page.tsx`
- **Recommendation Page**: `src/app/recommend/page.tsx`
- **Movie Details**: `src/app/movie/[id]/page.tsx`

#### 2. Core Components

**Preference Form** (`src/components/recommend/PreferenceForm.tsx`)
- Text input for natural language preferences
- Genre selector with multi-select
- Duration slider
- Year range selector
- Form validation and submission

**Movie Grid** (`src/components/movies/MovieGrid.tsx`)
- Displays recommendation results
- Responsive grid layout
- Loading states and error handling

**Movie Card** (`src/components/movies/MovieCard.tsx`)
- Individual movie display
- Match percentage calculation
- Feedback buttons (like/dislike)
- Hover effects and animations

**Feedback Buttons** (`src/components/common/FeedbackButtons.tsx`)
- Like/dislike functionality
- Visual feedback and animations
- Integration with server actions

#### 3. UI Components (`src/components/ui/`)
- **Button**: Reusable button component
- **Badge**: Genre and rating badges
- **Avatar**: User avatar placeholder
- **Progress**: Loading indicators

### Styling & Animations

**TailwindCSS Classes Used**:
```css
/* Gradient backgrounds */
bg-gradient-to-b from-gray-900 via-gray-800 to-black

/* Glass morphism effects */
bg-gray-800/50 backdrop-blur-sm

/* Hover animations */
transform hover:scale-[1.02] transition-transform duration-300

/* Loading animations */
animate-spin animate-pulse
```

**Framer Motion Animations**:
- Page transitions
- Component entrance animations
- Interactive hover effects

---

## State Management

### Redux Store Structure (`src/store/`)

#### Store Configuration (`src/store/store.ts`)
```javascript
import { configureStore } from '@reduxjs/toolkit';
import recommendationsReducer from './recommendationsSlice';

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
  },
});
```

#### Recommendations Slice (`src/store/recommendationsSlice.ts`)
```javascript
interface RecommendationsState {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  userInput: string;
}

const initialState: RecommendationsState = {
  movies: [],
  loading: false,
  error: null,
  userInput: '',
};
```

#### Actions
- `setMovies`: Update recommendation results
- `setLoading`: Toggle loading state
- `setError`: Handle error states
- `setUserInput`: Store user's original input

### State Flow

1. **User Input**: Stored in Redux state
2. **API Call**: Dispatched from PreferenceForm
3. **Loading State**: Shows loading indicator
4. **Results**: Updates movie list in state
5. **Error Handling**: Displays error messages

---

## API & Server Actions

### API Routes

#### Recommendation API (`src/app/api/recommend/route.ts`)
```javascript
export async function POST(request: Request) {
  const { userInput, genres, duration, yearRange } = await request.json();
  
  const recommender = new Recommender();
  const recommendations = await recommender.getRecommendations(userInput);
  
  return Response.json({ movies: recommendations });
}
```

### Server Actions

#### Feedback Actions (`src/app/actions/feedback.ts`)
```javascript
'use server'

export async function saveFeedback(data: FeedbackData) {
  // Save feedback to database
}

export async function getAllFeedback() {
  // Retrieve all feedback for admin dashboard
}
```

### Data Flow

1. **Client Component**: Calls server action
2. **Server Action**: Processes request
3. **Database Service**: Handles data persistence
4. **Response**: Returns to client component

---

## Testing & Quality Assurance

### Testing Structure

#### Unit Tests
- **Algorithm Tests**: Test recommendation logic
- **Component Tests**: Test UI components
- **Utility Tests**: Test helper functions

#### Integration Tests
- **API Tests**: Test recommendation endpoints
- **Database Tests**: Test data persistence
- **User Flow Tests**: Test complete user journeys

### Code Quality

#### ESLint Configuration
- **TypeScript Rules**: Strict type checking
- **React Rules**: Best practices for React
- **Import Rules**: Organized imports

#### TypeScript
- **Strict Mode**: Enabled for type safety
- **Interface Definitions**: Clear type contracts
- **Generic Types**: Reusable type definitions

---

## Deployment & Performance

### Build Process

#### Development
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
```

#### Build Optimization
- **Code Splitting**: Automatic by Next.js
- **Tree Shaking**: Remove unused code
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Analyze bundle size

### Performance Metrics

#### Current Bundle Sizes
- **Home Page**: 170 kB
- **Movie Details**: 163 kB
- **Recommendation Page**: 170 kB
- **Shared Chunks**: 101 kB

#### Optimization Techniques
1. **Lazy Loading**: Components loaded on demand
2. **Memoization**: Prevent unnecessary re-renders
3. **Image Optimization**: WebP format, responsive sizes
4. **Caching**: Static generation for better performance

---

## Common Questions & Answers

### Technical Questions

**Q: How does the recommendation algorithm work?**
A: The algorithm uses a hybrid approach combining content-based filtering (movie features) and collaborative filtering (user feedback). It processes user input through NLP, converts it to vectors, compares with movie vectors using cosine similarity, applies metadata weights, and integrates feedback for final ranking.

**Q: What is the role of Google Gemini AI?**
A: Gemini AI is used for natural language understanding, genre extraction from user input, and preference analysis. It helps convert human language into structured data that the algorithm can process.

**Q: How is the feedback system implemented?**
A: Users can like/dislike recommendations through UI buttons. Feedback is stored in MongoDB with user input context and used to adjust future recommendation scores through collaborative filtering.

**Q: What is TF-IDF and how is it used?**
A: TF-IDF (Term Frequency-Inverse Document Frequency) is used to convert text (user input and movie reviews) into numerical vectors. It measures word importance based on frequency in documents and rarity across all documents.

### Architecture Questions

**Q: Why did you choose Next.js 15 with App Router?**
A: Next.js 15 provides server-side rendering, automatic code splitting, and the new App Router offers better performance and developer experience. It's ideal for SEO and fast loading times.

**Q: How is state management handled?**
A: Redux Toolkit is used for global state (recommendations, user input), while local state is managed with React hooks for component-specific data.

**Q: What is the database structure?**
A: MongoDB is used with collections for movies, user feedback, and genre vectors. The schema is designed for efficient querying and scalability.

### Implementation Questions

**Q: How do you handle errors in the recommendation system?**
A: Errors are caught at multiple levels: API routes, server actions, and client components. User-friendly error messages are displayed, and errors are logged for debugging.

**Q: How is the UI responsive?**
A: TailwindCSS utility classes provide responsive design. Components use responsive breakpoints and flexible layouts that adapt to different screen sizes.

**Q: How do you ensure code quality?**
A: TypeScript provides type safety, ESLint enforces coding standards, and comprehensive testing ensures reliability. Code is organized in modular, reusable components.

### Algorithm Questions

**Q: What is cosine similarity and why use it?**
A: Cosine similarity measures the angle between two vectors, providing a value between -1 and 1. It's used because it's scale-invariant and works well for comparing text vectors.

**Q: How do you handle cold start problem?**
A: For new users without feedback, the system relies on content-based filtering using movie features and user input analysis. As users provide feedback, collaborative filtering becomes more important.

**Q: How accurate are the recommendations?**
A: The system combines multiple factors (content similarity, metadata, user feedback) to provide personalized recommendations. Accuracy improves as users provide more feedback.

### File Structure Questions

**Q: Where is the main recommendation logic?**
A: `src/algorithm/recommender.js` contains the core recommendation engine that orchestrates the entire process.

**Q: How are movie reviews processed?**
A: `src/algorithm/movieReviewsToVector.js` handles the conversion of movie reviews into numerical vectors using TF-IDF.

**Q: Where is the feedback system implemented?**
A: UI components in `src/components/common/FeedbackButtons.tsx`, server actions in `src/app/actions/feedback.ts`, and algorithm integration in `src/algorithm/feedbackUtils.js`.

---

## Key Code Locations for Exam

### Core Algorithm Files
- **Main Engine**: `src/algorithm/recommender.js`
- **User Input Processing**: `src/algorithm/userInputToVector.js`
- **Movie Vectorization**: `src/algorithm/movieReviewsToVector.js`
- **Feedback Integration**: `src/algorithm/feedbackUtils.js`
- **AI Integration**: `src/algorithm/LLM.js`

### UI Components
- **Main Form**: `src/components/recommend/PreferenceForm.tsx`
- **Movie Display**: `src/components/movies/MovieCard.tsx`
- **Feedback UI**: `src/components/common/FeedbackButtons.tsx`
- **Loading States**: `src/components/common/BookLoader.tsx`

### Data Management
- **Database Services**: `src/lib/db/services/`
- **Models**: `src/lib/db/models/`
- **Server Actions**: `src/app/actions/feedback.ts`
- **API Routes**: `src/app/api/recommend/route.ts`

### State Management
- **Store Configuration**: `src/store/store.ts`
- **Recommendations Slice**: `src/store/recommendationsSlice.ts`
- **Provider**: `src/components/StoreProvider.tsx`

This comprehensive guide covers all aspects of your Trendflix project and should prepare you for any questions about the implementation, architecture, algorithms, and technologies used. 