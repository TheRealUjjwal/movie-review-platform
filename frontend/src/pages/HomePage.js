


import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovies } from '../slices/movieSlice';
import axios from 'axios';

const INCEPTION_IMDB_POSTER =
	"https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjY4MF5BMl5BanBnXkFtZTcwODI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg";


const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';


const localFallback = '/no-poster.png';
// const INCEPTION_IMDB_POSTER and TMDB_IMAGE_BASE are already declared above, do not redeclare


const HomePage = () => {
	const dispatch = useDispatch();
	const { movies, loading, error } = useSelector(state => state.movies);
	const { user, token } = useSelector(state => state.user);
	// featured: first movie, trending: next 8
	const featured = movies.length > 0 ? movies[0] : null;
	const trending = movies.length > 1 ? movies.slice(1, 9) : [];
	const [imgSrc, setImgSrc] = React.useState(featured && featured.poster_path ? TMDB_IMAGE_BASE + featured.poster_path : localFallback);
	const [fallbackTried, setFallbackTried] = React.useState(false);
	const [recommendations, setRecommendations] = useState([]);
	const [recLoading, setRecLoading] = useState(false);
	const [recError, setRecError] = useState('');

	useEffect(() => {
		dispatch(fetchMovies(1));
	}, [dispatch]);

	useEffect(() => {
		if (featured && featured.poster_path) {
			setImgSrc(TMDB_IMAGE_BASE + featured.poster_path);
		} else {
			setImgSrc(localFallback);
		}
	}, [featured]);

	// Fetch recommendations for logged-in user
	useEffect(() => {
		if (!user || !token) {
			setRecommendations([]);
			setRecError('');
			return;
		}
		setRecLoading(true);
		setRecError('');
		axios.get(
			process.env.REACT_APP_API_URL + `/api/users/${user.id}/recommendations`,
			{ headers: { Authorization: `Bearer ${token}` } }
		)
			.then(res => {
				setRecommendations(res.data.recommendations || []);
			})
			.catch(err => {
				setRecError(err.response?.data?.message || 'Failed to load recommendations.');
			})
			.finally(() => setRecLoading(false));
	}, [user, token]);

	const handleImgError = () => {
		if (!fallbackTried) {
			setImgSrc(INCEPTION_IMDB_POSTER);
			setFallbackTried(true);
		} else {
			setImgSrc(localFallback);
		}
	};

	if (loading) return <div style={{ color: '#aaa', textAlign: 'center' }}>Loading movies...</div>;
	if (error) return <div style={{ color: '#ff6a00', textAlign: 'center' }}>{error}</div>;

	return (
		<>
			{/* Recommendations section */}
			{user && token && (
				<section className="card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
					<h2 style={{ color: '#ffb400', marginBottom: '1.2rem' }}>Recommended for You</h2>
					{recLoading ? (
						<div style={{ color: '#aaa' }}>Loading recommendations...</div>
					) : recError ? (
						<div style={{ color: '#ff6a00' }}>{recError}</div>
					) : recommendations.length === 0 ? (
						<div style={{ color: '#aaa' }}>No recommendations yet. Rate some movies to get personalized suggestions!</div>
					) : (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
							gap: '1.5rem',
						}}>
							{recommendations.map((movie, idx) => (
								<div className="card" key={movie._id || movie.id || idx} style={{ textAlign: 'center', padding: '1rem' }}>
									<img
										src={movie.poster_path ? TMDB_IMAGE_BASE + movie.poster_path : localFallback}
										alt={movie.title}
										style={{ width: '100%', borderRadius: 8, marginBottom: 12, boxShadow: '0 2px 8px #0006' }}
										onError={e => { e.target.onerror = null; e.target.src = localFallback; }}
									/>
									<div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#ffd700' }}>{movie.title}</div>
									<div style={{ color: '#aaa', fontSize: '0.95rem' }}>{movie.release_date ? movie.release_date.slice(0,4) : ''}</div>
									<div style={{ color: '#ffb400', fontWeight: 500, marginTop: 4 }}>
										⭐ {typeof movie.averageUserRating === 'number' ? Math.round(movie.averageUserRating) : '-'}
										{typeof movie.vote_average === 'number' || typeof movie.averageRating === 'number' ?
											<span style={{ color: '#aaa', fontWeight: 400 }}> | {typeof movie.vote_average === 'number' ? Math.round(movie.vote_average) : Math.round(movie.averageRating)}</span>
											: null}
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			)}

			{/* Featured movie */}
			{featured && (
				<section style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: '2rem',
					background: 'linear-gradient(90deg, #232526 60%, #414345 100%)',
					borderRadius: '16px',
					padding: '2.5rem 2rem',
					marginBottom: '2.5rem',
					boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
				}}>
					<img
						src={imgSrc}
						alt={featured.title}
						style={{ width: 180, borderRadius: 12, boxShadow: '0 2px 12px #0008' }}
						onError={handleImgError}
					/>
					<div>
						<h1 style={{ fontSize: '2.5rem', margin: 0, color: '#ffb400' }}>{featured.title} <span style={{ fontSize: '1.2rem', color: '#aaa', fontWeight: 400 }}>({featured.release_date ? featured.release_date.slice(0,4) : ''})</span></h1>
						<h2 style={{ fontWeight: 400, fontSize: '1.2rem', color: '#ffd700', margin: '0.5rem 0 1rem 0' }}>{featured.tagline || ''}</h2>
						<div style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#eee' }}>{featured.overview || ''}</div>
						<div style={{ fontWeight: 600, color: '#ffb400' }}>
							⭐ {typeof featured.averageUserRating === 'number' ? Math.round(featured.averageUserRating) : '-'}
							{typeof featured.vote_average === 'number' || typeof featured.averageRating === 'number' ?
								<span style={{ color: '#aaa', fontWeight: 400 }}> | {typeof featured.vote_average === 'number' ? Math.round(featured.vote_average) : Math.round(featured.averageRating)}</span>
								: null}
							/ 5
						</div>
					</div>
				</section>
			)}

			<h2 style={{ color: '#ffb400', marginBottom: '1.2rem' }}>Trending Movies</h2>
			<div style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
				gap: '1.5rem',
			}}>
				{trending.map((movie, idx) => (
					<div className="card" key={movie._id || movie.id || idx} style={{ textAlign: 'center', padding: '1rem' }}>
						<img
							src={movie.poster_path ? TMDB_IMAGE_BASE + movie.poster_path : localFallback}
							alt={movie.title}
							style={{ width: '100%', borderRadius: 8, marginBottom: 12, boxShadow: '0 2px 8px #0006' }}
							onError={e => { e.target.onerror = null; e.target.src = localFallback; }}
						/>
						<div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#ffd700' }}>{movie.title}</div>
						<div style={{ color: '#aaa', fontSize: '0.95rem' }}>{movie.release_date ? movie.release_date.slice(0,4) : ''}</div>
						<div style={{ color: '#ffb400', fontWeight: 500, marginTop: 4 }}>
							⭐ {typeof movie.averageUserRating === 'number' ? Math.round(movie.averageUserRating) : '-'}
							{typeof movie.vote_average === 'number' || typeof movie.averageRating === 'number' ?
								<span style={{ color: '#aaa', fontWeight: 400 }}> | {typeof movie.vote_average === 'number' ? Math.round(movie.vote_average) : Math.round(movie.averageRating)}</span>
								: null}
						</div>
					</div>
				))}
			</div>
		</>
	);
};

export default HomePage;
