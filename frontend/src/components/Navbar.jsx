// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';
import useUIStore from '../stores/uiStore.js';
import useNotificationsStore from '../stores/notificationsStore.js';
import NotificationPanel from './NotificationPanel.jsx';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { unseenCount, fetchUnseen } = useNotificationsStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    fetchUnseen();
    const interval = setInterval(fetchUnseen, 30000);
    return () => clearInterval(interval);
  }, [fetchUnseen]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (u) => {
    if (!u) return '?';
    const name = u.name || u.username || u.email || '';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-left">
          <button
            className="btn btn-ghost btn-icon navbar-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            id="sidebar-toggle-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <Link to="/home" className="navbar-brand" id="navbar-home-link">
            <div className="navbar-logo">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="url(#logoGrad)"/>
                <path d="M8 20L16 12L20 16L24 11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="navbar-brand-name">StudyAI</span>
          </Link>
        </div>

        <div className="navbar-right">
          {/* Notifications */}
          <button
            className="btn btn-ghost btn-icon navbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            id="notifications-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unseenCount > 0 && (
              <span className="notification-badge animate-pulse" aria-label={`${unseenCount} unread notifications`}>
                {unseenCount > 99 ? '99+' : unseenCount}
              </span>
            )}
          </button>

          {/* User Avatar Menu */}
          <div className="navbar-user-menu" ref={userMenuRef}>
            <button
              className="navbar-avatar-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
              aria-expanded={showUserMenu}
              id="user-menu-btn"
            >
              <div className="navbar-avatar">{getInitials(user)}</div>
              <span className="navbar-username">{user?.name || user?.username || 'User'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showUserMenu && (
              <div className="navbar-dropdown animate-scale-in" role="menu">
                <div className="navbar-dropdown-header">
                  <p className="navbar-dropdown-name">{user?.name || user?.username}</p>
                  <p className="navbar-dropdown-email">{user?.email}</p>
                </div>
                <hr className="divider" style={{ margin: '8px 0' }} />
                <Link to="/profile" className="navbar-dropdown-item" role="menuitem" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </Link>
                <Link to="/notifications" className="navbar-dropdown-item" role="menuitem" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Notifications
                </Link>
                <hr className="divider" style={{ margin: '8px 0' }} />
                <button className="navbar-dropdown-item navbar-logout-btn" onClick={handleLogout} role="menuitem">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
