// src/stores/resourcesStore.js
import { create } from 'zustand';
import * as api from '../api/resources.api.js';

const useResourcesStore = create((set) => ({
  resources: [],
  currentResource: null,
  isLoading: false,
  isUploading: false,
  error: null,

  fetchResources: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getAllResources();
      set({ resources: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchResourceById: async (id) => {
    try {
      const data = await api.getResourceById(id);
      set({ currentResource: data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  uploadResource: async (file) => {
    set({ isUploading: true, error: null });
    try {
      const data = await api.uploadResource(file);
      // Backend returns { message, data: { cloudinaryUrl, ... } }
      const resource = data?.data || data;
      set((s) => ({
        resources: [resource, ...s.resources],
        isUploading: false,
      }));
      return resource;
    } catch (err) {
      set({ error: err.message, isUploading: false });
      throw err;
    }
  },

  shareResource: async (resourceId, sharedWithUserId) => {
    return await api.shareResource(resourceId, sharedWithUserId);
  },

  deleteResource: async (id) => {
    await api.deleteResource(id);
    set((s) => ({ resources: s.resources.filter((r) => r.id !== id) }));
  },
}));

export default useResourcesStore;
