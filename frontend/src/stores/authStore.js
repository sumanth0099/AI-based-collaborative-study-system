// src/stores/authStore.js
import { create } from 'zustand';
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth.api.js';
import { connectSocket, disconnectSocket } from '../socket/socket.js';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,  // true until fetchMe resolves
  error: null,

  /** Fetch current user from session */
  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
      connectSocket();
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /** Login with username/email + password */
  login: async (credentials) => {
    set({ error: null });
    const data = await apiLogin(credentials);
    set({ user: data.user, isAuthenticated: true });
    connectSocket();
    return data;
  },

  /** Register new account */
  register: async (credentials) => {
    set({ error: null });
    return await apiRegister(credentials);
  },

  /** Logout */
  logout: async () => {
    await apiLogout();
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
