import mongoose from 'mongoose';

// Single comprehensive Movie Schema
const MovieSchema = new mongoose.Schema({
  movieId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  movieName: {
    type: String,
    required: true,
    index: true
  },
  // Vector data
  vector: {
    type: Map,
    of: Number
  },
  dimensions: {
    type: [String]
  },
  // Metadata
  releaseYear: Number,
  duration: Number,
  genres: [String],
  synopsis: String,
  ageRating: String,
  reviews: [{
    text: String,
    author: String,
  }],
  popularity: Number,  
  posterUrl: String,
  // Processing flags
  vectorProcessed: {
    type: Boolean,
    default: false
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create text indices for searching
MovieSchema.index({ movieName: 'text', synopsis: 'text' });

// Add timestamp hook
MovieSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model
const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

export default Movie; 