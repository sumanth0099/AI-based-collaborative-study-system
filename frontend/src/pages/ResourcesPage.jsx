// src/pages/ResourcesPage.jsx
import { useState, useEffect } from 'react';
import useResourcesStore from '../stores/resourcesStore.js';
import useFriendsStore from '../stores/friendsStore.js';
import Modal from '../components/Modal.jsx';
import './ResourcesPage.css';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)}KB`;
  return `${(bytes/1024/1024).toFixed(1)}MB`;
}

export default function ResourcesPage() {
  const { resources, isLoading, isUploading, uploadResource, fetchResources, deleteResource, shareResource } = useResourcesStore();
  const { friends, fetchFriends } = useFriendsStore();
  const [shareModal, setShareModal] = useState(null); // resourceId
  const [shareUserId, setShareUserId] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { fetchResources(); fetchFriends(); }, []);

  const handleFileSelect = async (file) => {
    if (!file) return;
    await uploadResource(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    await deleteResource(id);
  };

  const handleShare = async () => {
    if (!shareUserId) return;
    await shareResource(shareModal, shareUserId);
    setShareModal(null);
    setShareUserId('');
  };

  return (
    <div className="resources-page">
      <div className="page-header">
        <h1>📁 Resources</h1>
        <p>Upload and share study files like PDFs and documents.</p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone glass-card ${dragOver ? 'upload-zone-active' : ''} ${isUploading ? 'upload-zone-uploading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        id="upload-drop-zone"
      >
        {isUploading ? (
          <><div className="spinner" /><p>Uploading...</p></>
        ) : (
          <>
            <div className="upload-icon">📤</div>
            <p>Drag & drop a file here, or <label htmlFor="file-picker" className="upload-browse">browse</label></p>
            <input id="file-picker" type="file" style={{display:'none'}} onChange={e=>handleFileSelect(e.target.files?.[0])} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
            <span className="upload-hint">PDF, Word, PowerPoint, TXT supported</span>
          </>
        )}
      </div>

      {/* Files list */}
      {isLoading && !resources.length ? (
        <div className="res-grid">{[...Array(4)].map((_,i)=><div key={i} className="skeleton-card" style={{height:90}}/>)}</div>
      ) : resources.length === 0 ? (
        <div className="res-empty">
          <div style={{fontSize:'3rem'}}>📂</div>
          <h3>No files yet</h3>
          <p>Upload your first file above.</p>
        </div>
      ) : (
        <div className="res-grid">
          {resources.map((r) => (
            <div key={r.id} className="res-card glass-card">
              <div className="res-card-icon">
                {r.mimeType?.includes('pdf') ? '📄' : r.mimeType?.includes('word') ? '📝' : r.mimeType?.includes('ppt') ? '📊' : '📁'}
              </div>
              <div className="res-card-info">
                <div className="res-card-name">{r.originalFileName || r.cloudinaryUrl?.split('/').pop() || 'File'}</div>
                <div className="res-card-meta">{formatSize(r.fileSize)} · {r.mimeType?.split('/')?.[1]?.toUpperCase() || 'FILE'}</div>
              </div>
              <div className="res-card-actions">
                {r.cloudinaryUrl && (
                  <a href={r.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" id={`view-res-${r.id}`}>View</a>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setShareModal(r.id)} id={`share-res-${r.id}`}>Share</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} id={`del-res-${r.id}`}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <Modal isOpen={!!shareModal} onClose={() => setShareModal(null)} title="Share Resource">
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <p>Select a friend to share this file with:</p>
          <select className="form-select" value={shareUserId} onChange={e=>setShareUserId(e.target.value)} id="share-friend-select">
            <option value="">— Choose friend —</option>
            {friends.map(f => (
              <option key={f.id || f.userId} value={f.id || f.userId}>{f.username || f.name || f.email}</option>
            ))}
          </select>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn btn-secondary" onClick={() => setShareModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleShare} disabled={!shareUserId} id="confirm-share-btn">Share</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
