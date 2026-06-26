// src/pages/PrivateChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useChatStore from '../stores/chatStore.js';
import useAuthStore from '../stores/authStore.js';
import useFriendsStore from '../stores/friendsStore.js';
import useUIStore from '../stores/uiStore.js';
import { socket } from '../socket/socket.js';
import './PrivateChatPage.css';

export default function PrivateChatPage() {
  const { userId } = useParams();
  const { privateMessages, sendPrivateMessage, receivePrivateMessage, confirmPrivateMessage } = useChatStore();
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendsStore();
  const { showToast } = useUIStore();
  
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Find friend details
  const friend = friends.find((f) => String(f.id || f.userId) === String(userId));
  const friendName = friend?.username || friend?.name || 'User';

  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends();
    }
  }, [friends, fetchFriends]);

  // Handle socket events locally for real-time sync
  useEffect(() => {
    const onReceive = (msg) => {
      // Check if message belongs to this conversation
      if (String(msg.senderId) === String(userId)) {
        receivePrivateMessage(msg);
      }
    };

    const onSent = (msg) => {
      if (String(msg.receiverId) === String(userId)) {
        confirmPrivateMessage(msg);
        setSending(false);
      }
    };

    const onError = (err) => {
      showToast(err.message || 'Failed to send message', 'error');
      setSending(false);
    };

    socket.on('receive_private_message', onReceive);
    socket.on('private_message_sent', onSent);
    socket.on('message_error', onError);

    return () => {
      socket.off('receive_private_message', onReceive);
      socket.off('private_message_sent', onSent);
      socket.off('message_error', onError);
    };
  }, [userId, receivePrivateMessage, confirmPrivateMessage, showToast]);

  // Filter messages for this conversation
  const myId = user?.userId || user?.id;
  const conversationMessages = privateMessages.filter((msg) => {
    const isIncoming = String(msg.senderId) === String(userId) && String(msg.receiverId) === String(myId);
    const isOutgoing = String(msg.senderId) === String(myId) && String(msg.receiverId) === String(userId);
    return isIncoming || isOutgoing;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    sendPrivateMessage(userId, text);
    setInput('');
  };

  const getInitials = (name) => {
    return (name || '?').charAt(0).toUpperCase();
  };

  return (
    <div className="private-chat-page animate-fade-in">
      <div className="page-header private-chat-header-actions">
        <Link to="/friends" className="btn btn-secondary btn-sm">
          ← Back to Friends
        </Link>
      </div>

      <div className="private-chat-wrapper glass-card">
        <div className="private-chat-header">
          <div className="friend-avatar">{getInitials(friendName)}</div>
          <div className="friend-status-info">
            <h3>{friendName}</h3>
            <span className="friend-status-subtitle">{friend?.email || 'Direct Messages'}</span>
          </div>
        </div>

        <div className="private-chat-messages">
          {conversationMessages.length === 0 ? (
            <div className="chatbox-empty">
              <span style={{ fontSize: '3rem' }}>💬</span>
              <p>No messages yet. Send a message to start the conversation!</p>
            </div>
          ) : (
            conversationMessages.map((msg, i) => {
              const isOwn = String(msg.senderId) === String(myId);
              return (
                <div key={msg.id || i} className={`chat-msg ${isOwn ? 'me' : ''}`}>
                  {!isOwn && (
                    <div className="chat-msg-avatar">{getInitials(friendName)}</div>
                  )}
                  <div className="chat-msg-bubble">
                    <div className="chat-msg-header">
                      <span className="chat-msg-author">{isOwn ? 'You' : friendName}</span>
                      <time className="chat-msg-time">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </time>
                    </div>
                    <p className="chat-msg-content">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="private-chat-input-area chat-form" onSubmit={handleSend}>
          <input
            id="private-chat-input"
            className="form-input chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${friendName}...`}
            disabled={sending}
            autoComplete="off"
            maxLength={1000}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            id="private-chat-send"
          >
            {sending ? <div className="spinner spinner-sm" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
