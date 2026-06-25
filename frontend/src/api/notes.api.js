// src/api/notes.api.js
import { get, post, put, del } from './client.js';

/** GET /api/notes */
export const getAllNotes = () => get('/api/notes/');

/** GET /api/notes/:id */
export const getNoteById = (id) => get(`/api/notes/${id}`);

/** GET /api/notes/search?q=query */
export const searchNotes = (query) => get(`/api/notes/search?q=${encodeURIComponent(query)}`);

/** POST /api/notes */
export const createNote = (data) => post('/api/notes/', data);

/** PUT /api/notes/:id */
export const updateNote = (id, data) => put(`/api/notes/${id}`, data);

/** DELETE /api/notes/:id */
export const deleteNote = (id) => del(`/api/notes/${id}`);
