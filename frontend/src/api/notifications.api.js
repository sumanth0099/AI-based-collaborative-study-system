// src/api/notifications.api.js
import { get } from './client.js';

/** GET /api/get-notifications/unseen */
export const getUnseenNotifications = () => get('/api/get-notifications/unseen');

/** GET /api/get-notifications/history */
export const getNotificationHistory = () => get('/api/get-notifications/history');
