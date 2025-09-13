const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

// Middleware to require authentication (JWT)
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  const jwt = require('jsonwebtoken');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).populate('userId', 'username').sort({ timestamp: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

// POST create review (auth required)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    if (!movieId || !rating) return res.status(400).json({ message: 'Missing fields' });
    // Only one review per user per movie
    const existing = await Review.findOne({ userId: req.user.id, movieId });
    if (existing) return res.status(400).json({ message: 'You already reviewed this movie.' });
    const review = new Review({ userId: req.user.id, movieId, rating, reviewText });
    await review.save();

    // Real-time notification: notify users with this movie in their watchlist
    try {
      const { wsClients } = require('../server');
      const Watchlist = require('../models/Watchlist');
      const watchers = await Watchlist.find({ movieId });
      const notified = new Set();
      for (const w of watchers) {
        if (w.userId.toString() !== req.user.id && wsClients.has(w.userId.toString())) {
          const ws = wsClients.get(w.userId.toString());
          if (ws && ws.readyState === 1 && !notified.has(w.userId.toString())) {
            ws.send(JSON.stringify({
              type: 'review',
              movieId,
              review: {
                userId: req.user.id,
                rating,
                reviewText,
                timestamp: review.timestamp || new Date(),
              }
            }));
            notified.add(w.userId.toString());
          }
        }
      }
    } catch (e) { /* ignore notification errors */ }

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create review.' });
  }
});

// PUT update review (auth required)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    review.rating = req.body.rating ?? review.rating;
    review.reviewText = req.body.reviewText ?? review.reviewText;
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update review.' });
  }
});

// DELETE review (auth required)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review.' });
  }
});

module.exports = router;
