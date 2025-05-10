/**
 * GenreVector model
 * 
 * Stores the LLM-generated genre vectors for movies
 */

import mongoose from 'mongoose';

const GenreVectorSchema = new mongoose.Schema({
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
  // Store genre vector as a nested object instead of a Map to avoid dot notation issues
  genreVector: {
    type: Object,
    required: true
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add timestamp hook
GenreVectorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model
const GenreVector = mongoose.models.GenreVector || mongoose.model('GenreVector', GenreVectorSchema);

export default GenreVector; 