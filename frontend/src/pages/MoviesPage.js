



import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovies } from '../slices/movieSlice';
import { useNavigate } from 'react-router-dom';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const MoviesPage = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { movies, loading, error, hasMore, page } = useSelector(state => state.movies);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [rating, setRating] = useState('');
  const [imgErrorIdx, setImgErrorIdx] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);


  // Helper to build filter params
  const getFilterParams = (pageOverride) => {
    const params = { page: pageOverride || 1 };
    if (search) params.title = search;
    if (genre) params.genre = genre;
    if (year) params.year = year;
    if (rating) params.rating = rating;
    return params;
  };

  useEffect(() => {
    dispatch(fetchMovies(getFilterParams(1)));
    // eslint-disable-next-line
  }, [search, genre, year, rating, dispatch]);


  const handleLoadMore = async () => {
    setLoadingMore(true);
    await dispatch(fetchMovies(getFilterParams(page + 1)));
    setLoadingMore(false);
  };


  // Genres for dropdown (could be fetched from backend, here are some common)
  const genres = [
    '', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy',
    'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
  ];

  return (
    <>
      <h1 style={{ color: '#ffb400', marginBottom: '1.5rem' }}>Browse Movies</h1>
      <form
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}
        onSubmit={e => { e.preventDefault(); dispatch(fetchMovies(getFilterParams(1))); }}
      >
        <input
          className="input"
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        <select className="input" value={genre} onChange={e => setGenre(e.target.value)} style={{ maxWidth: 140 }}>
          {genres.map(g => <option key={g} value={g}>{g ? g : 'All Genres'}</option>)}
        </select>
        <select
          className="input"
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ maxWidth: 110 }}
        >
          <option value="">All Years</option>
          {Array.from({ length: 2025 - 1990 + 1 }, (_, i) => 1990 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className="input"
          value={rating}
          onChange={e => setRating(e.target.value)}
          style={{ maxWidth: 110 }}
        >
          <option value="">All Ratings</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className="input" style={{ background: '#ffb400', color: '#232526', fontWeight: 600, border: 0, borderRadius: 6, padding: '0.5rem 1.2rem' }}>Search</button>
      </form>
      {loading ? (
        <div style={{ color: '#aaa', textAlign: 'center' }}>Loading movies...</div>
      ) : error ? (
        <div style={{ color: '#ff6a00', textAlign: 'center' }}>{error}</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
          }}>
            {movies.length === 0 ? (
              <div style={{ color: '#aaa', gridColumn: '1/-1', textAlign: 'center' }}>No movies found.</div>
            ) : (
              movies.map((movie, idx) => (
                <div
                  className="card"
                  key={movie._id || movie.id || movie.title + idx}
                  style={{ textAlign: 'center', padding: '1rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/movies/${movie._id}`)}
                >
                  <img
                    src={imgErrorIdx[idx] || !movie.poster_path ? '/no-poster.png' : TMDB_IMAGE_BASE + movie.poster_path}
                    alt={movie.title}
                    style={{ width: '100%', borderRadius: 8, marginBottom: 12, boxShadow: '0 2px 8px #0006' }}
                    onError={() => setImgErrorIdx(prev => ({ ...prev, [idx]: true }))}
                  />
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#ffd700' }}>{movie.title}</div>
                  <div style={{ color: '#aaa', fontSize: '0.95rem' }}>{movie.release_date ? movie.release_date.slice(0,4) : ''}</div>
                  <div style={{ color: '#ffb400', fontWeight: 500, marginTop: 4 }}>
                    {
                      <>
                        ⭐ {typeof movie.averageUserRating === 'number' ? Math.round(movie.averageUserRating) : '-'}
                        {(typeof movie.vote_average === 'number' || typeof movie.averageRating === 'number') && (
                          <span style={{ color: '#aaa', fontWeight: 400 }}>
                            {' | '}
                            {typeof movie.vote_average === 'number' ? Math.round(movie.vote_average) : Math.round(movie.averageRating)}
                          </span>
                        )}
                      </>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  background: '#232526',
                  color: '#ffb400',
                  border: '1px solid #ffb400',
                  borderRadius: 8,
                  padding: '0.7rem 2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: loadingMore ? 0.7 : 1
                }}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

};

export default MoviesPage;
