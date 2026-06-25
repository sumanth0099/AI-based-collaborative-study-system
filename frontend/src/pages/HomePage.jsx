// src/pages/HomePage.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHomeData } from '../api/pages.api.js';
import useAuthStore from '../stores/authStore.js';
import { create } from 'zustand';
import './HomePage.css';

// Local store for home data
const useHomeStore = create((set) => ({
  data: null,
  isLoading: true,
  error: null,
  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getHomeData();
      set({ data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

function StatCard({ icon, label, value, color }) {
  return (
    <div className="home-stat-card glass-card">
      <div className="home-stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <div className="home-stat-value">{value ?? '—'}</div>
        <div className="home-stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, fetch } = useHomeStore();

  useEffect(() => { fetch(); }, [fetch]);

  const name = user?.name || user?.username || 'Student';

  return (
    <div className="home-page">
      {/* Hero greeting */}
      <div className="home-hero">
        <div className="home-hero-text">
          <h1>Welcome back, <span className="gradient-text">{name}</span> 👋</h1>
          <p>Here's what's happening with your studies today.</p>
        </div>
        <Link to="/ai" className="btn btn-primary" id="home-ai-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          AI Tools
        </Link>
      </div>

      {isLoading && (
        <div className="home-loading">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      )}

      {error && (
        <div className="home-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Could not load home data. <button className="btn btn-ghost btn-sm" onClick={fetch}>Retry</button>
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Stats row */}
          <div className="home-stats">
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              label="Total Notes"
              value={data.stats?.notesCount ?? data.notesCount}
              color="rgba(124,58,237,0.3)"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
              label="Study Groups"
              value={data.stats?.groupsCount ?? data.groupsCount}
              color="rgba(6,182,212,0.3)"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>}
              label="AI Insight"
              value={data.aiInsight ?? '✨'}
              color="rgba(245,158,11,0.3)"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              label="Friends"
              value={data.stats?.friendsCount ?? '—'}
              color="rgba(16,185,129,0.3)"
            />
          </div>

          <div className="home-grid">
            {/* Recent Notes */}
            <div className="home-section glass-card">
              <div className="home-section-header">
                <h3>📝 Recent Notes</h3>
                <Link to="/notes" className="btn btn-ghost btn-sm">View all</Link>
              </div>
              {(data.recentNotes?.length ?? 0) === 0 ? (
                <p className="home-empty">No notes yet. <Link to="/notes">Create one</Link></p>
              ) : (
                <ul className="home-list">
                  {data.recentNotes.slice(0, 5).map((n) => (
                    <li key={n.id} className="home-list-item">
                      <Link to={`/notes/${n.id}`} className="home-list-link">
                        <span className="home-list-title">{n.name}</span>
                        <span className={`badge badge-${n.topicImportance === 'high' ? 'error' : n.topicImportance === 'medium' ? 'warning' : 'secondary'}`}>{n.topicImportance || 'note'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* My Groups */}
            <div className="home-section glass-card">
              <div className="home-section-header">
                <h3>👥 My Groups</h3>
                <Link to="/my-groups" className="btn btn-ghost btn-sm">View all</Link>
              </div>
              {(data.myGroups?.length ?? 0) === 0 ? (
                <p className="home-empty">Not in any groups. <Link to="/groups">Browse groups</Link></p>
              ) : (
                <ul className="home-list">
                  {data.myGroups.slice(0, 5).map((g) => (
                    <li key={g.id} className="home-list-item">
                      <Link to={`/groups/${g.id}`} className="home-list-link">
                        <span className="home-list-title">{g.name}</span>
                        <span className={`badge ${g.isPrivate ? 'badge-warning' : 'badge-success'}`}>{g.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Activity */}
            {data.recentGroupActivity && data.recentGroupActivity.length > 0 && (
              <div className="home-section glass-card">
                <div className="home-section-header">
                  <h3>🔔 Recent Activity</h3>
                </div>
                <ul className="home-list">
                  {data.recentGroupActivity.slice(0, 5).map((a, i) => (
                    <li key={i} className="home-list-item">
                      <span className="home-list-title">{a.content || a.message || JSON.stringify(a)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pending Actions */}
            {data.pendingActions && data.pendingActions.length > 0 && (
              <div className="home-section glass-card">
                <div className="home-section-header">
                  <h3>⚡ Pending Actions</h3>
                </div>
                <ul className="home-list">
                  {data.pendingActions.slice(0, 5).map((a, i) => (
                    <li key={i} className="home-list-item">
                      <span className="home-list-title">{a.message || JSON.stringify(a)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="home-quick-actions">
            <h3>Quick Actions</h3>
            <div className="quick-action-grid">
              {[
                { to: '/notes', icon: '📝', label: 'New Note', color: '#7c3aed' },
                { to: '/ai', icon: '🧠', label: 'AI Quiz', color: '#06b6d4' },
                { to: '/groups', icon: '👥', label: 'Find Group', color: '#10b981' },
                { to: '/resources', icon: '📁', label: 'Upload File', color: '#f59e0b' },
                { to: '/friends', icon: '👤', label: 'Add Friend', color: '#ef4444' },
                { to: '/dashboard', icon: '📊', label: 'Dashboard', color: '#8b5cf6' },
              ].map((qa) => (
                <Link
                  key={qa.to}
                  to={qa.to}
                  className="quick-action-card glass-card"
                  id={`quick-${qa.label.toLowerCase().replace(/ /g,'-')}`}
                >
                  <span className="quick-action-icon" style={{ background: `${qa.color}33` }}>{qa.icon}</span>
                  <span className="quick-action-label">{qa.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
