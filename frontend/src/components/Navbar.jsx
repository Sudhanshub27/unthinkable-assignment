import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className="navbar">
      <div>
        <span className="brand">🏢 Society Tracker</span>
        {user.role === 'resident' && (
          <>
            <Link to="/">My Complaints</Link>
            <Link to="/notices">Notices</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin">Complaints</Link>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/notices">Notices</Link>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{user.name} ({user.role})</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
