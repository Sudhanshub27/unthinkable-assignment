import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SVGIcon from '../components/SVGIcon';
import heroIllustration from '../assets/hero-illustration.png';

export default function Landing() {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(null);

  // If user is already logged in, redirect to their dashboard
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  async function handleQuickDemo(email, password, roleLabel) {
    setDemoLoading(roleLabel);
    try {
      const loggedUser = await login(email, password);
      addToast(`Welcome to Green Valley Residency, ${loggedUser.name}!`, 'success');
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Demo Login Error:', err);
      addToast('Demo sign-in failed. Please check server.', 'error');
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="nivaas-entrance-page">
      {/* Top Society Header */}
      <header className="nivaas-entrance-navbar">
        <div className="nivaas-entrance-container nivaas-entrance-navbar-inner">
          <div className="nivaas-brand-group">
            <img src="/logo.png" alt="Nivaas Logo" className="nivaas-entrance-logo" />
            <div className="nivaas-brand-titles">
              <span className="nivaas-app-name">Nivaas</span>
              <span className="nivaas-society-badge">
                <SVGIcon name="shield" size={12} />
                <span>Green Valley Residency</span>
              </span>
            </div>
          </div>

          <div className="nivaas-header-right">
            <span className="nivaas-portal-tag">Digital Community Portal</span>
          </div>
        </div>
      </header>

      {/* Entrance Hero Section */}
      <section className="nivaas-hero-entrance">
        <div className="nivaas-entrance-container nivaas-hero-grid">
          <div className="nivaas-hero-text">
            <div className="nivaas-hero-pill">
              <span className="pill-dot"></span>
              <span>Green Valley Residency Digital Portal</span>
            </div>
            <h1 className="nivaas-hero-headline">
              Your society, now in one place.
            </h1>
            <p className="nivaas-hero-subtext">
              Welcome to the digital home of Green Valley Residency. Track maintenance complaints, read official announcements, and manage society updates seamlessly.
            </p>

            {/* Society Features Quick Strip */}
            <div className="nivaas-features-strip">
              <div className="strip-item">
                <SVGIcon name="clipboard" size={16} className="text-blue" />
                <span>Complaints</span>
              </div>
              <div className="strip-item">
                <SVGIcon name="megaphone" size={16} className="text-amber" />
                <span>Notices</span>
              </div>
              <div className="strip-item">
                <SVGIcon name="bell" size={16} className="text-purple" />
                <span>Society Updates</span>
              </div>
              <div className="strip-item">
                <SVGIcon name="shield" size={16} className="text-green" />
                <span>Role Access</span>
              </div>
            </div>
          </div>

          <div className="nivaas-hero-visual-wrapper">
            <img
              src={heroIllustration}
              alt="Green Valley Residency Digital Home"
              className="nivaas-hero-illustration"
            />
          </div>
        </div>
      </section>

      {/* Role Selection Entrance Cards */}
      <section className="nivaas-role-entrance-section" id="role-selection">
        <div className="nivaas-entrance-container">
          <div className="nivaas-role-header">
            <h2 className="nivaas-role-title">How would you like to enter?</h2>
            <p className="nivaas-role-subtitle">
              Select your portal role to access your society workspace.
            </p>
          </div>

          <div className="nivaas-role-cards-grid">
            {/* 1. RESIDENT ROLE CARD */}
            <div className="nivaas-role-card role-card-resident">
              <div className="role-card-top">
                <div className="role-icon-chip chip-resident">
                  <SVGIcon name="user" size={28} />
                </div>
                <span className="role-tag tag-resident">Resident Portal</span>
              </div>

              <h3 className="role-title">Resident</h3>
              <p className="role-desc">
                Access your personal society portal to log maintenance issues, view notice board updates, and track resolution.
              </p>

              <ul className="role-checklist">
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>View & raise maintenance complaints</span>
                </li>
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Track resolution progress in real time</span>
                </li>
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Read official society notices</span>
                </li>
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Stay updated with society activity</span>
                </li>
              </ul>

              <div className="role-card-actions">
                <Link to="/login?role=resident" className="btn btn-primary btn-block btn-lg">
                  <span>Continue as Resident</span>
                  <SVGIcon name="arrow-right" size={18} />
                </Link>

                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-sm mt-2"
                  onClick={() => handleQuickDemo('resident@society.com', 'Resident@123', 'resident')}
                  disabled={demoLoading !== null}
                >
                  {demoLoading === 'resident' ? 'Entering Resident Demo...' : '⚡ Quick Resident Demo'}
                </button>
              </div>
            </div>

            {/* 2. ADMIN ROLE CARD */}
            <div className="nivaas-role-card role-card-admin">
              <div className="role-card-top">
                <div className="role-icon-chip chip-admin">
                  <SVGIcon name="shield" size={28} />
                </div>
                <span className="role-tag tag-admin">Management Control</span>
              </div>

              <h3 className="role-title">Admin</h3>
              <p className="role-desc">
                Access the society control center to manage complaints queue, publish announcements, and oversee society operations.
              </p>

              <ul className="role-checklist">
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Manage & update complaints queue</span>
                </li>
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Post & pin official society notices</span>
                </li>
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Monitor overdue complaints & SLAs</span>
                </li>
                <li>
                  <SVGIcon name="check-circle" size={16} className="check-icon" />
                  <span>Inspect email logs & audit trails</span>
                </li>
              </ul>

              <div className="role-card-actions">
                <Link to="/login?role=admin" className="btn btn-navy btn-block btn-lg">
                  <span>Continue as Admin</span>
                  <SVGIcon name="arrow-right" size={18} />
                </Link>

                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-sm mt-2"
                  onClick={() => handleQuickDemo('admin@society.com', 'Admin@123', 'admin')}
                  disabled={demoLoading !== null}
                >
                  {demoLoading === 'admin' ? 'Entering Admin Demo...' : '⚡ Quick Admin Demo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nivaas-entrance-footer">
        <div className="nivaas-entrance-container">
          <div className="nivaas-footer-content">
            <div className="nivaas-footer-brand">
              <img src="/logo.png" alt="Nivaas Logo" className="nivaas-footer-logo" />
              <div>
                <span className="nivaas-footer-title">Nivaas</span>
                <p className="nivaas-footer-sub">Green Valley Residency • Digital Community Portal</p>
              </div>
            </div>
            <p className="nivaas-footer-copy">
              Your society, now in one place. Built for modern housing societies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
