import { create } from "zustand";

const useUIStore = create((set) => ({
  // Closed by default on mobile
  sidebarOpen: window.innerWidth > 768,

  activeModal: null,
  toasts: [],

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) =>
    set({
      sidebarOpen: open,
    }),

  openModal: (id) =>
    set({
      activeModal: id,
    }),

  closeModal: () =>
    set({
      activeModal: null,
    }),

  showToast: (message, type = "info", duration = 4000) => {
    const id = Date.now();

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export default useUIStore;