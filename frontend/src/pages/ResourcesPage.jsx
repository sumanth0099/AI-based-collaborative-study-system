// src/pages/ResourcesPage.jsx

import { useState, useEffect, useRef } from 'react';
import useResourcesStore from '../stores/resourcesStore.js';
import useFriendsStore from '../stores/friendsStore.js';
import Modal from '../components/Modal.jsx';
import './ResourcesPage.css';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function ResourcesPage() {
  const {
    resources,
    isLoading,
    isUploading,
    uploadResource,
    fetchResources,
    deleteResource,
    shareResource,
  } = useResourcesStore();

  const { friends, fetchFriends } = useFriendsStore();

  const [dragOver, setDragOver] = useState(false);
  const [shareModal, setShareModal] = useState(null);
  const [shareUserId, setShareUserId] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResources();
    fetchFriends();
  }, []);

  const handleFileSelect = async (file) => {
    if (!file) return;

    try {
      await uploadResource(file);
    } finally {
      // Reset input so selecting the same file works again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    await deleteResource(id);
  };

  const handleShare = async () => {
    if (!shareModal || !shareUserId) return;

    try {
      await shareResource(shareModal, shareUserId);

      setShareModal(null);
      setShareUserId('');

      alert('Resource shared successfully!');
    } catch (err) {
      alert(err.message || 'Failed to share resource');
    }
  };

  return (
    <div className="resources-page">
      <div className="page-header">
        <h1>📁 Resources</h1>
        <p>Upload and share study files like PDFs and documents.</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone glass-card ${
          dragOver ? 'upload-zone-active' : ''
        } ${isUploading ? 'upload-zone-uploading' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            fileInputRef.current?.click();
          }
        }}
      >
        {isUploading ? (
          <>
            <div className="spinner" />
            <p>Uploading...</p>
          </>
        ) : (
          <>
            <div className="upload-icon">📤</div>

            <p>
              Drag &amp; drop a file here, or{' '}
              <span
                className="upload-browse"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                browse
              </span>
            </p>

            <input
              ref={fileInputRef}
              id="file-picker"
              type="file"
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <span className="upload-hint">
              Word, PowerPoint, TXT supported
            </span>
          </>
        )}
      </div>

      {/* Resource List */}
      {isLoading && !resources.length ? (
        <div className="res-grid">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton-card"
              style={{ height: 90 }}
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="res-empty">
          <div style={{ fontSize: '3rem' }}>📂</div>
          <h3>No files yet</h3>
          <p>Upload your first file above.</p>
        </div>
      ) : (
        <div className="res-grid">
          {resources.map((r) => (
            <div key={r.id} className="res-card glass-card">
              <div className="res-card-icon">
                {r.mimeType?.includes('pdf')
                  ? '📄'
                  : r.mimeType?.includes('word')
                  ? '📝'
                  : r.mimeType?.includes('ppt')
                  ? '📊'
                  : '📁'}
              </div>

              <div className="res-card-info">
                <div className="res-card-name">
                  {r.originalFileName ||
                    r.cloudinaryUrl?.split('/').pop() ||
                    'File'}
                </div>

                <div className="res-card-meta">
                  {formatSize(r.fileSize)} ·{' '}
                  {r.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                </div>
              </div>

              <div className="res-card-actions">
                {r.cloudinaryUrl && (
                  <a
                    href={r.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn btn-secondary btn-sm"
                  >
                    Download
                  </a>
                )}

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShareModal(r.id)}
                >
                  Share
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(r.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <Modal
        isOpen={!!shareModal}
        onClose={() => {
          setShareModal(null);
          setShareUserId('');
        }}
        title="Share Resource"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <p>Select a friend to share this file with:</p>

          <select
            className="form-select"
            value={shareUserId}
            onChange={(e) => setShareUserId(e.target.value)}
          >
            <option value="">— Choose Friend —</option>

            {friends.map((friend) => (
              <option
                key={friend.id || friend.userId}
                value={friend.id || friend.userId}
              >
                {friend.username || friend.name || friend.email}
              </option>
            ))}
          </select>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShareModal(null);
                setShareUserId('');
              }}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={!shareUserId}
              onClick={handleShare}
            >
              Share
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
