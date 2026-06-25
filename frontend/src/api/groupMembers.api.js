// src/api/groupMembers.api.js
import { get, post, put, del } from './client.js';

/** GET /api/group-members/my-groups */
export const getMyGroups = () => get('/api/group-members/my-groups');

/** GET /api/group-members/:groupId/members */
export const getGroupMembers = (groupId) => get(`/api/group-members/${groupId}/members`);

/** POST /api/group-members/:groupId/join */
export const joinGroup = (groupId) => post(`/api/group-members/${groupId}/join`, {});

/** DELETE /api/group-members/:groupId/leave */
export const leaveGroup = (groupId) => del(`/api/group-members/${groupId}/leave`);

/** PUT /api/group-members/:groupId/promote/:userId */
export const promoteMember = (groupId, userId) => put(`/api/group-members/${groupId}/promote/${userId}`, {});

/** PUT /api/group-members/:groupId/demote/:userId */
export const demoteMember = (groupId, userId) => put(`/api/group-members/${groupId}/demote/${userId}`, {});

/** DELETE /api/group-members/:groupId/remove/:userId */
export const removeMember = (groupId, userId) => del(`/api/group-members/${groupId}/remove/${userId}`);
