
const express = require('express');
const router = express.Router();
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

// GET /api/movies/:id/reviews - Retrieve reviews for a specific movie
router.get('/:id/reviews', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({ movieId: req.params.id })
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

// POST /api/movies/:id/reviews - Submit a new review for a movie (auth required)
router.post('/:id/reviews', requireAuth, async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    if (!rating) return res.status(400).json({ message: 'Missing rating' });
    const Review = require('../models/Review');
    // Only one review per user per movie
    const existing = await Review.findOne({ userId: req.user.id, movieId: req.params.id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this movie.' });
    const review = new Review({ userId: req.user.id, movieId: req.params.id, rating, reviewText });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create review.' });
  }
});


const Movie = require('../models/Movie');


// GET /api/movies - fetch paginated movies from MongoDB, with average user rating and filtering

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 100;
  const sort = req.query.sort === 'popularity' ? { popularity: -1 } : { _id: 1 };
  const filter = {};
  if (req.query.title) filter.title = { $regex: req.query.title, $options: 'i' };
  if (req.query.genre) filter.genres = req.query.genre;
  // Support filtering by year, releaseYear, or release_date (YYYY)
  if (req.query.year) {
    const yearInt = parseInt(req.query.year);
    // Try to match any of the possible year fields
    filter.$or = [
      { year: yearInt },
      { releaseYear: yearInt },
      { release_date: { $regex: `^${yearInt}` } }
    ];
  }
  // For rating, we filter after aggregation
  let rating = req.query.rating ? parseFloat(req.query.rating) : null;
  try {
    const total = await Movie.countDocuments(filter);
    let results = await Movie.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();


    // Attach average user rating for each movie
    const Review = require('../models/Review');
    const movieIds = results.map(m => m._id);
    const ratings = await Review.aggregate([
      { $match: { movieId: { $in: movieIds } } },
      { $group: { _id: '$movieId', avg: { $avg: '$rating' } } }
    ]);
    const avgMap = {};
    ratings.forEach(r => { avgMap[r._id.toString()] = r.avg; });
    results.forEach(m => {
      m.averageUserRating = avgMap[m._id.toString()] || null;
    });

    // Filter by rating (exact value) if specified
    if (rating !== null) {
      results = results.filter(m => {
        // Accept if either user rating or vote_average matches exactly (rounded to integer)
        const userOk = typeof m.averageUserRating === 'number' && Math.round(m.averageUserRating) === rating;
        const voteOk = typeof m.vote_average === 'number' && Math.round(m.vote_average) === rating;
        return userOk || voteOk;
      });
    }

    res.json({ results, total, page, pageSize });
  } catch (err) {
    console.error('[MOVIES] MongoDB error:', err);
    res.status(500).json({ message: 'Failed to fetch movies from database', error: err.message });
  }
});



// POST /api/movies - Add a new movie (admin only)
router.post('/', requireAuth, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ message: 'Failed to add movie', error: err.message });
  }
});


// GET /api/movies/:id - fetch movie by MongoDB _id, with average user rating and reviews
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).lean();
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    const Review = require('../models/Review');
    const reviews = await Review.find({ movieId: movie._id }).populate('userId', 'username').sort({ timestamp: -1 }).lean();
    const avg = await Review.aggregate([
      { $match: { movieId: movie._id } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    movie.averageUserRating = avg.length ? avg[0].avg : null;
    movie.reviews = reviews;
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch movie from database', error: err.message });
  }
});

module.exports = router;
