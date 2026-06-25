// src/pages/NoteDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useNotesStore from '../stores/notesStore.js';
import useAIStore from '../stores/aiStore.js';
import './NoteDetailPage.css';

export default function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentNote, isLoading, fetchNoteById, updateNote, deleteNote, clearCurrentNote } = useNotesStore();
  const { generateSummary, summary, isGeneratingSummary, generateFlashcards, flashcards, isGeneratingFlashcards, sendChatMessage, chatHistory, isChatLoading, clearChat, clearSummary } = useAIStore();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('view'); // view | summary | flashcards | chat
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchNoteById(id);
    return () => {
      clearCurrentNote();
      clearSummary();
      clearChat();
    };
  }, [id]);

  useEffect(() => {
    if (currentNote) setEditForm({ name: currentNote.name, subject: currentNote.subject, topic: currentNote.topic, content: currentNote.content, topicImportance: currentNote.topicImportance });
  }, [currentNote]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateNote(id, editForm); setEditing(false); } catch(e) {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Archive this note?')) return;
    await deleteNote(id);
    navigate('/notes');
  };

  const handleGenSummary = () => generateSummary(id, currentNote?.topic);
  const handleGenFlashcards = () => generateFlashcards(id, currentNote?.topic);
  const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(id, currentNote?.topic, chatInput);
    setChatInput('');
  };

  if (isLoading) return <div className="note-detail-page"><div className="spinner" /></div>;
  if (!currentNote) return <div className="note-detail-page"><p>Note not found.</p><Link to="/notes" className="btn btn-secondary">Back</Link></div>;

  const IMPORTANCE_COLORS = { high: 'badge-error', medium: 'badge-warning', low: 'badge-success' };

  return (
    <div className="note-detail-page">
      {/* Breadcrumb */}
      <div className="note-detail-breadcrumb">
        <Link to="/notes" className="btn btn-ghost btn-sm">← Notes</Link>
        <span>/</span>
        <span>{currentNote.name}</span>
      </div>

      <div className="note-detail-layout">
        {/* Main content */}
        <div className="note-detail-main glass-card">
          <div className="note-detail-top">
            <div className="note-detail-meta">
              <span className={`badge ${IMPORTANCE_COLORS[currentNote.topicImportance]}`}>{currentNote.topicImportance}</span>
              <span className="note-detail-subject">{currentNote.subject} · {currentNote.topic}</span>
            </div>
            <div className="note-detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)} id="edit-note-btn">
                {editing ? 'Cancel' : '✏️ Edit'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} id="delete-note-detail-btn">🗑️ Delete</button>
            </div>
          </div>

          {editing ? (
            <div className="note-edit-form">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={editForm.name||''} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="flex gap-md">
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={editForm.subject||''} onChange={e=>setEditForm(p=>({...p,subject:e.target.value}))} />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Topic</label>
                  <input className="form-input" value={editForm.topic||''} onChange={e=>setEditForm(p=>({...p,topic:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Importance</label>
                <select className="form-select" value={editForm.topicImportance||'medium'} onChange={e=>setEditForm(p=>({...p,topicImportance:e.target.value}))}>
                  <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-textarea" style={{minHeight:200}} value={editForm.content||''} onChange={e=>setEditForm(p=>({...p,content:e.target.value}))} />
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-note-edit-btn">
                {saving ? <><div className="spinner spinner-sm"/>Saving...</> : 'Save Changes'}
              </button>
            </div>
          ) : (
            <>
              <h1 className="note-detail-title">{currentNote.name}</h1>
              <div className="note-detail-content">{currentNote.content}</div>
            </>
          )}
        </div>

        {/* AI Tools sidebar */}
        <div className="note-detail-sidebar">
          <div className="glass-card note-ai-card">
            <h3>🤖 AI Tools</h3>
            <div className="note-ai-tabs">
              {['summary', 'flashcards', 'chat'].map(tab => (
                <button key={tab} className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(tab)} id={`ai-tab-${tab}`}>
                  {tab === 'summary' ? '📄' : tab === 'flashcards' ? '🃏' : '💬'} {tab.charAt(0).toUpperCase()+tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'summary' && (
              <div className="note-ai-panel">
                <button className="btn btn-primary w-full" onClick={handleGenSummary} disabled={isGeneratingSummary} id="gen-summary-btn">
                  {isGeneratingSummary ? <><div className="spinner spinner-sm"/>Generating...</> : '✨ Generate Summary'}
                </button>
                {summary && <div className="note-ai-result">{typeof summary === 'string' ? summary : JSON.stringify(summary)}</div>}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="note-ai-panel">
                <button className="btn btn-primary w-full" onClick={handleGenFlashcards} disabled={isGeneratingFlashcards} id="gen-flashcards-btn">
                  {isGeneratingFlashcards ? <><div className="spinner spinner-sm"/>Generating...</> : '🃏 Generate Flashcards'}
                </button>
                {flashcards.length > 0 && (
                  <div className="flashcard-grid">
                    {flashcards.map((fc, i) => (
                      <div key={fc.id || i} className="flashcard">
                        <div className="flashcard-inner">
                          <div className="flashcard-front">{fc.front}</div>
                          <div className="flashcard-back">{fc.back}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="note-ai-panel">
                <div className="note-chat-history">
                  {chatHistory.length === 0 && <p className="note-chat-empty">Ask the AI anything about this note!</p>}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`note-chat-msg ${msg.role}`}>
                      <span className="note-chat-role">{msg.role === 'user' ? '👤' : '🤖'}</span>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                  {isChatLoading && <div className="note-chat-msg ai"><span className="note-chat-role">🤖</span><div className="spinner spinner-sm"/></div>}
                </div>
                <form onSubmit={handleChat} className="note-chat-form">
                  <input id="note-chat-input" className="form-input" placeholder="Ask a question..." value={chatInput} onChange={e=>setChatInput(e.target.value)} disabled={isChatLoading} />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={!chatInput.trim()||isChatLoading} id="note-chat-send">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
