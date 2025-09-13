
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');
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

// GET /api/users/:id - Get user profile
router.get('/:id', requireAuth, async (req, res) => {
  // Only allow user to fetch their own profile or admin
  if (req.user.id !== req.params.id && !req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
  try {
    const user = await User.findById(req.params.id)
      .select('username email profilePicture joinDate followers following')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Fetch user's reviews, populate movie title
    const reviews = await Review.find({ userId: req.params.id })
      .populate('movieId', 'title')
      .sort({ timestamp: -1 })
      .lean();
    user.reviews = reviews;

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// GET /api/users - List all users (admin only)
// GET /api/users/:id/watchlist - Get user's watchlist
router.get('/:id/watchlist', requireAuth, async (req, res) => {
  // Only allow user to fetch their own watchlist or admin
  if (req.user.id !== req.params.id && !req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
  try {
    const items = await Watchlist.find({ userId: req.params.id })
      .sort({ dateAdded: -1 })
      .populate({
        path: 'movieId',
        select: 'title poster_path release_date genres rating overview',
      })
      .lean();
    // Return array of movies (flatten movieId)
    const movies = items.map(item => item.movieId).filter(Boolean);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch watchlist.' });
  }
});
router.get('/', requireAuth, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  try {
    const users = await User.find({}, 'username email isAdmin').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// POST /api/users/:id/follow - Follow a user
router.post('/:id/follow', requireAuth, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;
  if (userId === targetId) return res.status(400).json({ message: 'Cannot follow yourself.' });
  try {
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user || !target) return res.status(404).json({ message: 'User not found.' });
    if (user.following.includes(targetId)) return res.status(400).json({ message: 'Already following.' });
    user.following.push(targetId);
    target.followers.push(userId);
    await user.save();
    await target.save();
    res.json({ message: 'Followed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to follow user.' });
  }
});

// POST /api/users/:id/unfollow - Unfollow a user
router.post('/:id/unfollow', requireAuth, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;
  if (userId === targetId) return res.status(400).json({ message: 'Cannot unfollow yourself.' });
  try {
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user || !target) return res.status(404).json({ message: 'User not found.' });
    if (!user.following.includes(targetId)) return res.status(400).json({ message: 'Not following.' });
    user.following = user.following.filter(id => id.toString() !== targetId);
    target.followers = target.followers.filter(id => id.toString() !== userId);
    await user.save();
    await target.save();
    res.json({ message: 'Unfollowed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unfollow user.' });
  }
});

// GET /api/users/:id/feed - Get social feed (reviews from followed users)
router.get('/:id/feed', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const followedIds = user.following;
    const reviews = await Review.find({ userId: { $in: followedIds } })
      .populate('userId', 'username profilePicture')
      .populate('movieId', 'title poster_path')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json({ feed: reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feed.' });
  }
});


// GET /api/users/:id/recommendations - Hybrid movie recommendations
router.get('/:id/recommendations', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
  try {
    // 1. Get user's reviews and top genres
    const userReviews = await Review.find({ userId: req.user.id }).lean();
    if (!userReviews.length) {
      // Fallback: recommend popular movies
      const popular = await Movie.find({})
        .sort({ popularity: -1 })
        .limit(10)
        .lean();
      return res.json({ recommendations: popular });
    }
    // Get IDs of movies already rated
    const ratedMovieIds = userReviews.map(r => r.movieId.toString());
    // Get genres of top-rated movies
    const highRated = userReviews.filter(r => r.rating >= 4);
    const highRatedIds = highRated.map(r => r.movieId);
    const highRatedMovies = await Movie.find({ _id: { $in: highRatedIds } }).lean();
    let genreCounts = {};
    highRatedMovies.forEach(m => {
      (m.genres || []).forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    // Top genres
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    // 2. Find similar users (users who rated same movies highly)
    const similarReviews = await Review.find({
      movieId: { $in: highRatedIds },
      rating: { $gte: 4 },
      userId: { $ne: req.user.id }
    }).lean();
    const similarUserIds = [...new Set(similarReviews.map(r => r.userId.toString()))];

    // 3. Get movies highly rated by similar users, not yet rated by this user
    const similarUserReviews = await Review.find({
      userId: { $in: similarUserIds },
      rating: { $gte: 4 }
    }).lean();
    const recommendedMovieIds = [...new Set(similarUserReviews.map(r => r.movieId.toString()))]
      .filter(id => !ratedMovieIds.includes(id));

    // 4. Get movies in top genres, not yet rated by this user
    const genreMovies = await Movie.find({
      genres: { $in: topGenres },
      _id: { $nin: ratedMovieIds }
    })
      .sort({ popularity: -1 })
      .limit(30)
      .lean();
    const genreMovieIds = genreMovies.map(m => m._id.toString());

    // 5. Merge and deduplicate recommendations, prioritize similar users' picks
    const allIds = [...recommendedMovieIds, ...genreMovieIds];
    const uniqueIds = [...new Set(allIds)].slice(0, 10);
    const recs = await Movie.find({ _id: { $in: uniqueIds } }).lean();
    // Sort by order in uniqueIds
    const recMap = {};
    recs.forEach(m => { recMap[m._id.toString()] = m; });
    const recommendations = uniqueIds.map(id => recMap[id]).filter(Boolean);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate recommendations.' });
  }
});

// POST /api/users/:id/watchlist - Add movie to watchlist
router.post('/:id/watchlist', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
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

// DELETE /api/users/:id/watchlist/:movieId - Remove movie from watchlist
router.delete('/:id/watchlist/:movieId', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
  try {
    const result = await Watchlist.findOneAndDelete({ userId: req.user.id, movieId: req.params.movieId });
    if (!result) return res.status(404).json({ message: 'Not in watchlist' });
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from watchlist.' });
  }
});
module.exports = router;
