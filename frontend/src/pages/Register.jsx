import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', flatNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 30 }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-icon" style={{ width: 48, height: 48, fontSize: '1.6rem', margin: '0 auto 12px auto' }}>
            🏠
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Resident Registration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Create an account to log complaints and receive updates
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Doe" required />
          </div>

          <div className="form-group">
            <label>Flat / Apartment Number</label>
            <input value={form.flatNumber} onChange={(e) => update('flatNumber', e.target.value)} placeholder="e.g. A-402" required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Resident Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
