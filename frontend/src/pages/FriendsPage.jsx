// src/pages/FriendsPage.jsx
import { useState, useEffect, useRef } from 'react';
import useFriendsStore from '../stores/friendsStore.js';
import './FriendsPage.css';

const TABS = ['friends', 'requests', 'find'];

export default function FriendsPage() {
  const { friends, friendCount, users, requests, searchResults, isLoading, fetchFriends, fetchAllUsers, fetchRequests, sendFriendRequest, handleFriendRequest, searchUsers, clearSearch } = useFriendsStore();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQ, setSearchQ] = useState('');
  const [actions, setActions] = useState({}); // { id: loading }
  const searchTimer = useRef(null);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'find') fetchAllUsers();
    if (activeTab === 'friends') fetchFriends();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { clearSearch(); return; }
    searchTimer.current = setTimeout(() => searchUsers(q), 400);
  };

  const doSend = async (recipientId) => {
    setActions(p => ({...p,[recipientId]:'sending'}));
    try { await sendFriendRequest(recipientId); setActions(p=>({...p,[recipientId]:'sent'})); }
    catch(e) { setActions(p=>({...p,[recipientId]:'error'})); }
  };

  const doAction = async (requestId, action) => {
    setActions(p=>({...p,[requestId]:action}));
    try { await handleFriendRequest(requestId, action); } catch(e){}
    setActions(p=>({...p,[requestId]:''}));
  };

  const displayUsers = searchQ.trim() ? searchResults : users;

  return (
    <div className="friends-page">
      <div className="page-header">
        <h1>👤 Friends</h1>
        <p>Connect with other students and grow your network.</p>
      </div>

      <div className="friends-tabs">
        {[
          { key: 'friends', label: `My Friends (${friendCount})` },
          { key: 'requests', label: `Requests (${requests.length})` },
          { key: 'find', label: 'Find People' },
        ].map(t => (
          <button key={t.key} className={`group-tab ${activeTab===t.key?'group-tab-active':''}`} onClick={() => setActiveTab(t.key)} id={`friends-tab-${t.key}`}>{t.label}</button>
        ))}
      </div>

      {/* Friends tab */}
      {activeTab === 'friends' && (
        <div className="friends-list glass-card">
          {isLoading ? <div className="spinner" /> : friends.length === 0 ? (
            <div className="friends-empty">
              <div style={{fontSize:'3rem'}}>👤</div>
              <h3>No friends yet</h3>
              <p>Find people to connect with!</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('find')}>Find People</button>
            </div>
          ) : (
            friends.map(f => (
              <div key={f.id||f.userId} className="friend-item">
                <div className="friend-avatar">{(f.username||f.name||'?').charAt(0).toUpperCase()}</div>
                <div className="friend-info">
                  <strong>{f.username || f.name || 'User'}</strong>
                  <span className="friend-email">{f.email}</span>
                </div>
                <span className="badge badge-success">✓ Friend</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div className="friends-list glass-card">
          {requests.length === 0 ? (
            <div className="friends-empty"><div style={{fontSize:'3rem'}}>📬</div><h3>No pending requests</h3></div>
          ) : requests.map((r) => (
            <div key={r.id} className="friend-item">
              <div className="friend-avatar">{(r.sender_name||'?').charAt(0).toUpperCase()}</div>
              <div className="friend-info">
                <strong>{r.sender_name || 'User'}</strong>
                <span className="friend-email">Sent you a friend request</span>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-success btn-sm" onClick={()=>doAction(r.id,'accept')} disabled={actions[r.id]==='accept'} id={`accept-req-${r.id}`}>
                  {actions[r.id]==='accept'?<div className="spinner spinner-sm"/>:'✓ Accept'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={()=>doAction(r.id,'reject')} disabled={actions[r.id]==='reject'} id={`reject-req-${r.id}`}>
                  {actions[r.id]==='reject'?<div className="spinner spinner-sm"/>:'✗ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Find tab */}
      {activeTab === 'find' && (
        <>
          <div className="notes-search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="find-users-input" type="text" className="form-input notes-search-input" placeholder="Search by username..." value={searchQ} onChange={handleSearch} />
          </div>
          <div className="friends-list glass-card">
            {isLoading && !users.length ? <div className="spinner" /> : displayUsers.length === 0 ? (
              <div className="friends-empty"><div style={{fontSize:'3rem'}}>🔍</div><h3>No users found</h3></div>
            ) : displayUsers.map(u => {
              const uid = u.id||u.userId;
              const sent = actions[uid]==='sent';
              return (
                <div key={uid} className="friend-item">
                  <div className="friend-avatar">{(u.username||u.name||'?').charAt(0).toUpperCase()}</div>
                  <div className="friend-info">
                    <strong>{u.username||u.name||'User'}</strong>
                    <span className="friend-email">{u.email}</span>
                  </div>
                  <button
                    className={`btn btn-sm ${sent?'btn-secondary':'btn-primary'}`}
                    onClick={()=>doSend(uid)}
                    disabled={sent||actions[uid]==='sending'}
                    id={`add-friend-${uid}`}
                  >
                    {actions[uid]==='sending'?<div className="spinner spinner-sm"/>:sent?'Sent ✓':'Add Friend'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
