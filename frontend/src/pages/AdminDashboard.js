import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AdminDashboard = () => {
  const { token, user } = useSelector(state => state.user);
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [moviesRes, usersRes] = await Promise.all([
          axios.get(process.env.REACT_APP_API_URL + '/api/movies?page=1&pageSize=1000', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(process.env.REACT_APP_API_URL + '/api/users', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setMovies(moviesRes.data.results || []);
        setUsers(usersRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    if (token && user?.isAdmin) fetchData();
  }, [token, user]);

  if (!user?.isAdmin) return <div style={{ color: '#ff6a00', textAlign: 'center', margin: '2rem' }}>Admin access only.</div>;
  if (loading) return <div style={{ color: '#aaa', textAlign: 'center', margin: '2rem' }}>Loading admin dashboard...</div>;
  if (error) return <div style={{ color: '#ff6a00', textAlign: 'center', margin: '2rem' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: '#ffb400', marginBottom: '2rem' }}>Admin Dashboard</h1>
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#ffb400', marginBottom: '1rem' }}>Movies</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#232526', color: '#eee' }}>
          <thead>
            <tr style={{ background: '#333' }}>
              <th style={{ padding: 8, border: '1px solid #444' }}>Title</th>
              <th style={{ padding: 8, border: '1px solid #444' }}>Year</th>
              <th style={{ padding: 8, border: '1px solid #444' }}>Genres</th>
              <th style={{ padding: 8, border: '1px solid #444' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m._id}>
                <td style={{ padding: 8, border: '1px solid #444' }}>{m.title}</td>
                <td style={{ padding: 8, border: '1px solid #444' }}>{m.releaseYear || m.release_date?.slice(0,4) || ''}</td>
                <td style={{ padding: 8, border: '1px solid #444' }}>{Array.isArray(m.genres) ? m.genres.join(', ') : m.genres}</td>
                <td style={{ padding: 8, border: '1px solid #444' }}>
                  {/* Add edit/delete buttons here */}
                  <button style={{ marginRight: 8, background: '#ffb400', color: '#232526', border: 0, borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Edit</button>
                  <button style={{ background: '#ff6a00', color: '#fff', border: 0, borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 style={{ color: '#ffb400', marginBottom: '1rem' }}>Users</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#232526', color: '#eee' }}>
          <thead>
            <tr style={{ background: '#333' }}>
              <th style={{ padding: 8, border: '1px solid #444' }}>Username</th>
              <th style={{ padding: 8, border: '1px solid #444' }}>Email</th>
              <th style={{ padding: 8, border: '1px solid #444' }}>Role</th>
              <th style={{ padding: 8, border: '1px solid #444' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td style={{ padding: 8, border: '1px solid #444' }}>{u.username}</td>
                <td style={{ padding: 8, border: '1px solid #444' }}>{u.email}</td>
                <td style={{ padding: 8, border: '1px solid #444' }}>{u.isAdmin ? 'Admin' : 'User'}</td>
                <td style={{ padding: 8, border: '1px solid #444' }}>
                  {/* Add promote/demote/delete buttons here */}
                  <button style={{ marginRight: 8, background: '#ffb400', color: '#232526', border: 0, borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Edit</button>
                  <button style={{ background: '#ff6a00', color: '#fff', border: 0, borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
