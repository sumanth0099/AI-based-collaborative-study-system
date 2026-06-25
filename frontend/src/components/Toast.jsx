// src/components/Toast.jsx
import { useEffect } from 'react';
import useUIStore from '../stores/uiStore.js';
import './Toast.css';

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

function ToastItem({ toast }) {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{ICONS[toast.type] || 'ℹ'}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close">×</button>
    </div>
  );
}

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
