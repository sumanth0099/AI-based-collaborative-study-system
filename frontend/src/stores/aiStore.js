// src/stores/aiStore.js
import { create } from 'zustand';
import * as api from '../api/ai.api.js';

const useAIStore = create((set, get) => ({
  // Quiz
  quizTopics: [],
  currentQuiz: null,
  quizResult: null,
  isGeneratingQuiz: false,

  // Flashcards
  flashcards: [],
  isGeneratingFlashcards: false,

  // Chat
  chatHistory: [],  // { role: 'user'|'ai', content, timestamp }
  isChatLoading: false,

  // Summary
  summary: null,
  isGeneratingSummary: false,

  // Important Questions
  importantQuestions: null,
  isGeneratingImportantQuestions: false,

  error: null,

  // ─── Quiz ────────────────────────────────────────────
  fetchQuizTopics: async () => {
    try {
      const data = await api.getQuizTopics();
      set({ quizTopics: data?.topics || [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  generateQuiz: async (id, topic) => {
    set({ isGeneratingQuiz: true, error: null, currentQuiz: null, quizResult: null });
    try {
      const data = await api.generateQuiz(id, topic);
      set({ currentQuiz: data?.quiz || data, isGeneratingQuiz: false });
    } catch (err) {
      set({ error: err.message, isGeneratingQuiz: false });
    }
  },

  submitQuiz: async (payload) => {
    try {
      const data = await api.submitQuiz(payload);
      set({ quizResult: data, currentQuiz: null });
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  resetQuiz: () => set({ currentQuiz: null, quizResult: null }),

  // ─── Flashcards ──────────────────────────────────────
  generateFlashcards: async (id, topic) => {
    set({ isGeneratingFlashcards: true, error: null, flashcards: [] });
    try {
      const data = await api.generateFlashcards(id, topic);
      set({ flashcards: data?.flashcards || [], isGeneratingFlashcards: false });
    } catch (err) {
      set({ error: err.message, isGeneratingFlashcards: false });
    }
  },

  // ─── Chat ─────────────────────────────────────────────
  sendChatMessage: async (id, topic, question) => {
    set((s) => ({
      chatHistory: [
        ...s.chatHistory,
        { role: 'user', content: question, timestamp: new Date().toISOString() },
      ],
      isChatLoading: true,
      error: null,
    }));
    try {
      const data = await api.chatWithAI(id, topic, question);
      const answer = data?.answer?.content || data?.answer || 'No response';
      set((s) => ({
        chatHistory: [
          ...s.chatHistory,
          { role: 'ai', content: answer, timestamp: new Date().toISOString() },
        ],
        isChatLoading: false,
      }));
    } catch (err) {
      set((s) => ({
        chatHistory: [
          ...s.chatHistory,
          { role: 'ai', content: 'Sorry, something went wrong.', timestamp: new Date().toISOString() },
        ],
        isChatLoading: false,
        error: err.message,
      }));
    }
  },

  clearChat: () => set({ chatHistory: [] }),

  // ─── Summary ──────────────────────────────────────────
  generateSummary: async (id, topic) => {
    set({ isGeneratingSummary: true, error: null, summary: null });
    try {
      const data = await api.generateSummary(id, topic);
      set({ summary: data?.summary || data, isGeneratingSummary: false });
    } catch (err) {
      set({ error: err.message, isGeneratingSummary: false });
    }
  },

  clearSummary: () => set({ summary: null }),

  // ─── Important Questions ──────────────────────────────
  generateImportantQuestions: async (id, topic) => {
    set({ isGeneratingImportantQuestions: true, error: null, importantQuestions: null });
    try {
      const data = await api.generateImportantQuestions(id, topic);
      set({ importantQuestions: data?.questions || data, isGeneratingImportantQuestions: false });
    } catch (err) {
      set({ error: err.message, isGeneratingImportantQuestions: false });
    }
  },

  clearImportantQuestions: () => set({ importantQuestions: null }),
}));

export default useAIStore;
