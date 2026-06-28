// src/api/auth.api.js
import { get, post } from './client.js';

const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL 

/** GET /auth/me */
export const getMe = () => get('/auth/me');

/** POST /auth/register */
export const register = (data) => post('/auth/register', data);

/** POST /auth/login */
export const login = (data) => post('/auth/login', data);

/** POST /auth/logout */
export const logout = () => post('/auth/logout', {});

/** Redirect to Google OAuth (backend handles redirect) */
export const loginWithGoogle = () => {
  window.location.href = GOOGLE_AUTH_URL;
};
