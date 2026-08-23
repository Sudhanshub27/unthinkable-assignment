import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SVGIcon from '../components/SVGIcon';
import authIllustration from '../assets/auth-illustration.png';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'resident';
  
  const [activeRoleTab, setActiveRoleTab] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If query param specifies role, sync role state
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'resident') {
      setActiveRoleTab(paramRole);
    }
  }, [searchParams]);

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
      addToast(`Welcome back to Green Valley Residency, ${loggedUser.name}!`, 'success');

      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login Error:', err);
      let errMsg = 'Sign in failed. Please check your credentials.';
      if (!err.response) {
        errMsg = 'Backend server is unavailable. Please make sure backend is running.';
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

  function handleQuickFill(targetEmail, targetPassword, role) {
    setActiveRoleTab(role);
    setEmail(targetEmail);
    setPassword(targetPassword);
    performLogin(targetEmail, targetPassword);
  }

  return (
    <div className="auth-split-container">
      {/* Left half: Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          {/* Header */}
          <div className="auth-header">
            <Link to="/" className="auth-brand-badge">
              <img src="/logo.png" alt="Nivaas Logo" className="auth-logo-img" />
              <div className="auth-brand-text">
                <span className="auth-app-title">Nivaas</span>
                <span className="auth-society-subtitle">Green Valley Residency</span>
              </div>
            </Link>

            {/* Role Selection Tabs */}
            <div className="auth-role-tabs">
              <button
                type="button"
                className={`role-tab-btn ${activeRoleTab === 'resident' ? 'active-tab' : ''}`}
                onClick={() => {
                  setActiveRoleTab('resident');
                  setError('');
                }}
              >
                <SVGIcon name="user" size={16} />
                <span>Resident</span>
              </button>
              <button
                type="button"
                className={`role-tab-btn ${activeRoleTab === 'admin' ? 'active-tab' : ''}`}
                onClick={() => {
                  setActiveRoleTab('admin');
                  setError('');
                }}
              >
                <SVGIcon name="shield" size={16} />
                <span>Admin</span>
              </button>
            </div>

            <h2 className="auth-title">
              {activeRoleTab === 'resident' ? 'Welcome to your society' : 'Society Administration'}
            </h2>
            <p className="auth-subtitle">
              {activeRoleTab === 'resident'
                ? 'Sign in to access resident maintenance complaints & notices'
                : 'Sign in to manage complaints queue, notices & society operations'}
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address <span className="req">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder={activeRoleTab === 'resident' ? 'resident@society.com' : 'admin@society.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password <span className="req">*</span></label>
              <div className="input-relative-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <SVGIcon name="eye" size={16} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-block btn-lg ${activeRoleTab === 'admin' ? 'btn-navy' : 'btn-primary'}`}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : `Sign in as ${activeRoleTab === 'admin' ? 'Admin' : 'Resident'} ➔`}
            </button>
          </form>

          {/* 1-Click Demo Section */}
          <div className="auth-demo-divider">
            <span>1-CLICK DEMO LOGIN</span>
          </div>

          <div className="auth-demo-buttons-grid">
            <button
              type="button"
              className={`btn btn-outline btn-sm ${activeRoleTab === 'resident' ? 'btn-highlight-blue' : ''}`}
              onClick={() => handleQuickFill('resident@society.com', 'Resident@123', 'resident')}
            >
              <SVGIcon name="user" size={14} />
              <span>Resident Demo</span>
            </button>

            <button
              type="button"
              className={`btn btn-outline btn-sm ${activeRoleTab === 'admin' ? 'btn-highlight-purple' : ''}`}
              onClick={() => handleQuickFill('admin@society.com', 'Admin@123', 'admin')}
            >
              <SVGIcon name="shield" size={14} />
              <span>Admin Demo</span>
            </button>
          </div>

          <div className="auth-footer">
            <div className="auth-footer-links">
              <span>
                Don't have an account?{' '}
                <Link to={`/register?role=${activeRoleTab}`} className="auth-link">
                  Register as {activeRoleTab === 'admin' ? 'Admin' : 'Resident'}
                </Link>
              </span>

              <button
                type="button"
                className="btn btn-ghost btn-xs text-muted"
                onClick={handleResetSession}
                title="Purge cached session"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right half: Hero Illustration side */}
      <div className="auth-hero-side">
        <div className="auth-hero-header">
          <Link to="/" className="auth-hero-brand">
            <img src="/logo.png" alt="Logo" className="auth-hero-logo" />
            <span>Nivaas</span>
          </Link>
        </div>
        <div className="auth-hero-body">
          <img src={authIllustration} alt="Green Valley Residency" className="auth-hero-illustration" />
          <h3 className="auth-hero-title">Green Valley Residency</h3>
          <p className="auth-hero-tagline">
            Your society, now in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
