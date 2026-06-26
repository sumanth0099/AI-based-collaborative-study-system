// src/api/notifications.api.js
import { get, post } from './client.js';

/** GET /api/get-notifications/unseen */
export const getUnseenNotifications = () => get('/api/get-notifications/unseen');

/** GET /api/get-notifications/history */
export const getNotificationHistory = () => get('/api/get-notifications/history');

/** POST /api/mark-read */
export const markNotificationsRead = () => post('/api/mark-read');
