// src/api/groups.api.js
import { get, post, put, del } from './client.js';

/** GET /api/groups */
export const getAllGroups = () => get('/api/groups/');

/** GET /api/groups/search?q=query */
export const searchGroups = (query) => get(`/api/groups/search?q=${encodeURIComponent(query)}`);

/** GET /api/groups/:id */
export const getGroupById = (id) => get(`/api/groups/${id}`);

/** POST /api/groups */
export const createGroup = (data) => post('/api/groups/', data);

/** PUT /api/groups/:id */
export const updateGroup = (id, data) => put(`/api/groups/${id}`, data);

/** DELETE /api/groups/:id */
export const deleteGroup = (id) => del(`/api/groups/${id}`);
