# Trendflix - AI-Powered Movie Recommendation System

## Overview

Trendflix is a sophisticated movie recommendation platform that combines multiple AI techniques to provide personalized movie suggestions. The system uses a hybrid approach combining content-based filtering, collaborative filtering, and LLM-enhanced preference extraction to deliver highly accurate recommendations.

## 🎯 Key Features

- **Natural Language Processing**: Users can describe their preferences in natural language
- **LLM-Enhanced Understanding**: Advanced language model integration for preference extraction
- **Multi-Factor Recommendations**: Combines content, metadata, and user feedback
- **Real-time Feedback System**: Users can rate recommendations to improve future suggestions
- **Responsive UI**: Modern, intuitive interface with smooth animations
- **Admin Dashboard**: Comprehensive analytics and feedback monitoring

## 🏗️ Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Redux Toolkit**: State management
- **Radix UI**: Accessible component primitives

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Server Actions**: Modern Next.js data mutations
- **MongoDB**: Document database for movie and feedback data
- **Natural.js**: NLP processing and TF-IDF calculations

### AI/ML Components
- **TF-IDF Vectorization**: Content-based movie analysis
- **Cosine Similarity**: Core similarity metric
- **LLM Integration**: Google Gemini for preference extraction
- **Collaborative Filtering**: User feedback integration
- **Semantic Concept Mapping**: Advanced text understanding

## 🧠 Algorithm Overview

### Recommendation Pipeline

1. **User Input Processing**
   - Natural language text analysis
   - LLM-powered preference extraction
   - Demographic and preference integration
   - Vector normalization

2. **Content-Based Filtering**
   - TF-IDF vectorization of movie reviews
   - Semantic concept mapping
   - Cosine similarity calculations
   - Metadata-based weighting

3. **Collaborative Filtering**
   - User similarity calculations
   - Feedback-weighted adjustments
   - Multi-factor user matching
   - Continuous learning

4. **Final Ranking**
   - Combined score calculation
   - Metadata filtering
   - Age-appropriate content filtering
   - Personalized ranking

### Core Algorithms

#### TF-IDF Vectorization
```javascript
// Movie reviews are converted to high-dimensional vectors
// using Term Frequency-Inverse Document Frequency
const vector = tfidf.calculateWeights(reviews);
```

#### Cosine Similarity
```javascript
// Measures similarity between user and movie vectors
const similarity = dotProduct / (magnitudeA * magnitudeB);
```

#### User Similarity Calculation
```javascript
// Multi-factor similarity including:
// - Genre preferences (Jaccard similarity)
// - Age similarity (linear decay)
// - Language preferences (exact match)
// - Text-based preferences (Jaccard similarity)
```

## 📁 Project Structure

```
src/
├── algorithm/                 # Core recommendation algorithms
│   ├── recommender.js        # Main recommendation engine
│   ├── userInputToVector.js  # User input processing
│   ├── movieReviewsToVector.js # TF-IDF vectorization
│   ├── feedbackUtils.js      # Feedback integration
│   ├── LLM.js               # Language model integration
│   ├── getGenreVector.js    # Genre analysis
│   └── matchUserPreference.js # Preference matching
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── admin/               # Admin dashboard
│   └── movie/               # Movie detail pages
├── components/               # React components
│   ├── common/              # Shared components
│   ├── movies/              # Movie-related components
│   ├── recommend/           # Recommendation components
│   └── admin/               # Admin components
├── lib/                      # Utility libraries
│   ├── db/                  # Database services
│   └── utils/               # Helper functions
├── store/                    # Redux state management
└── data/                     # Movie review datasets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB instance
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/trendflix.git
   cd trendflix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   ```bash
   npm run init-db
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Main app: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin/feedback

## 🎮 Usage

### For Users

1. **Describe Your Preferences**
   - Enter natural language descriptions of movies you like
   - Specify genres, themes, or specific movies
   - Add demographic information and preferences

2. **Get Recommendations**
   - View personalized movie suggestions
   - See match scores and metadata
   - Explore movie details

3. **Provide Feedback**
   - Rate recommendations with like/dislike buttons
   - Help improve future suggestions
   - Build your preference profile

### For Administrators

1. **Monitor Feedback**
   - Access admin dashboard at `/admin/feedback`
   - View feedback analytics and trends
   - Analyze recommendation performance

2. **System Analytics**
   - Track user engagement
   - Monitor recommendation quality
   - Identify improvement opportunities

## 🔧 Configuration

### Algorithm Parameters

The recommendation system can be tuned through various parameters:

```javascript
// In recommender.js
const options = {
  maxResults: 6,              // Number of recommendations
  similarityThreshold: 0.03,  // Minimum similarity score
  includeMetadata: true,      // Include movie metadata
  useFeedbackData: true       // Enable feedback integration
};
```

### Vector Processing

```javascript
// In movieReviewsToVector.js
const importantTerms = new Set([
  'space', 'time', 'journey', 'adventure',
  // ... domain-specific terms
]);
```

## 📊 Performance Metrics

The system tracks various performance indicators:

- **Recommendation Accuracy**: Based on user feedback
- **User Engagement**: Time spent and interactions
- **Similarity Scores**: Distribution of recommendation quality
- **Feedback Trends**: Like/dislike ratios over time

## 🔬 Technical Details

### Vector Processing Pipeline

1. **Text Preprocessing**
   - Lowercase conversion
   - Punctuation removal
   - Stopword filtering
   - Compound word preservation

2. **TF-IDF Calculation**
   - Term frequency analysis
   - Inverse document frequency
   - Weight normalization
   - Semantic concept mapping

3. **Similarity Computation**
   - Cosine similarity calculation
   - Vector normalization
   - Multi-dimensional comparison

### User Input Processing

1. **LLM Integration**
   - Natural language understanding
   - Preference extraction
   - Movie title identification
   - Sentiment analysis

2. **Feature Engineering**
   - Demographic integration
   - Preference weighting
   - Semantic expansion
   - Vector normalization

### Feedback Integration

1. **User Similarity**
   - Multi-factor calculation
   - Preference overlap analysis
   - Demographic matching
   - Text similarity

2. **Score Adjustment**
   - Weighted feedback application
   - Similarity-based weighting
   - Score normalization
   - Bounds checking

## 🛠️ Development

### Adding New Features

1. **Algorithm Enhancements**
   - Modify files in `src/algorithm/`
   - Update similarity calculations
   - Add new weighting factors

2. **UI Components**
   - Create components in `src/components/`
   - Follow existing patterns
   - Add proper TypeScript types

3. **API Endpoints**
   - Add routes in `src/app/api/`
   - Use server actions for data mutations
   - Implement proper error handling

### Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when implemented)
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Natural.js**: NLP processing capabilities
- **Google Gemini**: Advanced language model integration
- **Next.js Team**: Excellent React framework
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ by the Trendflix Team**
