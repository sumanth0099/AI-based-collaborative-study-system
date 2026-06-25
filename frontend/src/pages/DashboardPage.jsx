// src/pages/DashboardPage.jsx
import { useEffect } from 'react';
import { getDashboardData } from '../api/pages.api.js';
import { create } from 'zustand';
import './DashboardPage.css';

const useDashStore = create((set) => ({
  data: null,
  isLoading: true,
  error: null,
  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getDashboardData();
      set({ data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

function ProgressBar({ value, max = 100, color = 'var(--accent-primary)' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, fetch } = useDashStore();

  useEffect(() => { fetch(); }, [fetch]);

  if (isLoading) return (
    <div className="dash-page">
      <div className="page-header"><h1>📊 Dashboard</h1><p>Your learning analytics</p></div>
      <div className="dash-skeleton-grid">{[...Array(6)].map((_,i)=><div key={i} className="skeleton-card" style={{height:120}}/>)}</div>
    </div>
  );

  if (error) return (
    <div className="dash-page">
      <div className="page-header"><h1>📊 Dashboard</h1></div>
      <p style={{color:'var(--error)'}}>Error loading dashboard: {error}</p>
      <button className="btn btn-primary" onClick={fetch}>Retry</button>
    </div>
  );

  const quiz = data?.quizOverview || {};
  const topicPerf = data?.topicPerformance || [];
  const strongTopics = data?.strongTopics || [];
  const weakTopics = data?.weakTopics || [];
  const recentAttempts = data?.recentQuizAttempts || [];
  const monthlyActivity = data?.monthlyActivity || [];
  const aiInsights = data?.aiSummarizedInsights || data?.summary || '';

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Your personalized learning analytics and performance overview.</p>
      </div>

      {/* Overview cards */}
      <div className="dash-overview">
        {[
          { label: 'Total Notes',     value: data?.totalNotes ?? data?.totalItems?.notes ?? '—', icon: '📝', color: '#7c3aed' },
          { label: 'Quiz Attempts',   value: quiz.totalAttempts ?? '—',                           icon: '🎯', color: '#06b6d4' },
          { label: 'Avg Score',       value: quiz.averageScore != null ? `${Math.round(quiz.averageScore)}%` : '—', icon: '⭐', color: '#f59e0b' },
          { label: 'Resources',       value: data?.totalItems?.resources ?? '—',                  icon: '📁', color: '#10b981' },
          { label: 'Strong Topics',   value: strongTopics.length,                                 icon: '💪', color: '#8b5cf6' },
          { label: 'Needs Work',      value: weakTopics.length,                                   icon: '📖', color: '#ef4444' },
        ].map((c) => (
          <div key={c.label} className="dash-overview-card glass-card">
            <span className="dash-card-icon" style={{ background: `${c.color}22` }}>{c.icon}</span>
            <div className="dash-card-value">{c.value}</div>
            <div className="dash-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* AI Insights */}
        {aiInsights && (
          <div className="dash-section glass-card dash-full">
            <h3>🤖 AI Insights</h3>
            <p className="dash-ai-text">{typeof aiInsights === 'string' ? aiInsights : JSON.stringify(aiInsights)}</p>
          </div>
        )}

        {/* Topic Performance */}
        {topicPerf.length > 0 && (
          <div className="dash-section glass-card">
            <h3>📈 Topic Performance</h3>
            <div className="dash-topic-list">
              {topicPerf.map((t, i) => (
                <div key={i} className="dash-topic-item">
                  <div className="dash-topic-header">
                    <span className="dash-topic-name">{t.topic || t.name}</span>
                    <span className="dash-topic-score">{t.score ?? t.averageScore ?? 0}%</span>
                  </div>
                  <ProgressBar value={t.score ?? t.averageScore ?? 0} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong vs Weak */}
        <div className="dash-section glass-card">
          <h3>💪 Strong Topics</h3>
          {strongTopics.length === 0 ? <p style={{color:'var(--text-muted)'}}>No data yet. Take some quizzes!</p> : (
            <ul className="dash-badge-list">
              {strongTopics.map((t, i) => <li key={i}><span className="badge badge-success">{t.topic || t}</span></li>)}
            </ul>
          )}
          <h3 style={{marginTop:'var(--space-lg)'}}>📖 Needs Work</h3>
          {weakTopics.length === 0 ? <p style={{color:'var(--text-muted)'}}>Keep it up!</p> : (
            <ul className="dash-badge-list">
              {weakTopics.map((t, i) => <li key={i}><span className="badge badge-error">{t.topic || t}</span></li>)}
            </ul>
          )}
        </div>

        {/* Recent Quiz Attempts */}
        {recentAttempts.length > 0 && (
          <div className="dash-section glass-card">
            <h3>🏆 Recent Quizzes</h3>
            <div className="dash-attempts-list">
              {recentAttempts.slice(0, 5).map((a, i) => (
                <div key={i} className="dash-attempt-item">
                  <div>
                    <div className="dash-attempt-topic">{a.topic || 'Quiz'}</div>
                    <div className="dash-attempt-date">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                  <div className="dash-attempt-score" style={{ color: (a.score >= 70 ? 'var(--success)' : 'var(--error)') }}>
                    {a.score ?? a.quizScore ?? 0}/{a.totalQuestions ?? 10}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Activity */}
        {monthlyActivity.length > 0 && (
          <div className="dash-section glass-card dash-full">
            <h3>📅 Monthly Activity</h3>
            <div className="dash-monthly">
              {monthlyActivity.map((m, i) => (
                <div key={i} className="dash-month-item">
                  <div className="dash-month-bar" style={{ height: `${Math.min(100, (m.count || 1) * 10)}px` }} />
                  <span className="dash-month-label">{m.month || m.label || i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
