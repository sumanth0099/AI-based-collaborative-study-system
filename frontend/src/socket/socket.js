// src/socket/socket.js
// Socket.io client — reads URL from .env
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  withCredentials: true,   // sends session cookie for auth
  transports: ['websocket', 'polling'],
  autoConnect: false,      // connect manually after login
});

/** Connect socket (call after successful login) */
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

/** Disconnect socket (call on logout) */
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

/** Emit a private message */
export const emitPrivateMessage = (receiverId, message) => {
  socket.emit('private_message', { receiverId, message });
};

/** Emit a group message */
export const emitGroupMessage = (groupId, message) => {
  socket.emit('group_message', { groupId, message });
};
