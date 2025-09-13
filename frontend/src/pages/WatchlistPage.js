

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';


const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';


const WatchlistPage = () => {
  const { user, token } = useSelector(state => state.user);
  const [watchlist, setWatchlist] = useState([]);
  const [imgErrorIdx, setImgErrorIdx] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

	useEffect(() => {
		if (!user || !user.id || !token) return;
		const fetchWatchlist = async () => {
			setLoading(true);
			setError('');
			try {
				const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/watchlist`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setWatchlist(res.data);
			} catch {
				setError('Failed to load watchlist.');
			} finally {
				setLoading(false);
			}
		};
		fetchWatchlist();
	}, [user, token]);

		const handleRemove = async (movieId) => {
			if (!token || !user || !user.id) return;
			try {
				await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/watchlist/${movieId}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setWatchlist(watchlist.filter(m => m._id !== movieId));
			} catch {}
		};

	 if (!user || !user.id) return <div style={{ color: '#aaa' }}>Please log in to view your watchlist.</div>;
	if (loading) return <div style={{ color: '#aaa' }}>Loading watchlist...</div>;

	return (
		<>
			<h1 style={{ color: '#ffb400', marginBottom: '1.5rem' }}>My Watchlist</h1>
			{error && <div style={{ color: '#ff6a00' }}>{error}</div>}
			{watchlist.length === 0 ? (
				<div style={{ color: '#aaa' }}>Your watchlist is empty.</div>
			) : (
				<div style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
					gap: '1.5rem',
				}}>
								{watchlist.map((movie, idx) => (
									!movie ? null : (
										<div className="card" key={movie._id || idx} style={{ textAlign: 'center', padding: '1rem' }}>
											<img
												src={imgErrorIdx[idx] || !movie.poster_path ? '/no-poster.png' : TMDB_IMAGE_BASE + (movie.poster_path || '')}
												alt={movie.title || 'Movie'}
												style={{ width: '100%', borderRadius: 8, marginBottom: 12, boxShadow: '0 2px 8px #0006' }}
												onError={() => setImgErrorIdx(prev => ({ ...prev, [idx]: true }))}
											/>
											<div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#ffd700' }}>{movie.title}</div>
											<div style={{ color: '#aaa', fontSize: '0.95rem' }}>
												{movie.release_date ? movie.release_date.slice(0,4) : ''}
												{movie.genres
													? (Array.isArray(movie.genres)
															? ' · ' + movie.genres.join(', ')
															: (typeof movie.genres === 'string' ? ' · ' + movie.genres : ''))
													: ''}
											</div>
											<div style={{ color: '#ffb400', fontWeight: 500, marginTop: 4 }}>
												<>
													⭐ {typeof movie.averageUserRating === 'number' ? Math.round(movie.averageUserRating) : '-'}
													{(typeof movie.vote_average === 'number' || typeof movie.averageRating === 'number') && (
														<span style={{ color: '#aaa', fontWeight: 400 }}>
															{' | '}
															{typeof movie.vote_average === 'number' ? Math.round(movie.vote_average) : Math.round(movie.averageRating)}
														</span>
													)}
												</>
											</div>
											<button onClick={() => handleRemove(movie._id)} style={{ marginTop: 8, background: '#232526', color: '#ffb400', border: '1px solid #ffb400', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Remove</button>
										</div>
									)
								))}
				</div>
			)}
		</>
	);
};

export default WatchlistPage;
