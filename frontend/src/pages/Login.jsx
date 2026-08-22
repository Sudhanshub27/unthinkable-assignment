import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  function handleResetSession() {
    logout();
    setEmail('');
    setPassword('');
    setError('');
    addToast('Cleared cached session data.', 'info');
  }

  async function performLogin(loginEmail, loginPassword) {
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(loginEmail, loginPassword);
      addToast(`Welcome back, ${loggedUser.name}!`, 'success');

      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/complaints', { replace: true });
      }
    } catch (err) {
      console.error('Login Error:', err);
      let errMsg = 'Sign in failed. Please check your credentials.';
      if (!err.response) {
        errMsg = 'Backend server is unavailable (connection refused). Make sure backend is running on port 4000.';
      } else if (err.response.status === 401) {
        errMsg = err.response.data?.error || 'Invalid email or password.';
      } else if (err.response.status === 403) {
        errMsg = err.response.data?.error || 'Access forbidden for this role.';
      } else if (err.response.data?.error) {
        errMsg = err.response.data.error;
      }
      setError(errMsg);
      addToast(errMsg, 'error');
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
              placeholder="e.g. admin@society.com"
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

        <div className="auth-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs text-muted"
            onClick={handleResetSession}
            title="Purge cached browser session"
          >
            🧹 Reset Session
          </button>
        </div>
      </div>
    </div>
  );
}
