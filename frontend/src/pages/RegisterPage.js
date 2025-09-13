

import axios from 'axios';
import { useState } from 'react';

const RegisterPage = () => {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault();
		setError('');
		setSuccess('');
		if (!username || !email || !password || !confirm) {
			setError('Please fill in all fields.');
			return;
		}
		if (password !== confirm) {
			setError('Passwords do not match.');
			return;
		}
		setLoading(true);
		try {
			const res = await axios.post(
				process.env.REACT_APP_API_URL + '/api/auth/register',
				{ username, email, password }
			);
			setSuccess('Registration successful! You can now log in.');
			setUsername(''); setEmail(''); setPassword(''); setConfirm('');
		} catch (err) {
			setError(err.response?.data?.message || 'Registration failed.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 400, margin: '3rem auto' }}>
			<div className="card" style={{ padding: '2.5rem 2rem' }}>
				<h1 style={{ color: '#ffb400', marginBottom: 18 }}>Create Account</h1>
				<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					<input
						className="input"
						type="text"
						placeholder="Username"
						value={username}
						onChange={e => setUsername(e.target.value)}
						required
					/>
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
					<input
						className="input"
						type="password"
						placeholder="Confirm Password"
						value={confirm}
						onChange={e => setConfirm(e.target.value)}
						required
					/>
					{error && <div style={{ color: '#ff6a00', marginBottom: 6 }}>{error}</div>}
					{success && <div style={{ color: '#4caf50', marginBottom: 6 }}>{success}</div>}
					<button className="btn" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
				</form>
				<div style={{ color: '#aaa', marginTop: 18, fontSize: '0.98em' }}>
					Already have an account? <a href="/login" style={{ color: '#ffb400' }}>Login</a>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;
