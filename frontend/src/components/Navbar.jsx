import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SVGIcon from './SVGIcon';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Resident Overview', sub: 'Active complaints summary, quick actions, and community notices' };
      case '/complaints':
      case '/':
        return { title: 'My Maintenance Complaints', sub: 'Track status, view timeline history, and submit new requests' };
      case '/admin':
        return { title: 'Complaints Operations Queue', sub: 'Triage, assign priorities, and resolve resident complaints' };
      case '/admin/dashboard':
        return { title: 'Executive Operations Overview', sub: 'Real-time complaint metrics, overdue SLA alerts & threshold controls' };
      case '/notices':
        return { title: 'Community Notice Board', sub: 'Official society announcements and broadcasts' };
      case '/admin/settings':
        return { title: 'Society SLA Settings', sub: 'Configure complaint threshold parameters and SLA resolution targets' };
      case '/profile':
        return { title: 'User Profile & Settings', sub: 'Account credentials, role parameters, and flat assignment' };
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
          <SVGIcon name="filter" size={20} />
        </button>
        <div className="page-title-box">
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle">{sub}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-user-badge">
          <div className="header-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">
              {user.role} • {user.flat_number ? `Flat ${user.flat_number}` : 'Flat not specified'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
