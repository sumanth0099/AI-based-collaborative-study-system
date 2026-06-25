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
    currentGroup, members, joinRequests, isLoading, error,
    fetchGroupById, fetchMembers, fetchJoinRequests,
    joinGroup, leaveGroup, sendJoinRequest,
    promoteMember, demoteMember, removeMember,
    approveRequest, rejectRequest,
    updateGroup, deleteGroup,
    clearCurrentGroup,
  } = useGroupsStore();

  const [activeTab, setActiveTab] = useState('chat'); // chat | members | requests | settings
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchGroupById(id);
    fetchMembers(id);
    return () => clearCurrentGroup();
  }, [id]);

  useEffect(() => {
    if (currentGroup) {
      setEditForm({ name: currentGroup.name, description: currentGroup.description, isPrivate: currentGroup.isPrivate });
    }
  }, [currentGroup]);

  const myMembership = members.find(m => m.userId === user?.userId || m.userId === user?.id || m.id === user?.userId || m.id === user?.id);
  const isMember = !!myMembership;
  const isOwnerOrAdmin = myMembership?.role === 'owner' || myMembership?.role === 'admin';
  const isOwner = myMembership?.role === 'owner';

  const loadRequests = () => { fetchJoinRequests(id); setActiveTab('requests'); };

  const doAction = async (fn, label) => {
    setActionLoading(label);
    try { await fn(); } catch(e) {} finally { setActionLoading(''); }
  };

  const handleJoin = () => doAction(() => currentGroup?.isPrivate ? sendJoinRequest(id) : joinGroup(id), 'join');
  const handleLeave = () => doAction(async () => { await leaveGroup(id); navigate('/groups'); }, 'leave');
  const handleDelete = async () => {
    if (!confirm('Delete this group?')) return;
    await deleteGroup(id);
    navigate('/groups');
  };
  const handleSaveEdit = async () => {
    setSaving(true);
    try { await updateGroup(id, editForm); setEditModal(false); } catch(e){} finally { setSaving(false); }
  };

  if (isLoading) return <div className="group-detail-page"><div className="spinner" /></div>;
  if (!currentGroup) return <div className="group-detail-page"><p>Group not found.</p><Link to="/groups" className="btn btn-secondary">← Groups</Link></div>;

  const TABS = [
    { key: 'chat', label: '💬 Chat' },
    { key: 'members', label: `👥 Members (${members.length})` },
    ...(isOwnerOrAdmin ? [{ key: 'requests', label: '📩 Requests' }] : []),
    ...(isOwner ? [{ key: 'settings', label: '⚙️ Settings' }] : []),
  ];

  return (
    <div className="group-detail-page">
      <div className="group-detail-breadcrumb">
        <Link to="/groups" className="btn btn-ghost btn-sm">← Groups</Link>
        <span>/</span>
        <span>{currentGroup.name}</span>
      </div>

      {/* Group hero */}
      <div className="group-detail-hero glass-card">
        <div className="group-detail-hero-left">
          <div className="group-avatar-lg">{currentGroup.name?.charAt(0)?.toUpperCase()}</div>
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
            <button className="btn btn-primary" onClick={handleJoin} disabled={actionLoading==='join'} id="join-group-btn">
              {actionLoading==='join' ? <div className="spinner spinner-sm"/> : currentGroup.isPrivate ? '📩 Request to Join' : '➕ Join Group'}
            </button>
          )}
          {isMember && (
            <button className="btn btn-danger btn-sm" onClick={handleLeave} disabled={actionLoading==='leave'} id="leave-group-btn">
              {actionLoading==='leave' ? <div className="spinner spinner-sm"/> : '🚪 Leave'}
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

      {/* Tabs */}
      <div className="group-detail-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`group-tab ${activeTab === t.key ? 'group-tab-active' : ''}`} onClick={() => { setActiveTab(t.key); if (t.key==='requests') fetchJoinRequests(id); if (t.key==='members') fetchMembers(id); }} id={`tab-${t.key}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="group-detail-content">
        {activeTab === 'chat' && <ChatBox groupId={id} groupName={currentGroup.name} />}

        {activeTab === 'members' && (
          <div className="glass-card" style={{padding:'var(--space-lg)'}}>
            <h3 style={{marginBottom:'var(--space-lg)'}}>Group Members</h3>
            <div className="members-list">
              {members.map((m) => {
                const memberId = m.userId || m.id;
                const isMe = memberId === user?.userId || memberId === user?.id;
                return (
                  <div key={memberId} className="member-item">
                    <div className="member-avatar">{(m.username||m.name||'?').charAt(0).toUpperCase()}</div>
                    <div className="member-info">
                      <strong>{m.username || m.name || 'User'}</strong>
                      <span className={`badge badge-${m.role==='owner'?'primary':m.role==='admin'?'info':'secondary'}`}>{m.role}</span>
                      {isMe && <span className="badge badge-secondary">You</span>}
                    </div>
                    {isOwnerOrAdmin && !isMe && (
                      <div className="member-actions">
                        {isOwner && m.role === 'member' && <button className="btn btn-ghost btn-sm" onClick={() => doAction(()=>promoteMember(id,memberId),'promote'+memberId)} id={`promote-${memberId}`}>↑ Admin</button>}
                        {isOwner && m.role === 'admin' && <button className="btn btn-ghost btn-sm" onClick={() => doAction(()=>demoteMember(id,memberId),'demote'+memberId)} id={`demote-${memberId}`}>↓ Member</button>}
                        <button className="btn btn-danger btn-sm" onClick={() => doAction(()=>removeMember(id,memberId),'remove'+memberId)} id={`remove-${memberId}`}>Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="glass-card" style={{padding:'var(--space-lg)'}}>
            <h3 style={{marginBottom:'var(--space-lg)'}}>Join Requests</h3>
            {joinRequests.length === 0 ? <p style={{color:'var(--text-muted)'}}>No pending requests.</p> : (
              <div className="members-list">
                {joinRequests.map(r => (
                  <div key={r.id||r.userId} className="member-item">
                    <div className="member-avatar">{(r.username||'?').charAt(0).toUpperCase()}</div>
                    <div className="member-info"><strong>{r.username || 'User'}</strong><span className="badge badge-warning">pending</span></div>
                    <div className="member-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>doAction(()=>approveRequest(id,r.userId||r.id),'approve')} id={`approve-${r.userId||r.id}`}>✓ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>doAction(()=>rejectRequest(id,r.userId||r.id),'reject')} id={`reject-${r.userId||r.id}`}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && isOwner && (
          <div className="glass-card" style={{padding:'var(--space-lg)',display:'flex',flexDirection:'column',gap:16}}>
            <h3>Group Settings</h3>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={editForm.name||''} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={editForm.description||''} onChange={e=>setEditForm(p=>({...p,description:e.target.value}))} /></div>
            <label className="groups-toggle"><input type="checkbox" checked={!!editForm.isPrivate} onChange={e=>setEditForm(p=>({...p,isPrivate:e.target.checked}))} id="settings-private-toggle"/><span>🔒 Private group</span></label>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving} id="save-group-settings">{saving?<><div className="spinner spinner-sm"/>Saving...</>:'Save Changes'}</button>
              <button className="btn btn-danger" onClick={handleDelete} id="settings-delete-group">Delete Group</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
