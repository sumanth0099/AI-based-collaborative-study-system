// src/api/pages.api.js
import { get } from './client.js';

/** GET /api/pages/home */
export const getHomeData = () => get('/api/pages/home');

/** GET /api/pages/dashboard */
export const getDashboardData = () => get('/api/pages/dashboard');
