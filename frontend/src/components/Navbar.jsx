import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="brand-container">
        <div className="brand-icon">🏢</div>
        <span className="brand-title">Society Tracker</span>
      </div>

      <div className="nav-links">
        {user.role === 'resident' && (
          <>
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
              📋 My Complaints
            </Link>
            <Link to="/notices" className={`nav-item ${isActive('/notices') ? 'active' : ''}`}>
              📢 Notice Board
            </Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
              ⚙️ Complaints Queue
            </Link>
            <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
              📊 Analytics Dashboard
            </Link>
            <Link to="/notices" className={`nav-item ${isActive('/notices') ? 'active' : ''}`}>
              📢 Notice Board
            </Link>
          </>
        )}
      </div>

      <div className="user-profile">
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-role-badge">
            {user.role} {user.flat_number ? `• ${user.flat_number}` : ''}
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
