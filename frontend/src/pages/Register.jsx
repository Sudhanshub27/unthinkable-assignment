import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SVGIcon from '../components/SVGIcon';
import authIllustration from '../assets/auth-illustration.png';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'resident';

  const [activeRoleTab, setActiveRoleTab] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'resident') {
      setActiveRoleTab(paramRole);
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        flatNumber: flatNumber.trim() || undefined,
        role: activeRoleTab,
      });

      addToast(`Welcome to your society portal, ${user.name}!`, 'success');
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      addToast('Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-container">
      {/* Left half: Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <Link to="/" className="auth-brand-badge">
              <img src="/logo.png" alt="Nivaas Logo" className="auth-logo-img" />
              <div className="auth-brand-text">
                <span className="auth-app-title">Nivaas</span>
                <span className="auth-society-subtitle">Digital Society Portal</span>
              </div>
            </Link>

            {/* Role Selection Tabs */}
            <div className="auth-role-tabs">
              <button
                type="button"
                className={`role-tab-btn ${activeRoleTab === 'resident' ? 'active-tab' : ''}`}
                onClick={() => setActiveRoleTab('resident')}
              >
                <SVGIcon name="user" size={16} />
                <span>Resident</span>
              </button>
              <button
                type="button"
                className={`role-tab-btn ${activeRoleTab === 'admin' ? 'active-tab' : ''}`}
                onClick={() => setActiveRoleTab('admin')}
              >
                <SVGIcon name="shield" size={16} />
                <span>Admin</span>
              </button>
            </div>

            <h2 className="auth-title">
              {activeRoleTab === 'resident' ? 'Resident Registration' : 'Admin Registration'}
            </h2>
            <p className="auth-subtitle">
              {activeRoleTab === 'resident'
                ? 'Join your society digital portal'
                : 'Create an admin account to manage society operations'}
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name <span className="req">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Sudhanshu Batra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="req">*</span></label>
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
              <label className="form-label">Flat / Apartment Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Flat A-204"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password <span className="req">*</span></label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-block btn-lg ${activeRoleTab === 'admin' ? 'btn-navy' : 'btn-primary'}`}
              style={activeRoleTab === 'resident' ? { background: '#6366F1', borderColor: '#6366F1' } : {}}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Register Account ➔`}
            </button>
          </form>

          <div className="auth-footer">
            Already registered?{' '}
            <Link to={`/login?role=${activeRoleTab}`} className="auth-link">
              Sign In Here
            </Link>
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
          <img src={authIllustration} alt="Digital Society Portal" className="auth-hero-illustration" />
          <h3 className="auth-hero-title">Your Residential Society</h3>
          <p className="auth-hero-tagline">
            Your society, now in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
