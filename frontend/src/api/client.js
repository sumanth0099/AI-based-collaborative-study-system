// src/api/client.js
// Base fetch wrapper — reads base URL from .env

const BASE_URL = window.location.origin;;

/**
 * Core fetch wrapper with session credentials.
 * @param {string} path - API path (e.g. '/auth/me')
 * @param {RequestInit} options - fetch options
 * @returns {Promise<any>}
 */
export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const defaultHeaders = {};
  // Only set Content-Type JSON when not FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // send session cookie
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Parse JSON if possible
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (typeof data === 'object' && data?.message) ||
      `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

export const get    = (path, opts = {}) => apiFetch(path, { method: 'GET',    ...opts });
export const post   = (path, body, opts = {}) => apiFetch(path, { method: 'POST',   body: body instanceof FormData ? body : JSON.stringify(body), ...opts });
export const put    = (path, body, opts = {}) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body), ...opts });
export const del    = (path, opts = {}) => apiFetch(path, { method: 'DELETE', ...opts });
