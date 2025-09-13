


import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { logout } from '../slices/userSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user: authUser, token } = useSelector(state => state.user);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        if (!token || !authUser || !authUser.id) {
          setUser(null);
          setError('');
          setLoading(false);
          return;
        }
        const res = await axios.get(
          process.env.REACT_APP_API_URL + `/api/users/${authUser.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(res.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          dispatch(logout());
          setUser(null);
          setError('');
        } else {
          setError(err.response?.data?.message || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };
    const fetchFeed = async () => {
      setFeedLoading(true);
      setFeedError('');
      try {
        if (!token || !authUser || !authUser.id) {
          setFeed([]);
          setFeedError('');
          setFeedLoading(false);
          return;
        }
        const res = await axios.get(
          process.env.REACT_APP_API_URL + `/api/users/${authUser.id}/feed`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFeed(res.data.feed || []);
      } catch (err) {
        setFeedError(err.response?.data?.message || 'Failed to load feed.');
      } finally {
        setFeedLoading(false);
      }
    };
    fetchProfile();
    fetchFeed();
    // Clear user/error if token/user is lost
    if (!token || !authUser || !authUser.id) {
      setUser(null);
      setError('');
      setFeed([]);
      setFeedError('');
    }
  }, [authUser, token, dispatch]);

  if (loading) return <div style={{ color: '#aaa', textAlign: 'center', margin: '2rem' }}>Loading profile...</div>;
  if (!token || !authUser || !authUser.id) return <div style={{ color: '#ff6a00', textAlign: 'center', margin: '2rem' }}>You must be logged in to view your profile.</div>;
  if (error) return <div style={{ color: '#ff6a00', textAlign: 'center', margin: '2rem' }}>{error}</div>;
  if (!user) return null;

  return (
    <>
      <section className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.username} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px #0006' }} />
        ) : (
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffb400 60%, #232526 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 700,
            color: '#232526',
            boxShadow: '0 2px 8px #0006',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
            {(() => {
              let name = user.username || user.name || '';
              let initials = name.split(' ').filter(Boolean).map(w => w[0]).join('');
              if (initials.length > 2) initials = initials[0] + initials[initials.length - 1];
              return initials || '?';
            })()}
          </div>
        )}
        <div>
          <h1 style={{ color: '#ffb400', margin: 0 }}>{user.username}</h1>
          <div style={{ color: '#aaa', marginBottom: 6 }}>{user.email}</div>
          <div style={{ color: '#eee', fontSize: '0.98rem' }}>Joined: {user.joinDate ? user.joinDate.slice(0,10) : ''}</div>
          <div style={{ color: '#aaa', marginTop: 8 }}>
            <b>Following:</b> {user.following?.length || 0} &nbsp;|&nbsp; <b>Followers:</b> {user.followers?.length || 0}
          </div>
        </div>
      </section>
      <section className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffb400', margin: '0 0 1rem 0' }}>My Reviews</h2>
        {user.reviews && user.reviews.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {user.reviews.map(r => (
              <li key={r._id} style={{ marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
                <div style={{ color: '#ffd700', fontWeight: 500 }}>{r.movieId?.title || 'Movie'}</div>
                <div style={{ color: '#ffb400' }}>⭐ {r.rating}</div>
                <div style={{ color: '#eee', margin: '6px 0' }}>{r.reviewText}</div>
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#aaa' }}>No reviews yet.</div>
        )}
      </section>
      <section className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffb400', margin: '0 0 1rem 0' }}>Social Feed</h2>
        {feedLoading ? (
          <div style={{ color: '#aaa' }}>Loading feed...</div>
        ) : feedError ? (
          <div style={{ color: '#ff6a00' }}>{feedError}</div>
        ) : feed.length === 0 ? (
          <div style={{ color: '#aaa' }}>No recent reviews from people you follow.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {feed.map(r => (
              <li key={r._id} style={{ marginBottom: 18, borderBottom: '1px solid #333', paddingBottom: 8 }}>
                <div style={{ color: '#ffd700', fontWeight: 500 }}>{r.movieId?.title || 'Movie'}</div>
                <div style={{ color: '#ffb400' }}>⭐ {r.rating}</div>
                <div style={{ color: '#eee', margin: '6px 0' }}>{r.reviewText}</div>
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''} &nbsp;|&nbsp; by {r.userId?.username || 'User'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

export default ProfilePage;
