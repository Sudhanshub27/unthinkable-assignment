import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import NotificationBell from './NotificationBell';
import {
  Home,
  ClipboardList,
  Megaphone,
  User,
  Settings,
  Mail,
  LogOut,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

import { getUserInitials } from '../utils/formatters';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  }

  const residentNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/complaints', label: 'My Complaints', icon: ClipboardList },
    { path: '/notices', label: 'Notice Board', icon: Megaphone },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin', label: 'Complaints', icon: ClipboardList },
    { path: '/admin/pending-admins', label: 'Admin Requests', icon: UserCheck },
    { path: '/notices', label: 'Notice Board', icon: Megaphone },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
    { path: '/admin/emails', label: 'Email Activity', icon: Mail },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const navItems = user.role === 'admin' ? adminNavItems : residentNavItems;

  return (
    <header className="sticky top-0 z-50 h-16 bg-paper-card border-b border-line shadow-soft px-3 sm:px-6 md:px-8 flex items-center justify-between">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link
          to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
          className="flex items-center gap-2 sm:gap-3 focus:outline-none min-w-0"
        >
          <img src="/logo.webp" alt="Angan Logo" className="h-8 sm:h-9 w-auto object-contain shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-display font-semibold text-base sm:text-lg text-ink truncate">Angan</span>
            <span className="text-[10px] sm:text-xs text-ink-muted truncate max-w-[170px] sm:max-w-none">
              {settings?.society_name || 'My Society'}
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3.5 h-full text-sm transition-colors border-b-2 ${
                active
                  ? 'text-terracotta-400 font-semibold border-terracotta-400'
                  : 'text-ink-secondary hover:text-ink border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right: Actions (Notification, Profile Avatar, Mobile Toggle) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NotificationBell />

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-500 to-clay-600 text-white flex items-center justify-center font-sans font-bold text-xs shadow-sm hover:opacity-95 transition-opacity focus:outline-none tracking-wider select-none"
            aria-label="User profile menu"
          >
            {getUserInitials(user.name)}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-56 bg-paper-card border border-line rounded-xl shadow-card py-2 z-50">
              <div className="px-4 py-2 border-b border-line">
                <div className="font-semibold text-sm text-ink truncate">{user.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-terracotta-50 text-terracotta-500 capitalize">
                    {user.role}
                  </span>
                  {user.flat_number && (
                    <span className="text-xs text-ink-muted">Flat {user.flat_number}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-ink-secondary hover:text-ink hover:bg-paper-hover flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-ink-muted" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-ink-secondary hover:text-ink focus:outline-none rounded-lg hover:bg-paper-hover transition-colors"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-paper-card border-b border-line shadow-card px-4 py-3 z-40 flex flex-col gap-1.5 animate-modal-backdrop">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-terracotta-50 text-terracotta-500 font-semibold border border-terracotta-100'
                    : 'text-ink-secondary hover:bg-paper-hover hover:text-ink'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
