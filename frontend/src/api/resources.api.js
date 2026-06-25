// src/api/resources.api.js
import { get, post, del } from './client.js';

/** POST /api/resources/upload — multipart/form-data */
export const uploadResource = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return post('/api/resources/upload', formData);
};

/** POST /api/resources/share */
export const shareResource = (resourceId, sharedWithUserId) =>
  post('/api/resources/share', { resourceId, sharedWithUserId });

/** GET /api/resources */
export const getAllResources = () => get('/api/resources');

/** GET /api/resources/:id */
export const getResourceById = (id) => get(`/api/resources/${id}`);

/** DELETE /api/resources/:id */
export const deleteResource = (id) => del(`/api/resources/${id}`);
