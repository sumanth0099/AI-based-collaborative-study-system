// src/stores/notesStore.js
import { create } from 'zustand';
import * as api from '../api/notes.api.js';

const useNotesStore = create((set, get) => ({
  notes: [],
  currentNote: null,
  searchResults: [],
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getAllNotes();
      set({ notes: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchNoteById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getNoteById(id);
      set({ currentNote: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  searchNotes: async (query) => {
    try {
      const data = await api.searchNotes(query);
      set({ searchResults: Array.isArray(data) ? data : [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  createNote: async (noteData) => {
    const data = await api.createNote(noteData);
    set((s) => ({ notes: [data, ...s.notes] }));
    return data;
  },

  updateNote: async (id, noteData) => {
    const data = await api.updateNote(id, noteData);
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? data : n)),
      currentNote: data,
    }));
    return data;
  },

  deleteNote: async (id) => {
    await api.deleteNote(id);
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      searchResults: s.searchResults.filter((n) => n.id !== id),
    }));
  },

  clearCurrentNote: () => set({ currentNote: null }),
  clearSearch: () => set({ searchResults: [] }),
}));

export default useNotesStore;
