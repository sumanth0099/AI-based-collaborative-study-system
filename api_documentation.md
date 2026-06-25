# API Quick Reference

This document provides a quick overview of all endpoints. For full technical details (request bodies and responses), please see the [API Technical Specification](file:///e:/AI-based-collaborative-study-system/api_spec.md) or the [Exhaustive API and WebSocket Documentation](file:///e:/AI-based-collaborative-study-system/API_and_WebSocket_Documentation.md).

## Authentication (`/auth`)

- `POST /auth/register` - Register a new user.
  ```json
  { "username": "...", "email": "...", "password": "..." }
  ```
- `POST /auth/login` - Login.
  ```json
  { "username": "...", "password": "..." }
  ```
- `GET /auth/me` - Get current user.
- `POST /auth/logout` - Logout.

## Study Groups (`/api/groups`)

- `POST /api/groups/` - Create group.
  ```json
  { "name": "...", "description": "...", "isPrivate": false }
  ```
- `GET /api/groups/search?q=...` - Search groups.
- `GET /api/groups/` - Get all groups.

## Friends & Users (`/api`)

- `POST /api/friend-requests/send` - Send request.
  ```json
  { "recipientId": "..." }
  ```
- `POST /api/friends-request/action` - Handle request.
  ```json
  { "requestId": "...", "action": "accept" }
  ```

---

*Refer to the full documentation for exhaustive request and response details.*
