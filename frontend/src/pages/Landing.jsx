import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SVGIcon from '../components/SVGIcon';
import heroCommunityIllustration from '../assets/nivaas-hero-community.png';

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
      addToast(`Welcome back to your society portal, ${loggedUser.name}!`, 'success');
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
      {/* 1. TOP NAVBAR */}
      <header className="nivaas-entrance-navbar">
        <div className="nivaas-entrance-container nivaas-entrance-navbar-inner">
          <div className="nivaas-brand-group">
            <img src="/logo.png" alt="Nivaas Logo" className="nivaas-entrance-logo" />
            <div className="nivaas-brand-titles">
              <span className="nivaas-app-name">Nivaas</span>
              <span className="nivaas-society-badge">
                <SVGIcon name="home" size={12} />
                <span>Digital Society Portal</span>
              </span>
            </div>
          </div>

          <div className="nivaas-entrance-nav-links">
            <a href="#features" className="entrance-nav-link">Features</a>
            <a href="#how-it-works" className="entrance-nav-link">How it Works</a>
            <a href="#previews" className="entrance-nav-link">Previews</a>
            <a href="#role-selection" className="btn btn-outline btn-sm">Sign In</a>
          </div>
        </div>
      </header>

      {/* 2. ENTRANCE HERO SECTION */}
      <section className="nivaas-hero-entrance">
        <div className="nivaas-entrance-container nivaas-hero-grid">
          <div className="nivaas-hero-text">
            <div className="nivaas-hero-pill">
              <span className="pill-dot"></span>
              <span>Your Society Portal</span>
            </div>
            <h1 className="nivaas-hero-headline">
              Your society, now in one place.
            </h1>
            <p className="nivaas-hero-subtext">
              Raise maintenance complaints, track their progress, stay updated with society notices, and keep everything happening in your community organized.
            </p>

            <div className="nivaas-hero-ctas" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#role-selection" className="btn btn-primary btn-lg" style={{ background: '#6366F1', borderColor: '#6366F1' }}>
                <span>Enter Your Society</span>
                <SVGIcon name="arrow-right" size={18} />
              </a>
              <a href="#features" className="btn btn-outline btn-lg">
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          <div className="nivaas-hero-visual-wrapper">
            <img
              src={heroCommunityIllustration}
              alt="Digital Society Community Illustration"
              className="nivaas-hero-illustration"
            />
          </div>
        </div>
      </section>

      {/* 3. WHAT CAN YOU DO WITH NIVAAS? (4 COLORFUL FEATURE CARDS) */}
      <section className="nivaas-features-section" id="features" style={{ padding: '64px 0', background: '#FFFFFF' }}>
        <div className="nivaas-entrance-container">
          <div className="nivaas-section-header text-center" style={{ marginBottom: 48 }}>
            <h2 className="section-headline" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
              What can you do with Nivaas?
            </h2>
            <p className="section-subtext" style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto' }}>
              Everything your residential society needs to stay connected, transparent, and organized.
            </p>
          </div>

          <div className="nivaas-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {/* Card 1: Raise a Complaint */}
            <div className="feature-card" style={{ padding: 28, background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 'var(--radius-lg)' }}>
              <div className="feature-icon-chip" style={{ width: 48, height: 48, borderRadius: 12, background: '#F97316', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <SVGIcon name="clipboard" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Raise a Complaint
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Report maintenance issues with photos and descriptions, so the right people can take action.
              </p>
            </div>

            {/* Card 2: Track Your Complaint */}
            <div className="feature-card" style={{ padding: 28, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 'var(--radius-lg)' }}>
              <div className="feature-icon-chip" style={{ width: 48, height: 48, borderRadius: 12, background: '#8B5CF6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <SVGIcon name="clock" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Track Your Complaint
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Follow every update from Open to In Progress to Resolved, with a complete history timeline.
              </p>
            </div>

            {/* Card 3: Stay Updated */}
            <div className="feature-card" style={{ padding: 28, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-lg)' }}>
              <div className="feature-icon-chip" style={{ width: 48, height: 48, borderRadius: 12, background: '#F59E0B', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <SVGIcon name="megaphone" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Stay Updated
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Never miss important society announcements, maintenance schedules, and meeting notices.
              </p>
            </div>

            {/* Card 4: Know What's Happening */}
            <div className="feature-card" style={{ padding: 28, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 'var(--radius-lg)' }}>
              <div className="feature-icon-chip" style={{ width: 48, height: 48, borderRadius: 12, background: '#14B8A6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <SVGIcon name="layout-dashboard" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Know What's Happening
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Get a clear view of your society's latest updates, status breakdowns, and activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (3 COLORFUL STEPS) */}
      <section className="nivaas-steps-section" id="how-it-works" style={{ padding: '64px 0', background: 'var(--bg-page)' }}>
        <div className="nivaas-entrance-container">
          <div className="nivaas-section-header text-center" style={{ marginBottom: 48 }}>
            <h2 className="section-headline" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
              How Nivaas works
            </h2>
            <p className="section-subtext" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              Three simple steps to manage maintenance and stay connected with your community.
            </p>
          </div>

          <div className="nivaas-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            <div className="step-card" style={{ background: '#FFFFFF', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="step-number-badge" style={{ width: 44, height: 44, borderRadius: 50, background: '#FFF7ED', color: '#F97316', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '2px solid #FFEDD5' }}>
                01
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Raise an issue
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Submit a maintenance complaint with specific issue details and optional photo attachment.
              </p>
            </div>

            <div className="step-card" style={{ background: '#FFFFFF', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="step-number-badge" style={{ width: 44, height: 44, borderRadius: 50, background: '#F5F3FF', color: '#8B5CF6', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '2px solid #DDD6FE' }}>
                02
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Track the progress
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Follow status changes, priority assignments, and updates from your society admin.
              </p>
            </div>

            <div className="step-card" style={{ background: '#FFFFFF', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="step-number-badge" style={{ width: 44, height: 44, borderRadius: 50, background: '#F0FDFA', color: '#14B8A6', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '2px solid #99F6E4' }}>
                03
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Stay informed
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Receive important society notices, community updates, and meeting announcements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PREVIEWS SECTION: NOTICE BOARD & COMPLAINT TRACKER */}
      <section className="nivaas-previews-section" id="previews" style={{ padding: '64px 0', background: '#FFFFFF' }}>
        <div className="nivaas-entrance-container">
          <div className="nivaas-section-header text-center" style={{ marginBottom: 48 }}>
            <h2 className="section-headline" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
              Stay connected with your society
            </h2>
            <p className="section-subtext" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              A preview of how notices and complaint tracking look inside the portal.
            </p>
          </div>

          <div className="previews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            {/* NOTICE BOARD PREVIEW CARD */}
            <div className="preview-card" style={{ background: 'var(--bg-page)', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <SVGIcon name="megaphone" size={20} color="#F59E0B" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                  Notice Board Preview
                </h3>
              </div>

              <div className="mock-notices-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', marginBottom: 4, textTransform: 'uppercase' }}>
                    📌 Important Announcement
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px 0' }}>
                    Water supply maintenance scheduled tomorrow
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Water supply will be paused from 10:00 AM to 2:00 PM for overhead tank cleaning.
                  </p>
                </div>

                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0D9488', marginBottom: 4, textTransform: 'uppercase' }}>
                    📢 Community Update
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px 0' }}>
                    Society meeting this Sunday
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Annual general discussion on security upgrades and festival arrangements at 5 PM in the clubhouse.
                  </p>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    🔔 General Notice
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px 0' }}>
                    New maintenance schedule available
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Monthly maintenance receipts and breakdown reports have been published.
                  </p>
                </div>
              </div>
            </div>

            {/* COMPLAINT TRACKER PREVIEW CARD */}
            <div className="preview-card" style={{ background: 'var(--bg-page)', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <SVGIcon name="clipboard" size={20} color="#8B5CF6" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                  Complaint Tracker Preview
                </h3>
              </div>

              <div className="mock-complaint-box" style={{ background: '#FFFFFF', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14B8A6', background: '#F0FDFA', padding: '3px 8px', borderRadius: 4 }}>
                    Plumbing
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C', background: '#FEF2F2', padding: '3px 8px', borderRadius: 'var(--radius-pill)' }}>
                    HIGH PRIORITY
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px 0' }}>
                  Water Leakage in Main Pipe
                </h4>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Unit: Flat A-204 • Reported 2 hours ago
                </div>

                {/* Mock Stepper */}
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Live Progress Timeline
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ color: '#16A34A', fontWeight: 700 }}>Reported ✓</div>
                    <div style={{ color: '#16A34A', fontWeight: 700 }}>Under Review ✓</div>
                    <div style={{ color: '#8B5CF6', fontWeight: 700 }}>In Progress ●</div>
                    <div style={{ color: '#94A3B8', fontWeight: 500 }}>Resolved ○</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ROLE SELECTION ENTRANCE CARDS */}
      <section className="nivaas-role-entrance-section" id="role-selection">
        <div className="nivaas-entrance-container">
          <div className="nivaas-role-header">
            <h2 className="nivaas-role-title">How would you like to enter?</h2>
            <p className="nivaas-role-subtitle">
              Choose your role to access your society workspace.
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
                Raise complaints, track issues, read notices and stay connected with your society.
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
              </ul>

              <div className="role-card-actions">
                <Link to="/login?role=resident" className="btn btn-primary btn-block btn-lg" style={{ background: '#6366F1', borderColor: '#6366F1' }}>
                  <span>Continue as Resident →</span>
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
                Manage complaints, update statuses, publish notices and monitor society activity.
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
              </ul>

              <div className="role-card-actions">
                <Link to="/login?role=admin" className="btn btn-navy btn-block btn-lg">
                  <span>Continue as Admin →</span>
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

      {/* FOOTER */}
      <footer className="nivaas-entrance-footer">
        <div className="nivaas-entrance-container">
          <div className="nivaas-footer-content">
            <div className="nivaas-footer-brand">
              <img src="/logo.png" alt="Nivaas Logo" className="nivaas-footer-logo" />
              <div>
                <span className="nivaas-footer-title">Nivaas</span>
                <p className="nivaas-footer-sub">Digital Society Portal</p>
              </div>
            </div>
            <p className="nivaas-footer-copy">
              Your society, now in one place. Built for residential communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
