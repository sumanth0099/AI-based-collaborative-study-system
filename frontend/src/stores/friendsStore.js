// src/stores/friendsStore.js
import { create } from 'zustand';
import * as api from '../api/friends.api.js';

const useFriendsStore = create((set) => ({
  friends: [],
  friendCount: 0,
  users: [],
  userCount: 0,
  requests: [],
  requestCount: 0,
  searchResults: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getFriends();
      set({ friends: data?.friends || [], friendCount: data?.count || 0, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAllUsers: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getAllUsers();
      set({ users: data?.users || [], userCount: data?.count || 0, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  searchUsers: async (username, offset = 0) => {
    try {
      const data = await api.searchUsers(username, offset);
      set({ searchResults: data?.users || [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchRequests: async () => {
    try {
      const data = await api.getFriendRequests();
      set({ requests: data?.requests || [], requestCount: data?.count || 0 });
    } catch (err) {
      set({ error: err.message });
    }
  },

  sendFriendRequest: async (recipientId) => {
    return await api.sendFriendRequest(recipientId);
  },

  handleFriendRequest: async (requestId, action) => {
    await api.handleFriendRequest(requestId, action);
    set((s) => ({ requests: s.requests.filter((r) => r.id !== requestId) }));
  },

  clearSearch: () => set({ searchResults: [] }),
}));

export default useFriendsStore;
