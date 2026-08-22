import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  function fillAdminCredentials() {
    setEmail('admin@society.com');
    setPassword('Admin@123');
  }

  return (
    <div className="container" style={{ maxWidth: 440, marginTop: 40 }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-icon" style={{ width: 48, height: 48, fontSize: '1.6rem', margin: '0 auto 12px auto' }}>
            🏢
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Log in to manage or track society complaints
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="resident@society.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)', textAlign: 'center' }}>
          <button
            className="secondary"
            onClick={fillAdminCredentials}
            style={{ width: '100%', marginBottom: 14, fontSize: '0.82rem' }}
          >
            ⚡ Quick Fill Admin Demo Credentials (admin@society.com)
          </button>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Resident without an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
