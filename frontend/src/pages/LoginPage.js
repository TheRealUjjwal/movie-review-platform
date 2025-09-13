

import axios from 'axios';
import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '../slices/userSlice';


const LoginPage = () => {

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState('');
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const handleSubmit = async e => {
		e.preventDefault();
		setError('');
		setSuccess('');
		if (!email || !password) {
			setError('Please enter both email and password.');
			return;
		}
		setLoading(true);
		try {
			const res = await axios.post(
				process.env.REACT_APP_API_URL + '/api/auth/login',
				{ email, password }
			);
			// Store token or user info as needed
			localStorage.setItem('token', res.data.token);
			localStorage.setItem('user', JSON.stringify(res.data.user));
			dispatch(setUser(res.data.user));
			dispatch(setToken(res.data.token));
			setSuccess('Login successful!');
			setEmail(''); setPassword('');
			setTimeout(() => {
				navigate('/');
			}, 500); // short delay for user feedback
		} catch (err) {
			setError(err.response?.data?.message || 'Login failed.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 400, margin: '3rem auto' }}>
			<div className="card" style={{ padding: '2.5rem 2rem' }}>
				<h1 style={{ color: '#ffb400', marginBottom: 18 }}>Sign In</h1>
				<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					<input
						className="input"
						type="email"
						placeholder="Email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
					<input
						className="input"
						type="password"
						placeholder="Password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
					{error && <div style={{ color: '#ff6a00', marginBottom: 6 }}>{error}</div>}
					{success && <div style={{ color: '#4caf50', marginBottom: 6 }}>{success}</div>}
					<button className="btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
				</form>
				<div style={{ color: '#aaa', marginTop: 18, fontSize: '0.98em' }}>
					Don't have an account? <a href="/register" style={{ color: '#ffb400' }}>Register</a>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
