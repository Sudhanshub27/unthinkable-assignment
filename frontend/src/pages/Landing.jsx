import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SVGIcon from '../components/SVGIcon';

import heroIllustration from '../assets/hero-illustration.png';
import featureComplaints from '../assets/feature-complaints.png';
import featureNotices from '../assets/feature-notices.png';
import featureRoles from '../assets/feature-roles.png';

export default function Landing() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is already logged in, redirect to their dashboard
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* 1. PUBLIC NAVBAR */}
      <header className={`landing-navbar ${scrolled ? 'landing-navbar-scrolled' : ''}`}>
        <div className="landing-container landing-navbar-inner">
          <Link to="/" className="landing-brand">
            <img src="/logo.png" alt="Society Logo" className="landing-brand-logo" />
            <span className="landing-brand-name">Society Tracker</span>
          </Link>

          <nav className="landing-nav-links desktop-only-flex">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how-it-works" className="landing-nav-link">How it Works</a>
            <a href="#contact" className="landing-nav-link">Contact</a>
          </nav>

          <div className="landing-nav-actions desktop-only-flex">
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>

          <button
            className="landing-hamburger-btn mobile-only-block"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <SVGIcon name={mobileMenuOpen ? 'x' : 'menu'} size={24} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu mobile-only-block">
            <a href="#features" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <a href="#contact" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <div className="landing-mobile-actions">
              <Link to="/login" className="btn btn-outline btn-block" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="landing-hero-section">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <SVGIcon name="shield" size={14} />
              <span>Modern Society Management</span>
            </div>
            <h1 className="landing-hero-title">
              Digital Maintenance Tracking for Modern Housing Societies
            </h1>
            <p className="landing-hero-subtitle">
              Streamline maintenance complaints, broadcast official society notices, and manage resident requests with role-based transparency and real-time audit logs.
            </p>
            <div className="landing-hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">
                <span>Get Started</span>
                <SVGIcon name="plus" size={18} />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                <span>Login</span>
                <SVGIcon name="user" size={18} />
              </Link>
            </div>
          </div>

          <div className="landing-hero-image-wrapper">
            <img src={heroIllustration} alt="Society Maintenance Hero Illustration" className="landing-hero-img" />
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="landing-section landing-features-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Everything Your Society Needs</h2>
            <p className="landing-section-subtitle">
              Designed for seamless communication between residents and management committees.
            </p>
          </div>

          <div className="landing-features-grid">
            {/* Feature 1 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon-chip chip-blue">
                <img src={featureComplaints} alt="Complaint Tracking Icon" className="landing-feature-chip-img" />
              </div>
              <h3 className="landing-feature-title">Complaint Tracking</h3>
              <p className="landing-feature-desc">
                Raise, track, and resolve maintenance complaints with full status history and SLA tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon-chip chip-orange">
                <img src={featureNotices} alt="Notice Board Icon" className="landing-feature-chip-img" />
              </div>
              <h3 className="landing-feature-title">Notice Board</h3>
              <p className="landing-feature-desc">
                Broadcast announcements and updates to all residents instantly with priority alerts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon-chip chip-green">
                <img src={featureRoles} alt="Role-Based Access Icon" className="landing-feature-chip-img" />
              </div>
              <h3 className="landing-feature-title">Role-Based Access</h3>
              <p className="landing-feature-desc">
                Separate resident and admin views with secure JWT authentication and audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section landing-how-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-subtitle">
              Get started with your housing society portal in 3 simple steps.
            </p>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step-card">
              <div className="landing-step-num-badge">1</div>
              <div className="landing-step-icon-chip">
                <SVGIcon name="user" size={24} color="var(--primary)" />
              </div>
              <h3 className="landing-step-title">1. Register Your Unit</h3>
              <p className="landing-step-desc">
                Create your resident account with your flat number and contact details in seconds.
              </p>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-num-badge">2</div>
              <div className="landing-step-icon-chip">
                <SVGIcon name="clipboard" size={24} color="var(--primary)" />
              </div>
              <h3 className="landing-step-title">2. Raise Complaints or Check Notices</h3>
              <p className="landing-step-desc">
                Log maintenance issues with description and photos, or browse official society notices.
              </p>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-num-badge">3</div>
              <div className="landing-step-icon-chip">
                <SVGIcon name="check-circle" size={24} color="var(--primary)" />
              </div>
              <h3 className="landing-step-title">3. Track Resolution in Real Time</h3>
              <p className="landing-step-desc">
                Monitor issue progress, receive automated email updates, and view full audit history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer id="contact" className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand-col">
              <div className="landing-brand">
                <img src="/logo.png" alt="Society Logo" className="landing-brand-logo" />
                <span className="landing-brand-name" style={{ color: '#FFFFFF' }}>Society Tracker</span>
              </div>
              <p className="landing-footer-tagline">
                Modern maintenance tracking and community portal for progressive residential societies.
              </p>
            </div>

            <div className="landing-footer-links-col">
              <h4 className="landing-footer-heading">Quick Links</h4>
              <a href="#features" className="landing-footer-link">Features</a>
              <a href="#how-it-works" className="landing-footer-link">How it Works</a>
              <Link to="/login" className="landing-footer-link">Login</Link>
              <Link to="/register" className="landing-footer-link">Register</Link>
            </div>

            <div className="landing-footer-links-col">
              <h4 className="landing-footer-heading">Support</h4>
              <a href="mailto:support@societytracker.com" className="landing-footer-link">Contact Support</a>
              <span className="landing-footer-link">24/7 SLA Tracking</span>
              <span className="landing-footer-link">Secure JWT Auth</span>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <p className="landing-footer-credit">
              Built by Sudhanshu | Society Maintenance Tracker © 2026. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
