// src/api/messages.api.js
import { get } from './client.js';

/** GET /api/groups/:groupId/messages */
export const getGroupMessages = (groupId) => get(`/api/groups/${groupId}/messages`);
