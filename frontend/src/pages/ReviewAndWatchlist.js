import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const ReviewAndWatchlist = ({ movieId }) => {
  const { user, token } = useSelector(state => state.user);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [watchlisted, setWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies/${movieId}/reviews`);
        setReviews(res.data);
        if (user) {
          const mine = res.data.find(r => r.userId && r.userId._id === user.id);
          setMyReview(mine || null);
          if (mine) {
            setReviewText(mine.reviewText || '');
            setRating(mine.rating);
          }
        }
      } catch {
        setError('Failed to load reviews.');
      }
    };
    fetchReviews();
  }, [movieId, user]);

  // Fetch watchlist status
  useEffect(() => {
    if (!user || !token) return;
    const fetchWatchlist = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/watchlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlisted(res.data.some(m => m._id === movieId));
      } catch {}
    };
    fetchWatchlist();
  }, [movieId, user, token]);

  // Add or update review
  const handleSubmit = async e => {
    e.preventDefault();
    if (!user || !token) {
      setError('You must be logged in to submit a review.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (myReview) {
        // Update
        await axios.put(`${process.env.REACT_APP_API_URL}/api/reviews/${myReview._id}`, {
          rating, reviewText
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        // Create
        await axios.post(`${process.env.REACT_APP_API_URL}/api/movies/${movieId}/reviews`, {
          rating, reviewText
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditMode(false);
      setReviewText('');
      setRating(5);
      // Refresh
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies/${movieId}/reviews`);
      setReviews(res.data);
      setMyReview(res.data.find(r => r.userId && r.userId._id === user.id) || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  // Delete review
  const handleDelete = async () => {
    if (!myReview) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/reviews/${myReview._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyReview(null);
      setReviewText('');
      setRating(5);
      // Refresh
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies/${movieId}/reviews`);
  setReviews(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setLoading(false);
    }
  };

  // Watchlist add/remove
  const handleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (watchlisted) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/watchlist/${movieId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlisted(false);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/watchlist`, { movieId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlisted(true);
      }
    } catch {}
    setWatchlistLoading(false);
  };

  return (
    <div style={{ marginTop: 32 }}>
      {user && (
        <button
          onClick={handleWatchlist}
          disabled={watchlistLoading}
          style={{
            background: watchlisted ? '#ffb400' : '#232526',
            color: watchlisted ? '#232526' : '#ffb400',
            border: '1px solid #ffb400',
            borderRadius: 8,
            padding: '0.5rem 1.2rem',
            marginBottom: 18,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {watchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </button>
      )}
      <h3 style={{ color: '#ffb400', marginBottom: 8 }}>Reviews</h3>
      {error && <div style={{ color: '#ff6a00', marginBottom: 8 }}>{error}</div>}
      {user ? (
        <div style={{ marginBottom: 18 }}>
          {myReview && !editMode ? (
            <div style={{ background: '#232526', padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ color: '#ffd700', fontWeight: 500 }}>Your Review</div>
              <div style={{ color: '#ffb400' }}>⭐ {myReview.rating}</div>
              <div style={{ color: '#eee', margin: '6px 0' }}>{myReview.reviewText}</div>
              <button onClick={() => setEditMode(true)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#232526', padding: 12, borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <label>Rating: </label>
                <select value={rating} onChange={e => setRating(Number(e.target.value))}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write your review..."
                rows={3}
                style={{ width: '100%', borderRadius: 6, padding: 6, marginBottom: 8 }}
              />
              <button type="submit" disabled={loading}>{myReview ? 'Update' : 'Submit'} Review</button>
              {myReview && <button type="button" onClick={() => { setEditMode(false); setReviewText(myReview.reviewText || ''); setRating(myReview.rating); }} style={{ marginLeft: 8 }}>Cancel</button>}
            </form>
          )}
        </div>
      ) : (
        <div style={{ color: '#aaa', marginBottom: 18 }}>
          Please <a href="/login" style={{ color: '#ffb400' }}>log in</a> to submit a review.
        </div>
      )}
      <div>
        {reviews.length === 0 && <div style={{ color: '#aaa' }}>No reviews yet.</div>}
        {reviews.filter(r => !myReview || (r._id !== myReview._id)).map(r => (
          <div key={r._id} style={{ background: '#232526', padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <div style={{ color: '#ffd700', fontWeight: 500 }}>{r.userId?.username || 'User'}</div>
            <div style={{ color: '#ffb400' }}>⭐ {r.rating}</div>
            <div style={{ color: '#eee', margin: '6px 0' }}>{r.reviewText}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewAndWatchlist;
