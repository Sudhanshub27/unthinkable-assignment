import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authIllustration from '../assets/auth-illustration.png';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

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
      });

      addToast(`Account created successfully! Welcome, ${user.name}.`, 'success');
      navigate('/complaints');
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
      {/* Left half: Existing Form */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <img
              src="/logo.png"
              alt="Society Notebook Logo"
              className="auth-form-logo"
              style={{ height: '40px', width: 'auto', display: 'block', margin: '0 auto 16px auto' }}
            />
            <h2 className="auth-title">Resident Registration</h2>
            <p className="auth-subtitle">Join your society maintenance portal</p>
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
                placeholder="e.g. Tower A - Flat 301"
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

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register Account ➔'}
            </button>
          </form>

          <div className="auth-footer">
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>

      {/* Right half: Hero Illustration side */}
      <div className="auth-hero-side">
        <div className="auth-hero-header">
          <img src="/logo.png" alt="Logo" className="auth-hero-logo" />
        </div>
        <div className="auth-hero-body">
          <img src={authIllustration} alt="Society Illustration" className="auth-hero-illustration" />
          <p className="auth-hero-tagline">
            Digital maintenance tracking for modern housing societies.
          </p>
        </div>
      </div>
    </div>
  );
}
