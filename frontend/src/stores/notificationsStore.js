// src/stores/notificationsStore.js
import { create } from 'zustand';
import * as api from '../api/notifications.api.js';

const useNotificationsStore = create((set) => ({
  unseen: [],
  unseenCount: 0,
  history: [],
  isLoading: false,

  fetchUnseen: async () => {
    try {
      const data = await api.getUnseenNotifications();
      set({ unseen: data?.notifications || [], unseenCount: data?.count || 0 });
    } catch {
      // silent fail for polling
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getNotificationHistory();
      set({ history: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  /** Add a real-time notification from socket */
  addRealtimeNotification: (notification) => {
    set((s) => ({
      unseen: [notification, ...s.unseen],
      unseenCount: s.unseenCount + 1,
    }));
  },

  clearUnseen: () => set({ unseen: [], unseenCount: 0 }),
}));

export default useNotificationsStore;
