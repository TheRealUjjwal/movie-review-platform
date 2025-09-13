const mongoose = require('mongoose');
const WatchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
  dateAdded: { type: Date, default: Date.now, index: true }
});

// Compound index for user-movie lookup
WatchlistSchema.index({ userId: 1, movieId: 1 });
module.exports = mongoose.model('Watchlist', WatchlistSchema);
