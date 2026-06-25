// src/stores/groupsStore.js
import { create } from 'zustand';
import * as groupApi from '../api/groups.api.js';
import * as memberApi from '../api/groupMembers.api.js';
import * as joinApi from '../api/joinRequests.api.js';

const useGroupsStore = create((set, get) => ({
  groups: [],
  myGroups: [],
  currentGroup: null,
  members: [],
  joinRequests: [],
  searchResults: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await groupApi.getAllGroups();
      set({ groups: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyGroups: async () => {
    try {
      const data = await memberApi.getMyGroups();
      set({ myGroups: data?.groups || [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchGroupById: async (id) => {
    set({ isLoading: true });
    try {
      const data = await groupApi.getGroupById(id);
      set({ currentGroup: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  searchGroups: async (query) => {
    try {
      const data = await groupApi.searchGroups(query);
      set({ searchResults: Array.isArray(data) ? data : [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  createGroup: async (data) => {
    const created = await groupApi.createGroup(data);
    const group = created.group || created;
    set((s) => ({ groups: [group, ...s.groups] }));
    return group;
  },

  updateGroup: async (id, data) => {
    const updated = await groupApi.updateGroup(id, data);
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? updated : g)),
      currentGroup: updated,
    }));
    return updated;
  },

  deleteGroup: async (id) => {
    await groupApi.deleteGroup(id);
    set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }));
  },

  fetchMembers: async (groupId) => {
    try {
      const data = await memberApi.getGroupMembers(groupId);
      set({ members: data?.members || [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  joinGroup: async (groupId) => {
    await memberApi.joinGroup(groupId);
    await get().fetchMyGroups();
  },

  leaveGroup: async (groupId) => {
    await memberApi.leaveGroup(groupId);
    set((s) => ({ myGroups: s.myGroups.filter((g) => g.id !== groupId) }));
  },

  promoteMember: async (groupId, userId) => {
    await memberApi.promoteMember(groupId, userId);
    await get().fetchMembers(groupId);
  },

  demoteMember: async (groupId, userId) => {
    await memberApi.demoteMember(groupId, userId);
    await get().fetchMembers(groupId);
  },

  removeMember: async (groupId, userId) => {
    await memberApi.removeMember(groupId, userId);
    set((s) => ({ members: s.members.filter((m) => m.userId !== userId && m.id !== userId) }));
  },

  sendJoinRequest: async (groupId) => joinApi.sendJoinRequest(groupId),

  fetchJoinRequests: async (groupId) => {
    try {
      const data = await joinApi.getPendingRequests(groupId);
      set({ joinRequests: Array.isArray(data) ? data : [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  approveRequest: async (groupId, userId) => {
    await joinApi.approveRequest(groupId, userId);
    set((s) => ({ joinRequests: s.joinRequests.filter((r) => r.userId !== userId) }));
  },

  rejectRequest: async (groupId, userId) => {
    await joinApi.rejectRequest(groupId, userId);
    set((s) => ({ joinRequests: s.joinRequests.filter((r) => r.userId !== userId) }));
  },

  clearSearch: () => set({ searchResults: [] }),
  clearCurrentGroup: () => set({ currentGroup: null, members: [], joinRequests: [] }),
}));

export default useGroupsStore;
