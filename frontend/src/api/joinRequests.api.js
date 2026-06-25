// src/api/joinRequests.api.js
import { get, post, put } from './client.js';

/** POST /groups/:groupId/request — send join request to private group */
export const sendJoinRequest = (groupId) => post(`/groups/${groupId}/request`, {});

/** GET /groups/:groupId/requests — get pending join requests (admin/owner) */
export const getPendingRequests = (groupId) => get(`/groups/${groupId}/requests`);

/** PUT /groups/:groupId/requests/:userId/approve */
export const approveRequest = (groupId, userId) => put(`/groups/${groupId}/requests/${userId}/approve`, {});

/** PUT /groups/:groupId/requests/:userId/reject */
export const rejectRequest = (groupId, userId) => put(`/groups/${groupId}/requests/${userId}/reject`, {});
