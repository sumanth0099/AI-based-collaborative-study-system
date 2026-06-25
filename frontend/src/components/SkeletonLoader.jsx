// src/components/SkeletonLoader.jsx
import './SkeletonLoader.css';

export function SkeletonLine({ width = '100%', height = '16px' }) {
  return <div className="skeleton" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card glass-card">
      <SkeletonLine width="60%" height="20px" />
      <div style={{ marginTop: '12px' }}>
        <SkeletonLine height="14px" />
        <div style={{ marginTop: '6px' }}>
          <SkeletonLine width="80%" height="14px" />
        </div>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <SkeletonLine width="60px" height="24px" />
        <SkeletonLine width="60px" height="24px" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
          <SkeletonLine width="40px" height="40px" />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="40%" height="14px" />
            <div style={{ marginTop: '6px' }}>
              <SkeletonLine width="70%" height="12px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
