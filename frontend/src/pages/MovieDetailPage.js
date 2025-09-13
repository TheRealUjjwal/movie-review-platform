


import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovieById, clearMovie } from '../slices/movieSlice';
import ReviewAndWatchlist from './ReviewAndWatchlist';


// const TMDB_IMAGE_BASE is already declared above, do not redeclare

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const MovieDetailPage = () => {
	const { id } = useParams();
	const dispatch = useDispatch();
	const { movie, loading, error } = useSelector(state => state.movies);
	const [imgError, setImgError] = useState(false);

	useEffect(() => {
		dispatch(fetchMovieById(id));
		return () => { dispatch(clearMovie()); };
	}, [dispatch, id]);

	if (loading) return <div style={{ color: '#aaa', textAlign: 'center' }}>Loading movie...</div>;
	if (error || !movie) return <div style={{ color: '#ff6a00', textAlign: 'center' }}>{error || 'Movie not found.'}</div>;

	// Helper to get YouTube embed URL from a YouTube link
	const getYouTubeEmbedUrl = url => {
		if (!url) return null;
		const match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
		return match ? `https://www.youtube.com/embed/${match[1]}` : null;
	};

	return (
		<>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '2.5rem' }}>
				<img
					src={imgError || !movie.poster_path ? '/no-poster.png' : TMDB_IMAGE_BASE + movie.poster_path}
					alt={movie.title}
					style={{ width: 220, borderRadius: 14, boxShadow: '0 2px 16px #000a' }}
					onError={() => setImgError(true)}
				/>
				<div style={{ flex: 1, minWidth: 260 }}>
					<h1 style={{ color: '#ffb400', margin: 0 }}>{movie.title} <span style={{ fontSize: '1.1rem', color: '#aaa', fontWeight: 400 }}>({movie.release_date ? movie.release_date.slice(0,4) : ''})</span></h1>
					<div style={{ color: '#ffd700', fontWeight: 500, margin: '0.5rem 0' }}>
						⭐ {typeof movie.averageUserRating === 'number' ? Math.round(movie.averageUserRating) : '-'}
						{typeof movie.vote_average === 'number' || typeof movie.averageRating === 'number' ?
							<span style={{ color: '#aaa', fontWeight: 400 }}> | {typeof movie.vote_average === 'number' ? Math.round(movie.vote_average) : Math.round(movie.averageRating)}</span>
							: null}
					</div>
					<div style={{ color: '#aaa', marginBottom: 8 }}>
						{Array.isArray(movie.genres)
							? movie.genres.join(', ')
							: (typeof movie.genres === 'string' ? movie.genres : '')}
					</div>
					<div style={{ color: '#eee', marginBottom: 12 }}>{movie.overview || ''}</div>
					{/* Trailer embed */}
					{movie.trailerUrl && getYouTubeEmbedUrl(movie.trailerUrl) && (
						<div style={{ margin: '1.5rem 0' }}>
							<div style={{ color: '#ffb400', fontWeight: 600, marginBottom: 8 }}>Trailer</div>
							<div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 10, boxShadow: '0 2px 8px #0006' }}>
								<iframe
									src={getYouTubeEmbedUrl(movie.trailerUrl)}
									title="Movie Trailer"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
									style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
			<ReviewAndWatchlist movieId={movie._id} />
		</>
	);
};

export default MovieDetailPage;
