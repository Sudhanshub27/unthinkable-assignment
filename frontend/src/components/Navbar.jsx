import { useAuth } from '../context/AuthContext';
import SVGIcon from './SVGIcon';
import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Drawer"
        >
          <SVGIcon name="menu" size={20} />
        </button>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <NotificationBell />

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
