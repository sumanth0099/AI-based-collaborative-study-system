// src/pages/ProfilePage.jsx
import { useState } from 'react';
import useAuthStore from '../stores/authStore.js';
import { useNavigate, Link } from 'react-router-dom';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const getInitials = (u) => {
    if (!u) return '?';
    const name = u.name || u.username || u.email || '';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>👤 Profile</h1>
        <p>Your account information.</p>
      </div>

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="profile-avatar-card glass-card">
          <div className="profile-avatar-circle">
            {getInitials(user)}
          </div>
          <h2 className="profile-name">{user?.name || user?.username || 'Student'}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-badges">
            <span className="badge badge-primary">✨ Active Learner</span>
            {user?.googleId && <span className="badge badge-success">Google Account</span>}
          </div>
          <button
            className="btn btn-danger w-full"
            onClick={handleLogout}
            disabled={loggingOut}
            id="profile-logout-btn"
          >
            {loggingOut ? <><div className="spinner spinner-sm"/>Logging out...</> : '🚪 Log Out'}
          </button>
        </div>

        {/* Info card */}
        <div className="profile-info-card glass-card">
          <h3>Account Details</h3>
          <div className="profile-field">
            <span className="profile-field-label">User ID</span>
            <span className="profile-field-value">{user?.userId || user?.id || '—'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            <span className="profile-field-value">{user?.email || '—'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Username</span>
            <span className="profile-field-value">{user?.username || user?.name || '—'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Auth Method</span>
            <span className="profile-field-value">{user?.googleId ? '🔑 Google OAuth' : '🔐 Email & Password'}</span>
          </div>

          <hr className="divider" />
          <h3>Quick Links</h3>
          <div className="profile-quick-links">
            {[
              { href: '/notes',         icon: '📝', label: 'My Notes' },
              { href: '/resources',     icon: '📁', label: 'My Files' },
              { href: '/my-groups',     icon: '👥', label: 'My Groups' },
              { href: '/friends',       icon: '👤', label: 'Friends' },
              { href: '/notifications', icon: '🔔', label: 'Notifications' },
              { href: '/dashboard',     icon: '📊', label: 'Dashboard' },
            ].map(l => (
              <Link key={l.href} to={l.href} className="profile-quick-link glass-card">
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}