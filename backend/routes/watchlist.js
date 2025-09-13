const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const Movie = require('../models/Movie');
const jwt = require('jsonwebtoken');

// Middleware to require authentication (JWT)
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET user's watchlist (movie details)
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user.id }).populate('movieId');
    res.json(items.map(item => item.movieId));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch watchlist.' });
  }
});

// POST add movie to watchlist
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ message: 'Missing movieId' });
    const exists = await Watchlist.findOne({ userId: req.user.id, movieId });
    if (exists) return res.status(400).json({ message: 'Already in watchlist' });
    const item = new Watchlist({ userId: req.user.id, movieId });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add to watchlist.' });
  }
});

// DELETE remove movie from watchlist
router.delete('/:movieId', requireAuth, async (req, res) => {
  try {
    const result = await Watchlist.findOneAndDelete({ userId: req.user.id, movieId: req.params.movieId });
    if (!result) return res.status(404).json({ message: 'Not in watchlist' });
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from watchlist.' });
  }
});

module.exports = router;
