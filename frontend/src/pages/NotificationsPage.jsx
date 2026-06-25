// src/pages/NotificationsPage.jsx
import { useEffect } from 'react';
import useNotificationsStore from '../stores/notificationsStore.js';
import './NotificationsPage.css';

const TYPE_ICONS = {
  friend_request:          '👤',
  friend_request_accepted: '✅',
  friend_request_rejected: '❌',
  tried_to_reach_out:      '💬',
  group_message:           '👥',
};

const TYPE_COLORS = {
  friend_request:          'badge-info',
  friend_request_accepted: 'badge-success',
  friend_request_rejected: 'badge-error',
  tried_to_reach_out:      'badge-warning',
  group_message:           'badge-primary',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff/60)}m ago`;
  if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
}

export default function NotificationsPage() {
  const { unseen, unseenCount, history, isLoading, fetchUnseen, fetchHistory, clearUnseen } = useNotificationsStore();

  useEffect(() => {
    fetchUnseen();
    fetchHistory();
  }, []);

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <p>All your alerts and updates in one place.</p>
      </div>

      {unseenCount > 0 && (
        <div className="notif-unseen-banner glass-card">
          <div className="notif-unseen-info">
            <span className="badge badge-error animate-pulse">{unseenCount} new</span>
            <span>You have {unseenCount} unseen notification{unseenCount>1?'s':''}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearUnseen} id="mark-all-read-btn">Mark all read</button>
        </div>
      )}

      {/* Unseen */}
      {unseen.length > 0 && (
        <div className="notif-section">
          <h3 className="notif-section-title">🆕 New</h3>
          <div className="notif-list glass-card">
            {unseen.map((n, i) => (
              <div key={n.id||i} className={`notif-item notif-item-new`}>
                <div className="notif-icon">{TYPE_ICONS[n.type] || '🔔'}</div>
                <div className="notif-body">
                  <p className="notif-message">{n.message}</p>
                  <div className="notif-meta">
                    <span className={`badge ${TYPE_COLORS[n.type]||'badge-secondary'}`}>{n.type?.replace(/_/g,' ')}</span>
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="notif-section">
        <h3 className="notif-section-title">📋 History</h3>
        {isLoading ? (
          <div className="notif-list glass-card">{[...Array(5)].map((_,i)=><div key={i} className="skeleton-card" style={{height:64,borderRadius:8}}/>)}</div>
        ) : history.length === 0 ? (
          <div className="notif-empty glass-card">
            <div style={{fontSize:'3rem'}}>🔔</div>
            <h3>No notifications yet</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="notif-list glass-card">
            {history.map((n, i) => (
              <div key={n.id||i} className="notif-item">
                <div className="notif-icon">{TYPE_ICONS[n.type] || '🔔'}</div>
                <div className="notif-body">
                  <p className="notif-message">{n.message}</p>
                  <div className="notif-meta">
                    <span className={`badge ${TYPE_COLORS[n.type]||'badge-secondary'}`}>{n.type?.replace(/_/g,' ')}</span>
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
