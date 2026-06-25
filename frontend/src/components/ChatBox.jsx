// src/components/ChatBox.jsx
import { useState, useEffect, useRef } from 'react';
import useChatStore from '../stores/chatStore.js';
import useAuthStore from '../stores/authStore.js';
import { socket } from '../socket/socket.js';
import './ChatBox.css';

export default function ChatBox({ groupId, groupName }) {
  const { groupMessages, fetchGroupMessages, sendGroupMessage, confirmGroupMessage, receiveGroupMessage } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = groupMessages[groupId] || [];

  useEffect(() => {
    fetchGroupMessages(groupId);
  }, [groupId, fetchGroupMessages]);

  useEffect(() => {
    // Listen for messages from others
    const onReceive = (msg) => {
      if (msg.groupId === groupId || msg.groupid === groupId) {
        receiveGroupMessage(msg);
      }
    };

    // Listen for sender confirmation
    const onSent = (msg) => {
      if (msg.groupId === groupId || msg.groupid === groupId) {
        confirmGroupMessage(msg);
        setSending(false);
      }
    };

    socket.on('receive_group_message', onReceive);
    socket.on('group_message_sent', onSent);
    socket.on('message_error', () => setSending(false));

    return () => {
      socket.off('receive_group_message', onReceive);
      socket.off('group_message_sent', onSent);
      socket.off('message_error');
    };
  }, [groupId, receiveGroupMessage, confirmGroupMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    sendGroupMessage(groupId, text);
    setInput('');
  };

  const getInitials = (id) => {
    if (user && (id === user.userId || id === user.id)) return 'Me';
    return String(id).slice(0, 2).toUpperCase();
  };

  const isOwn = (msg) => msg.senderId === user?.userId || msg.senderId === user?.id;

  return (
    <div className="chatbox" role="region" aria-label={`Chat for ${groupName}`}>
      <div className="chatbox-header">
        <div className="chatbox-header-dot" />
        <span className="chatbox-header-name">💬 {groupName} — Live Chat</span>
      </div>

      <div className="chatbox-messages">
        {messages.length === 0 && (
          <div className="chatbox-empty">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`chat-message ${isOwn(msg) ? 'chat-own' : 'chat-other'}`}>
            {!isOwn(msg) && (
              <div className="chat-avatar">{getInitials(msg.senderId)}</div>
            )}
            <div className="chat-bubble">
              <p className="chat-text">{msg.content}</p>
              <time className="chat-time">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </time>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbox-input-area" onSubmit={handleSend}>
        <input
          id={`chat-input-${groupId}`}
          className="form-input chatbox-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          autoComplete="off"
          maxLength={1000}
        />
        <button
          type="submit"
          className="btn btn-primary chatbox-send-btn"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          id={`chat-send-${groupId}`}
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
  );
}
