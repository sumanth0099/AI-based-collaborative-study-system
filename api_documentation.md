# API Documentation

This document lists all the available API endpoints in the AI-based Collaborative Study System backend. Each endpoint includes a copyable request and response body where applicable.

---

## 1. Authentication (`/auth`)
*Session-based authentication.*

- `GET /auth/google` - Redirect to Google for authentication.
- `GET /auth/google/callback` - Callback URL for Google Auth.
- `GET /auth/me` - Get current authenticated user details.
  - **Response (200):**
    ```json
    { "userId": "uuid", "email": "user@example.com" }
    ```
- `POST /auth/register` - Register a new user.
  - **Request Body:**
    ```json
    { "username": "user1", "email": "user1@example.com", "password": "secure" }
    ```
  - **Response (201):**
    ```json
    { "message": "User registered successfully", "userId": "uuid" }
    ```
- `POST /auth/login` - Login.
  - **Request Body:**
    ```json
    { "username": "user1", "password": "secure" }
    ```
  - **Response (200):**
    ```json
    { "message": "Login successful", "user": { "id": "...", "email": "...", "name": "..." } }
    ```
- `POST /auth/logout` - Logout.

---

## 2. Study Groups (`/api/groups`)

- `GET /api/groups/search` - Search for study groups.
  - **Query Params:** `?q=query`
  - **Response (200):** Array of matching group objects.
- `GET /api/groups/` - Get all study groups.
  - **Response (200):** Array of all groups.
- `GET /api/groups/:id` - Get details of a specific study group.
  - **Response (200):** Single group object.
- `POST /api/groups/` - Create a new study group.
  - **Request Body:**
    ```json
    { "name": "Math Group", "description": "Study math", "isPrivate": false }
    ```
- `PUT /api/groups/:id` - Update a specific study group (owner only).
- `DELETE /api/groups/:id` - Delete a study group (owner only).

---

## 3. Study Group Members (`/api/group-members`)

- `GET /api/group-members/my-groups` - Get groups joined by the current user.
- `GET /api/group-members/:groupId/members` - View members of a group.
- `POST /api/group-members/:groupId/join` - Join a study group.
- `PUT /api/group-members/:groupId/promote/:userId` - Promote a member to admin (owner only).
- `PUT /api/group-members/:groupId/demote/:userId` - Demote an admin to member (owner only).
- `DELETE /api/group-members/:groupId/leave` - Leave a study group.
- `DELETE /api/group-members/:groupId/remove/:userId` - Remove a member or admin from the group.

---

## 4. Group Messages (`/api/groups/:groupId/messages`)

- `GET /api/groups/:groupId/messages` - Retrieve all messages in a specific group.
  - **Response (200):**
    ```json
    { "success": true, "messages": [...] }
    ```

---

## 5. Join Requests (`/groups`)

- `GET /groups/:groupId/requests` - Get pending join requests for a group.
- `POST /groups/:groupId/request` - Send a join request to a group.
- `PUT /groups/:groupId/requests/:userId/approve` - Approve a join request.
- `PUT /groups/:groupId/requests/:userId/reject` - Reject a join request.

---

## 6. Notes (`/api/notes`)

- `GET /api/notes/search` - Search notes.
- `GET /api/notes/` - Get all notes for the user.
- `GET /api/notes/:id` - Get a specific note by ID.
- `POST /api/notes/` - Create a new note.
  - **Request Body:**
    ```json
    { "name": "Note Name", "subject": "Math", "topic": "Algebra", "content": "..." }
    ```
- `PUT /api/notes/:id` - Update an existing note.
- `DELETE /api/notes/:id` - Delete a note.

---

## 7. Resources (`/api/resources`)

- `POST /api/resources/upload` - Upload a new resource file.
- `POST /api/resources/share` - Share a resource.
- `GET /api/resources` - Get all resources.
- `GET /api/resources/:id` - Get a single resource.
- `DELETE /api/resources/:id` - Delete a resource.

---

## 8. Friends & Users (`/api`)

- `GET /api/get-friends` - Get list of friends.
- `GET /api/get-users` - Get list of all users.
- `GET /api/search-users` - Search for users.
- `GET /api/get-reqests` - Get received friend requests (note: `get-reqests`).
- `POST /api/friend-requests/send` - Send a friend request.
  - **Request Body:** `{ "recipientId": "uuid" }`
- `POST /api/friends-request/action` - Handle friend request action.
  - **Request Body:** `{ "requestId": "uuid", "action": "accept" }`

---

## 9. Notifications (`/api/get-notifications`)

- `GET /api/get-notifications/unseen` - Get new unseen notifications.
- `GET /api/get-notifications/history` - Get user notification history.

---

## 10. AI Assistant (`/api/ai`)

- `GET /api/ai/quiz/available-options` - Get available topics for a quiz.
- `POST /api/ai/quiz/generate` - Generate a quiz using AI.
- `POST /api/ai/quiz/submit` - Submit a quiz for AI evaluation.
- `POST /api/ai/flashcards/generate` - Generate flashcards using AI.
- `POST /api/ai/chat` - Chat with the AI assistant.
- `POST /api/ai/summary/generate` - Generate a text summary using AI.

---

*For full WebSocket and detailed route behavior, see [API_and_WebSocket_Documentation.md](file:///e:/AI-based-collaborative-study-system/API_and_WebSocket_Documentation.md).*
