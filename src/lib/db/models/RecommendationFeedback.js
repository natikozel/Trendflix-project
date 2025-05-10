import mongoose from 'mongoose';

/**
 * Model representing user feedback on movie recommendations
 */
const RecommendationFeedbackSchema = new mongoose.Schema({
  movieId: {
    type: String,
    required: true,
    index: true
  },
  liked: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userInputData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  recommendationScore: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add options for proper serialization
  toJSON: { 
    transform: function(doc, ret) {
      // Convert _id to string to avoid serialization issues
      if (ret._id) {
        ret._id = ret._id.toString();
      }
      return ret;
    } 
  },
  toObject: { 
    transform: function(doc, ret) {
      // Convert _id to string to avoid serialization issues
      if (ret._id) {
        ret._id = ret._id.toString();
      }
      return ret;
    } 
  }
});

// Add timestamp hook
RecommendationFeedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model
const RecommendationFeedback = mongoose.models.RecommendationFeedback || 
  mongoose.model('RecommendationFeedback', RecommendationFeedbackSchema);

export default RecommendationFeedback; 
