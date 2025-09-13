

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WatchlistPage from './pages/WatchlistPage';
import NotificationToaster from './components/NotificationToaster';

import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout as reduxLogout, setUser, setToken } from './slices/userSlice';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector(state => state.user);

  // Sync Redux state with localStorage on mount and route change
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('user');
    if (localToken && !token) {
      dispatch(setToken(localToken));
    }
    if (localUser && !user) {
      try {
        dispatch(setUser(JSON.parse(localUser)));
      } catch {}
    }
  }, [dispatch, token, user, location]);

  // Idle session timeout (5 minutes)
  useEffect(() => {
    if (!token) return;
    let timeout;
    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(reduxLogout());
        navigate('/login');
        alert('You have been logged out due to inactivity.');
      }, 5 * 60 * 1000); // 5 minutes
    };
    // Listen for user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [token, dispatch, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(reduxLogout());
    navigate('/login');
  };

  return (
    <header>
      <div style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.03em' }}>
        <Link to="/" style={{ color: '#ffb400' }}>🎬 Movie Review</Link>
      </div>
      <nav style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <Link to="/movies">Movies</Link>
        <Link to="/watchlist">Watchlist</Link>
        {token && user ? (
          <>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} className="btn" style={{ padding: '0.3em 1em', fontSize: '1em', background: '#232323', color: '#ffb400', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}


function App() {
  return (
    <>
      <Navbar />
      <NotificationToaster />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer>
        &copy; {new Date().getFullYear()} Movie Review Platform. All rights reserved.
      </footer>
    </>
  );
}

export default App;
