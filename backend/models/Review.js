const mongoose = require('mongoose');
const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  reviewText: String,
  timestamp: { type: Date, default: Date.now, index: true }
});

// Compound index for fast lookup
ReviewSchema.index({ movieId: 1, timestamp: -1 });
module.exports = mongoose.model('Review', ReviewSchema);
