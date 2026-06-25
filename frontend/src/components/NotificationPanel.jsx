// src/components/NotificationPanel.jsx
import { useEffect } from 'react';
import useNotificationsStore from '../stores/notificationsStore.js';
import './NotificationPanel.css';

const TYPE_LABELS = {
  friend_request:          'Friend Request',
  friend_request_accepted: 'Request Accepted',
  friend_request_rejected: 'Request Rejected',
  tried_to_reach_out:      'Private Message',
  group_message:           'Group Message',
};

const TYPE_ICONS = {
  friend_request:          '👋',
  friend_request_accepted: '✅',
  friend_request_rejected: '❌',
  tried_to_reach_out:      '💬',
  group_message:           '👥',
};

export default function NotificationPanel({ isOpen, onClose }) {
  const { unseen, history, unseenCount, fetchUnseen, fetchHistory, clearUnseen } = useNotificationsStore();

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      fetchUnseen();
    }
  }, [isOpen, fetchHistory, fetchUnseen]);

  const allNotifications = [
    ...unseen.map((n) => ({ ...n, isNew: true })),
    ...history.filter((h) => !unseen.find((u) => u.id === h.id)),
  ];

  if (!isOpen) return null;

  return (
    <div className="notif-panel-backdrop" onClick={onClose}>
      <div className="notif-panel animate-slide-right" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Notifications panel">
        <div className="notif-panel-header">
          <h3>Notifications</h3>
          {unseenCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearUnseen}>
              Mark all read
            </button>
          )}
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="notif-panel-body">
          {allNotifications.length === 0 ? (
            <div className="notif-empty">
              <span>🔔</span>
              <p>No notifications yet</p>
            </div>
          ) : (
            allNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-item glass-card ${notif.isNew ? 'notif-item-new' : ''}`}
              >
                <span className="notif-item-icon">{TYPE_ICONS[notif.type] || '🔔'}</span>
                <div className="notif-item-content">
                  <p className="notif-item-type">{TYPE_LABELS[notif.type] || notif.type}</p>
                  <p className="notif-item-message">{notif.message}</p>
                  <time className="notif-item-time">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}
                  </time>
                </div>
                {notif.isNew && <span className="notif-item-dot" aria-label="New" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
