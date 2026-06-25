// src/pages/GroupsPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import useGroupsStore from '../stores/groupsStore.js';
import Modal from '../components/Modal.jsx';
import './GroupsPage.css';

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isPrivate: z.boolean(),
});

export default function GroupsPage() {
  const { groups, searchResults, isLoading, fetchGroups, searchGroups, createGroup } = useGroupsStore();
  const [searchQ, setSearchQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPrivate: false });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQ(q);
    if (q.trim()) searchGroups(q);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = groupSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setFormErrors(Object.fromEntries(Object.entries(flat).map(([k,v])=>[k,v?.[0]])));
      return;
    }
    setSaving(true);
    try {
      await createGroup(form);
      setShowCreate(false);
      setForm({ name: '', description: '', isPrivate: false });
    } catch (err) {
      setFormErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  const displayGroups = searchQ.trim() ? searchResults : groups;

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div className="page-header">
          <h1>👥 Groups</h1>
          <p>Discover and join study groups, or create your own.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-group-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Group
        </button>
      </div>

      <div className="notes-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="groups-search-input" type="text" className="form-input notes-search-input" placeholder="Search groups..." value={searchQ} onChange={handleSearch} />
      </div>

      {isLoading && !groups.length ? (
        <div className="groups-grid">{[...Array(6)].map((_,i)=><div key={i} className="skeleton-card" style={{height:180}}/>)}</div>
      ) : displayGroups.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">👥</div>
          <h3>{searchQ ? 'No groups found' : 'No groups yet'}</h3>
          <p>Be the first to create a study group!</p>
        </div>
      ) : (
        <div className="groups-grid">
          {displayGroups.map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="group-card glass-card" id={`group-${g.id}`}>
              <div className="group-card-header">
                <div className="group-avatar">{g.name?.charAt(0).toUpperCase()}</div>
                <span className={`badge ${g.isPrivate ? 'badge-warning' : 'badge-success'}`}>{g.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
              </div>
              <div className="group-card-body">
                <h3 className="group-name">{g.name}</h3>
                <p className="group-desc">{g.description || 'No description provided.'}</p>
              </div>
              <div className="group-card-footer">
                <span className="btn btn-secondary btn-sm" style={{pointerEvents:'none'}}>View Group →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Study Group">
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:16}}>
          {formErrors.api && <div className="auth-error">{formErrors.api}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="group-name">Group Name</label>
            <input id="group-name" type="text" className="form-input" placeholder="e.g. Calculus Study Crew" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="group-desc">Description</label>
            <textarea id="group-desc" className="form-textarea" placeholder="What will this group study?" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{minHeight:80}} />
          </div>
          <label className="groups-toggle">
            <input type="checkbox" checked={form.isPrivate} onChange={e=>setForm(p=>({...p,isPrivate:e.target.checked}))} id="group-private-toggle" />
            <span>🔒 Private group (members must request to join)</span>
          </label>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="create-group-submit">
              {saving ? <><div className="spinner spinner-sm"/>Creating...</> : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
