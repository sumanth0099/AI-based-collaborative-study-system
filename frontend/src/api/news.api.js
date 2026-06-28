// src/api/news.api.js
import { get } from './client.js';

/**
 * Get news by category
 * @param {string} category - e.g. "scholarships", "exams", etc.
 */
export const getNewsByCategory = (category) => 
  get(`/api/news/${category}`);