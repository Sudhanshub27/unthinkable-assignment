import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function performLogin(loginEmail, loginPassword) {
    setError('');
    setLoading(true);

    try {
      const user = await login(loginEmail, loginPassword);
      addToast(`Welcome back, ${user.name}!`, 'success');

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const errMsg =
        err.response?.data?.error ||
        'Invalid email or password. Please check your credentials.';
      setError(errMsg);
      addToast('Sign in failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    performLogin(email, password);
  }

  function handleQuickFill(targetEmail, targetPassword) {
    setEmail(targetEmail);
    setPassword(targetPassword);
    performLogin(targetEmail, targetPassword);
  }

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-icon">🏢</div>
          <h2 className="auth-title">Sign in to Society Notebook</h2>
          <p className="auth-subtitle">Apartment & Maintenance Management Platform</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. resident@society.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In ➔'}
          </button>
        </form>

        <div className="auth-demo-divider">
          <span>1-CLICK DEMO ACCOUNTS</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm flex-1"
            onClick={() => handleQuickFill('admin@society.com', 'Admin@123')}
          >
            👑 Admin Demo
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm flex-1"
            onClick={() => handleQuickFill('resident@society.com', 'Resident@123')}
          >
            🏠 Resident Demo
          </button>
        </div>

        <div className="auth-footer">
          Don't have a resident account?{' '}
          <Link to="/register" className="auth-link">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
