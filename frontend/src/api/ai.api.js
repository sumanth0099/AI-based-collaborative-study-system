// src/api/ai.api.js
import { get, post } from './client.js';

/** GET /api/ai/quiz/available-options */
export const getQuizTopics = () => get('/api/ai/quiz/available-options');

/** POST /api/ai/quiz/generate */
export const generateQuiz = (id, topic) => post('/api/ai/quiz/generate', { id, topic });

/** POST /api/ai/quiz/submit */
export const submitQuiz = (data) => post('/api/ai/quiz/submit', data);

/** POST /api/ai/flashcards/generate */
export const generateFlashcards = (id, topic) => post('/api/ai/flashcards/generate', { id, topic });

/** POST /api/ai/chat */
export const chatWithAI = (id, topic, question) => post('/api/ai/chat', { id, topic, question });

/** POST /api/ai/summary/generate */
export const generateSummary = (id, topic) => post('/api/ai/summary/generate', { id, topic });
