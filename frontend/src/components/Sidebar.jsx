import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
          <div className="sidebar-brand">
            <div className="brand-logo">🏢</div>
            <div className="brand-text">
              <div className="brand-name">Society Notebook</div>
              <div className="brand-sub">Management Suite</div>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={closeDrawer}>
            ✕
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
                to="/"
                className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <span className="link-icon">📋</span>
                <span className="link-text">My Complaints</span>
              </Link>
              <Link
                to="/notices"
                className={`sidebar-link ${isActive('/notices') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <span className="link-icon">📢</span>
                <span className="link-text">Notice Board</span>
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
                <span className="link-icon">📊</span>
                <span className="link-text">Dashboard</span>
              </Link>
              <Link
                to="/admin"
                className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <span className="link-icon">⚙️</span>
                <span className="link-text">Complaints Queue</span>
              </Link>
              <Link
                to="/notices"
                className={`sidebar-link ${isActive('/notices') ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <span className="link-icon">📢</span>
                <span className="link-text">Notice Board</span>
              </Link>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="link-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
