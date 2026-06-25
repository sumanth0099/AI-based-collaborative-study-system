// src/api/friends.api.js
import { get, post } from './client.js';

/** GET /api/get-friends */
export const getFriends = () => get('/api/get-friends');

/** GET /api/get-users */
export const getAllUsers = () => get('/api/get-users');

/** GET /api/search-users?username=query&offset=0 */
export const searchUsers = (username, offset = 0) =>
  get(`/api/search-users?username=${encodeURIComponent(username)}&offset=${offset}`);

/** GET /api/get-reqests — note: intentional typo in backend route */
export const getFriendRequests = () => get('/api/get-reqests');

/** POST /api/friend-requests/send */
export const sendFriendRequest = (recipientId) =>
  post('/api/friend-requests/send', { recipientId });

/** POST /api/friends-request/action */
export const handleFriendRequest = (requestId, action) =>
  post('/api/friends-request/action', { requestId, action });
