import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/complaints':
      case '/':
        return { title: 'Resident Portal', sub: 'Raise maintenance issues and track status history' };
      case '/admin':
        return { title: 'Complaints Operations Queue', sub: 'Triage, assign priorities, and resolve resident complaints' };
      case '/admin/dashboard':
        return { title: 'Executive Analytics Console', sub: 'Society maintenance performance, category breakdown & threshold settings' };
      case '/notices':
        return { title: 'Community Notice Board', sub: 'Official society announcements and broadcasts' };
      default:
        return { title: 'Society Maintenance Tracker', sub: 'Smart Housing Society Operations' };
    }
  };

  const { title, sub } = getPageTitle();

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Drawer"
        >
          ☰
        </button>
        <div className="page-title-box">
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle">{sub}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="notification-bell-box" title="System Status Active">
          <span className="bell-icon">🔔</span>
          <span className="bell-pulse-dot" />
        </div>

        <div className="header-user-badge">
          <div className="header-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">
              {user.role} {user.flat_number ? `• Flat ${user.flat_number}` : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
