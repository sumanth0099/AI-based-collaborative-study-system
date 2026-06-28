import { useState, useEffect } from 'react';
import { getNewsByCategory } from '../api/news.api.js';
import './News.css';

const CATEGORIES = [
  { key: 'scholarships', label: 'Scholarships' },
  { key: 'admissions',   label: 'Admissions' },
  { key: 'exams',        label: 'Exams' },
  { key: 'jobs',         label: 'Jobs & Internships' },
  { key: 'government',   label: 'Government' },
  { key: 'financialAid', label: 'Financial Aid' },
  { key: 'studyAbroad',  label: 'Study Abroad' },
  { key: 'courses',      label: 'Free Courses' },
  { key: 'competitions', label: 'Competitions' },
  { key: 'research',     label: 'Research' },
];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('scholarships');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async (category) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getNewsByCategory(category);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load news');
      }

      setArticles(data.data || []);
    } catch (err) {
      console.error('News fetch error:', err);
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  return (
    <div className="news-page">
      <div className="news-header">
        <h1>Education News</h1>
        <p>Stay updated with latest opportunities from India</p>
      </div>

      <div className="news-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`news-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <div className="news-loading">Fetching latest news...</div>}

      {error && (
        <div className="news-error">
          <p>⚠️ {error}</p>
          <button onClick={() => fetchNews(activeCategory)}>Retry</button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="news-empty">No articles found in this category.</p>
      )}

      <div className="news-grid">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            <div className="news-card-content">
              <div className="news-source">{article.source || 'News'}</div>
              <h3 className="news-title">{article.title}</h3>
              <p className="news-description">{article.description}</p>
            </div>
            <div className="news-footer">
              <span className="news-date">
                {article.publishedAt 
                  ? new Date(article.publishedAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', month: 'short' 
                    }) 
                  : 'Recent'}
              </span>
              <span className="news-read-more">Read →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}