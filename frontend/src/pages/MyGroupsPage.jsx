// src/pages/MyGroupsPage.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGroupsStore from '../stores/groupsStore.js';
import './GroupsPage.css';

export default function MyGroupsPage() {
  const { myGroups, isLoading, fetchMyGroups } = useGroupsStore();

  useEffect(() => { fetchMyGroups(); }, []);

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div className="page-header">
          <h1>🗂️ My Groups</h1>
          <p>Study groups you have joined.</p>
        </div>
        <Link to="/groups" className="btn btn-primary" id="browse-groups-btn">Browse All Groups</Link>
      </div>

      {isLoading && !myGroups.length ? (
        <div className="groups-grid">{[...Array(4)].map((_,i) => <div key={i} className="skeleton-card" style={{height:180}} />)}</div>
      ) : myGroups.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">🗂️</div>
          <h3>You haven't joined any groups</h3>
          <p>Browse study groups and join one!</p>
          <Link to="/groups" className="btn btn-primary">Browse Groups</Link>
        </div>
      ) : (
        <div className="groups-grid">
          {myGroups.map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="group-card glass-card" id={`my-group-${g.id}`}>
              <div className="group-card-header">
                <div className="group-avatar">{g.name?.charAt(0)?.toUpperCase()}</div>
                <span className={`badge ${g.isPrivate ? 'badge-warning' : 'badge-success'}`}>
                  {g.isPrivate ? '🔒 Private' : '🌐 Public'}
                </span>
              </div>
              <div className="group-card-body">
                <h3 className="group-name">{g.name}</h3>
                <p className="group-desc">{g.description || 'No description.'}</p>
              </div>
              <div className="group-card-footer">
                <span className="btn btn-secondary btn-sm" style={{pointerEvents:'none'}}>Open →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
