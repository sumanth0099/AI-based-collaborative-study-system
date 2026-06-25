// src/stores/uiStore.js
import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  activeModal: null,   // string modal ID or null
  toasts: [],          // { id, type, message, duration }

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  /** Show a toast notification */
  showToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration + 300);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useUIStore;
