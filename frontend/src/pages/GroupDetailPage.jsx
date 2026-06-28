// src/pages/GroupDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useGroupsStore from '../stores/groupsStore.js';
import useAuthStore from '../stores/authStore.js';
import ChatBox from '../components/ChatBox.jsx';
import Modal from '../components/Modal.jsx';
import './GroupDetailPage.css';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    currentGroup,
    members,
    joinRequests,
    isLoading,
    fetchGroupById,
    fetchMembers,
    fetchJoinRequests,
    joinGroup,
    leaveGroup,
    sendJoinRequest,
    promoteMember,
    demoteMember,
    removeMember,
    approveRequest,
    rejectRequest,
    updateGroup,
    deleteGroup,
    clearCurrentGroup,
  } = useGroupsStore();

  const [activeTab, setActiveTab] = useState('chat');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // 1. Fetch core data strictly when ID changes (No cleanup here to avoid structural remount cycles)
  useEffect(() => {
    if (id) {
      fetchGroupById(id);
      fetchMembers(id);
    }
  }, [id]);

  // 2. Conditional request fetching based explicitly on the loaded user status role
  useEffect(() => {
    if (id && currentGroup?.userStatus) {
      const role = currentGroup.userStatus.role;
      if (role === 'owner' || role === 'admin') {
        fetchJoinRequests(id);
      }
    }
  }, [id, currentGroup?.userStatus?.role]);

  // 3. Keep local edit form state synchronized with fresh store updates
  useEffect(() => {
    if (currentGroup) {
      setEditForm({
        name: currentGroup.name || '',
        description: currentGroup.description || '',
        isPrivate: !!currentGroup.isPrivate,
      });
    }
  }, [currentGroup]);

  // 4. Clean up state only when navigating away from the page completely
  useEffect(() => {
    return () => {
      clearCurrentGroup();
    };
  }, [clearCurrentGroup]);

  const userStatus = currentGroup?.userStatus || {
    isMember: false,
    role: null,
    hasPendingRequest: false,
  };

  const isMember = userStatus.isMember;
  const isOwner = userStatus.role === 'owner';
  const isOwnerOrAdmin = userStatus.role === 'owner' || userStatus.role === 'admin';
  const hasPendingRequest = userStatus.hasPendingRequest;

  const doAction = async (fn, label) => {
    setActionLoading(label);
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading('');
    }
  };

  const handleJoin = () =>
    doAction(async () => {
      if (currentGroup?.isPrivate) {
        await sendJoinRequest(id);
      } else {
        await joinGroup(id);
        fetchMembers(id);
      }
      fetchGroupById(id);
    }, 'join');

  const handleLeave = () =>
    doAction(async () => {
      await leaveGroup(id);
      navigate('/groups');
    }, 'leave');

  const handleDelete = async () => {
    if (!confirm('Delete this group?')) return;
    await deleteGroup(id);
    navigate('/groups');
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateGroup(id, editForm);
      setEditModal(false);
      fetchGroupById(id);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'requests') {
      fetchJoinRequests(id);
    }
    if (tabKey === 'members') {
      fetchMembers(id);
    }
  };

  if (isLoading) {
    return (
      <div className="group-detail-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="group-detail-page">
        <p>Group not found.</p>
        <Link to="/groups" className="btn btn-secondary">← Groups</Link>
      </div>
    );
  }

  const TABS = [
    { key: 'chat', label: '💬 Chat' },
    { key: 'members', label: `👥 Members (${members?.length || 0})` },
    ...(isOwnerOrAdmin ? [{ key: 'requests', label: `📩 Requests (${joinRequests?.length || 0})` }] : []),
    ...(isOwner ? [{ key: 'settings', label: '⚙️ Settings' }] : []),
  ];

  return (
    <div className="group-detail-page">

      {/* Breadcrumb */}
      <div className="group-detail-breadcrumb">
        <Link to="/groups" className="btn btn-ghost btn-sm">← Groups</Link>
        <span>/</span>
        <span>{currentGroup.name}</span>
      </div>

      {/* HERO */}
      <div className="group-detail-hero glass-card">
        <div className="group-detail-hero-left">
          <div className="group-avatar-lg">
            {currentGroup.name?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <h1 className="group-detail-name">{currentGroup.name}</h1>
            <p className="group-detail-desc">{currentGroup.description}</p>
            <span className={`badge ${currentGroup.isPrivate ? 'badge-warning' : 'badge-success'}`}>
              {currentGroup.isPrivate ? '🔒 Private' : '🌐 Public'}
            </span>
          </div>
        </div>

        <div className="group-detail-hero-actions">
          {!isMember && (
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={actionLoading === 'join' || hasPendingRequest}
              id="join-group-btn"
            >
              {actionLoading === 'join' ? (
                <div className="spinner spinner-sm" />
              ) : hasPendingRequest ? (
                '⏳ Request Pending'
              ) : currentGroup.isPrivate ? (
                '📩 Request to Join'
              ) : (
                '➕ Join Group'
              )}
            </button>
          )}

          {isMember && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleLeave}
              disabled={actionLoading === 'leave'}
              id="leave-group-btn"
            >
              {actionLoading === 'leave' ? <div className="spinner spinner-sm" /> : '🚪 Leave'}
            </button>
          )}

          {isOwner && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditModal(true)} id="edit-group-btn">✏️ Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} id="delete-group-btn">🗑️ Delete</button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="group-detail-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`group-tab ${activeTab === t.key ? 'group-tab-active' : ''}`}
            onClick={() => handleTabChange(t.key)}
            id={`tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="group-detail-content">

        {/* CHAT */}
        {activeTab === 'chat' && (
          isMember ? (
            <ChatBox groupId={id} groupName={currentGroup.name} />
          ) : (
            <div className="glass-card" style={{ padding: 'var(--space-lg)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <h3>💬 Chat</h3>
              <p style={{ color: 'var(--text-muted)' }}>You’re not part of this group.</p>
              <p>Join the group to start chatting.</p>

              <button
                className="btn btn-primary"
                onClick={handleJoin}
                disabled={actionLoading === 'join' || hasPendingRequest}
              >
                {actionLoading === 'join' ? (
                  <div className="spinner spinner-sm" />
                ) : hasPendingRequest ? (
                  '⏳ Request Pending'
                ) : currentGroup.isPrivate ? (
                  '📩 Request to Join'
                ) : (
                  '➕ Join Group'
                )}
              </button>
            </div>
          )
        )}

        {/* MEMBERS */}
        {activeTab === 'members' && (
          <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Group Members</h3>
            <div className="members-list">
              {members?.map(m => {
                const memberId = m.userId || m.id;
                const isMe = memberId === user?.userId || memberId === user?.id;

                return (
                  <div key={memberId} className="member-item">
                    <div className="member-avatar">
                      {(m.username || m.name || '?').charAt(0).toUpperCase()}
                    </div>

                    <div className="member-info">
                      <strong>{m.username || m.name || 'User'}</strong>
                      <span className={`badge badge-${m.role === 'owner' ? 'primary' : m.role === 'admin' ? 'info' : 'secondary'}`}>
                        {m.role}
                      </span>
                      {isMe && <span className="badge badge-secondary">You</span>}
                    </div>

                    {isOwnerOrAdmin && !isMe && (
                      <div className="member-actions">
                        {isOwner && m.role === 'member' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => doAction(async () => { await promoteMember(id, memberId); fetchMembers(id); }, 'promote' + memberId)} disabled={actionLoading === 'promote' + memberId}>
                            ↑ Admin
                          </button>
                        )}
                        {isOwner && m.role === 'admin' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => doAction(async () => { await demoteMember(id, memberId); fetchMembers(id); }, 'demote' + memberId)} disabled={actionLoading === 'demote' + memberId}>
                            ↓ Member
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => doAction(async () => { await removeMember(id, memberId); fetchMembers(id); }, 'remove' + memberId)} disabled={actionLoading === 'remove' + memberId}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Join Requests</h3>
            {!joinRequests || joinRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No pending requests.</p>
            ) : (
              <div className="members-list">
                {joinRequests.map(r => {
                  const requestId = r.userId || r.id;
                  return (
                    <div key={requestId} className="member-item">
                      <div className="member-avatar">{(r.username || '?').charAt(0).toUpperCase()}</div>
                      <div className="member-info">
                        <strong>{r.username || 'User'}</strong>
                        <span className="badge badge-warning">pending</span>
                      </div>
                      <div className="member-actions">
                        <button 
                          className="btn btn-success btn-sm" 
                          onClick={() => doAction(async () => { await approveRequest(id, requestId); fetchJoinRequests(id); fetchMembers(id); }, 'approve' + requestId)}
                          disabled={actionLoading === 'approve' + requestId}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => doAction(async () => { await rejectRequest(id, requestId); fetchJoinRequests(id); }, 'reject' + requestId)}
                          disabled={actionLoading === 'reject' + requestId}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS CONTENT TAB */}
        {activeTab === 'settings' && isOwner && (
          <div className="glass-card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3>Group Settings</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <label className="groups-toggle">
              <input type="checkbox" checked={!!editForm.isPrivate} onChange={e => setEditForm(p => ({ ...p, isPrivate: e.target.checked }))} id="settings-private-toggle" />
              <span>🔒 Private group</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving} id="save-group-settings">
                {saving ? <><div className="spinner spinner-sm" />Saving...</> : 'Save Changes'}
              </button>
              <button className="btn btn-danger" onClick={handleDelete} id="settings-delete-group">Delete Group</button>
            </div>
          </div>
        )}

      </div>

      {/* EDIT MODAL FALLBACK */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <label className="groups-toggle">
            <input type="checkbox" checked={!!editForm.isPrivate} onChange={e => setEditForm(p => ({ ...p, isPrivate: e.target.checked }))} />
            <span>🔒 Private group</span>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button className="btn btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}