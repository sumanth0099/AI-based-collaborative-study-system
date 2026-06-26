// src/pages/NotesPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import useNotesStore from '../stores/notesStore.js';
import useAIStore from '../stores/aiStore.js';
import Modal from '../components/Modal.jsx';
import './NotesPage.css';

const noteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  content: z.string().min(1).max(700 * 6, 'Max 700 words'),
  topicImportance: z.enum(['high', 'medium', 'low']),
});

const IMPORTANCE_COLORS = { high: 'badge-error', medium: 'badge-warning', low: 'badge-success' };

export default function NotesPage() {
  const { notes, isLoading, error, fetchNotes, createNote, deleteNote, searchNotes, searchResults } = useNotesStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', topic: '', content: '', topicImportance: 'medium' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => { searchNotes(q); }, 400);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = noteSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setFormErrors(Object.fromEntries(Object.entries(flat).map(([k,v])=>[k,v?.[0]])));
      return;
    }
    setSaving(true);
    try {
      await createNote({ ...form, contentType: 'text' });
      setShowModal(false);
      setForm({ name: '', subject: '', topic: '', content: '', topicImportance: 'medium' });
    } catch (err) {
      setFormErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    await deleteNote(id);
  };

  const displayNotes = searching ? searchResults : notes;
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="notes-page">
      <div className="notes-header">
        <div className="page-header">
          <h1>📝 Notes</h1>
          <p>Create, search, and manage all your study notes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-note-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Note
        </button>
      </div>

      <div className="notes-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          id="notes-search-input"
          type="text"
          className="form-input notes-search-input"
          placeholder="Search notes by name or topic..."
          value={searchQ}
          onChange={handleSearch}
        />
      </div>

      {isLoading && !notes.length && (
        <div className="notes-grid">
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton-card" style={{height:160}} />)}
        </div>
      )}

      {displayNotes.length === 0 && !isLoading && (
        <div className="notes-empty">
          <div className="notes-empty-icon">📝</div>
          <h3>{searching ? 'No notes found' : 'No notes yet'}</h3>
          <p>{searching ? 'Try a different search term.' : 'Create your first note to get started.'}</p>
          {!searching && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Note</button>}
        </div>
      )}

      <div className="notes-grid">
        {displayNotes.map((note) => (
          <div key={note.id} className="note-card glass-card">
            <div className="note-card-header">
              <span className={`badge ${IMPORTANCE_COLORS[note.topicImportance] || 'badge-secondary'}`}>
                {note.topicImportance || 'note'}
              </span>
              <button
                className="btn btn-ghost btn-icon btn-sm note-delete-btn"
                onClick={() => handleDelete(note.id)}
                aria-label="Delete note"
                id={`delete-note-${note.id}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            </div>
            <Link to={`/notes/${note.id}`} className="note-card-body" id={`view-note-${note.id}`}>
              <h3 className="note-title">{note.name}</h3>
              <div className="note-meta">
                <span>{note.subject}</span>
                {note.topic && <><span>·</span><span>{note.topic}</span></>}
              </div>
              <p className="note-preview">{note.content?.slice(0, 120)}...</p>
            </Link>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Note">
        <form onSubmit={handleCreate} className="note-form">
          {formErrors.api && <div className="auth-error">{formErrors.api}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="note-name">Note Name</label>
            <input id="note-name" type="text" className="form-input" placeholder="e.g. Algebra Basics" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>
          <div className="flex gap-md">
            <div className="form-group" style={{flex:1}}>
              <label className="form-label" htmlFor="note-subject">Subject</label>
              <input id="note-subject" type="text" className="form-input" placeholder="e.g. Math" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} />
              {formErrors.subject && <span className="form-error">{formErrors.subject}</span>}
            </div>
            <div className="form-group" style={{flex:1}}>
              <label className="form-label" htmlFor="note-topic">Topic</label>
              <input id="note-topic" type="text" className="form-input" placeholder="e.g. Algebra" value={form.topic} onChange={e=>setForm(p=>({...p,topic:e.target.value}))} />
              {formErrors.topic && <span className="form-error">{formErrors.topic}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="note-importance">Importance</label>
            <select id="note-importance" className="form-select" value={form.topicImportance} onChange={e=>setForm(p=>({...p,topicImportance:e.target.value}))}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="form-group">
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <label className="form-label" htmlFor="note-content">Content (text only)</label>
              <span className="form-hint">{wordCount}/700 words</span>
            </div>
            <textarea id="note-content" className="form-textarea" placeholder="Write your notes here..." value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} style={{minHeight:180}} />
            {formErrors.content && <span className="form-error">{formErrors.content}</span>}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-note-btn">
              {saving ? <><div className="spinner spinner-sm"/>Saving...</> : 'Save Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
