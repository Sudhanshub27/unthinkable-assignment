import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import SVGIcon from './SVGIcon';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (setIsOpen) setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const closeDrawer = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeDrawer} />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            <div className="brand-text">
              <div className="brand-name" style={{ fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.2, color: '#ffffff' }}>
                {settings.society_name || 'Society Notebook'}
              </div>
              <div className="brand-sub">Management Suite</div>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={closeDrawer} aria-label="Close sidebar">
            <SVGIcon name="x" size={18} />
          </button>
        </div>

        <div className="sidebar-user-card">
          <div className="avatar-circle">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-meta">
              <span className={`role-pill role-${user.role}`}>{user.role}</span>
              {user.flat_number && <span className="flat-pill">Flat {user.flat_number}</span>}
            </div>
          </div>
        </div>

        <div className="sidebar-nav-section">
          <div className="nav-section-label">MAIN NAVIGATION</div>

          {user.role === 'resident' && (
            <>
              <Link
                to="/dashboard"
                className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="layout-dashboard" size={18} className="link-icon-svg" />
                <span className="link-text">Dashboard</span>
              </Link>
              <Link
                to="/complaints"
                className={`sidebar-link ${isActive('/complaints') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="clipboard" size={18} className="link-icon-svg" />
                <span className="link-text">My Complaints</span>
              </Link>
              <Link
                to="/notices"
                className={`sidebar-link ${isActive('/notices') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="megaphone" size={18} className="link-icon-svg" />
                <span className="link-text">Notice Board</span>
              </Link>
              <Link
                to="/profile"
                className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="user" size={18} className="link-icon-svg" />
                <span className="link-text">Profile</span>
              </Link>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`sidebar-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="layout-dashboard" size={18} className="link-icon-svg" />
                <span className="link-text">Dashboard</span>
              </Link>
              <Link
                to="/admin"
                className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="clipboard" size={18} className="link-icon-svg" />
                <span className="link-text">Complaints</span>
              </Link>
              <Link
                to="/notices"
                className={`sidebar-link ${isActive('/notices') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="megaphone" size={18} className="link-icon-svg" />
                <span className="link-text">Notice Board</span>
              </Link>
              <Link
                to="/admin/settings"
                className={`sidebar-link ${isActive('/admin/settings') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="settings" size={18} className="link-icon-svg" />
                <span className="link-text">Settings</span>
              </Link>
              <Link
                to="/admin/emails"
                className={`sidebar-link ${isActive('/admin/emails') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="mail" size={18} className="link-icon-svg" />
                <span className="link-text">Email Activity</span>
              </Link>
              <Link
                to="/profile"
                className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <SVGIcon name="user" size={18} className="link-icon-svg" />
                <span className="link-text">Profile</span>
              </Link>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <SVGIcon name="log-out" size={18} className="link-icon-svg" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
