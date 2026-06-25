// src/stores/chatStore.js
import { create } from 'zustand';
import { getGroupMessages } from '../api/messages.api.js';
import { socket, emitGroupMessage, emitPrivateMessage } from '../socket/socket.js';

const useChatStore = create((set, get) => ({
  // { [groupId]: Message[] }
  groupMessages: {},
  privateMessages: [],
  isLoading: false,
  error: null,

  /** Fetch message history for a group from REST */
  fetchGroupMessages: async (groupId) => {
    set({ isLoading: true });
    try {
      const data = await getGroupMessages(groupId);
      const msgs = data?.messages || [];
      set((s) => ({
        groupMessages: { ...s.groupMessages, [groupId]: msgs },
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /** Send a group message via socket */
  sendGroupMessage: (groupId, message) => {
    emitGroupMessage(groupId, message);
  },

  /** Send a private message via socket */
  sendPrivateMessage: (receiverId, message) => {
    emitPrivateMessage(receiverId, message);
  },

  /** Called by socket listener when a group message is received */
  receiveGroupMessage: (message) => {
    const groupId = message.groupId || message.groupid;
    set((s) => ({
      groupMessages: {
        ...s.groupMessages,
        [groupId]: [...(s.groupMessages[groupId] || []), message],
      },
    }));
  },

  /** Called when sender gets confirmation (group_message_sent) */
  confirmGroupMessage: (message) => {
    const groupId = message.groupId || message.groupid;
    set((s) => ({
      groupMessages: {
        ...s.groupMessages,
        [groupId]: [...(s.groupMessages[groupId] || []), message],
      },
    }));
  },

  /** Private message received */
  receivePrivateMessage: (message) => {
    set((s) => ({ privateMessages: [...s.privateMessages, message] }));
  },

  clearGroupMessages: (groupId) =>
    set((s) => ({ groupMessages: { ...s.groupMessages, [groupId]: [] } })),
}));

export default useChatStore;
