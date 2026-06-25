# Exhaustive API and WebSocket Documentation

This document serves as the complete reference for all REST API endpoints and WebSocket (Socket.io) functionality in the AI-based Collaborative Study System.

---

## 1. Authentication Endpoints (`/auth`)
*All authenticated endpoints require a valid session cookie (`connect.sid`).*

### 1.1 Register User
- **Endpoint:** `POST /auth/register`
- **Request Body:**
  ```json
  { "username": "user1", "email": "user1@example.com", "password": "secure" }
  ```
- **Response (201):**
  ```json
  { "message": "User registered successfully", "userId": "uuid..." }
  ```

### 1.2 Login User
- **Endpoint:** `POST /auth/login`
- **Request Body:**
  ```json
  { "username": "user1", "password": "secure" } // Or use "email"
  ```
- **Response (200):**
  ```json
  { "message": "Login successful", "user": { "id": "...", "email": "...", "name": "..." } }
  ```

### 1.3 Logout User
- **Endpoint:** `POST /auth/logout`
- **Response (200):**
  ```json
  { "message": "Logged out successfully" }
  ```

### 1.4 Get Current User (Me)
- **Endpoint:** `GET /auth/me`
- **Response (200):**
  ```json
  { "userId": "uuid", "email": "user@example.com" }
  ```

---

## 2. Study Groups (`/api/groups`)

### 2.1 Create Group
- **Endpoint:** `POST /api/groups/`
- **Request Body:**
  ```json
  { "name": "Math Group", "description": "Study math", "avatar": "url", "isPrivate": false }
  ```
- **Response (201):**
  ```json
  { "message": "Group created successfully", "group": { "id": "...", "name": "Math Group", ... } }
  ```

### 2.2 Get All Groups
- **Endpoint:** `GET /api/groups/`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "name": "Math Group", "description": "...", "avatar": "...", "isPrivate": false }
  ]
  ```

### 2.3 Get Group By ID
- **Endpoint:** `GET /api/groups/:id`
- **Response (200):**
  ```json
  { "id": "uuid", "name": "Math Group", "description": "...", "avatar": "...", "isPrivate": false }
  ```

### 2.4 Update Group
- **Endpoint:** `PUT /api/groups/:id`
- **Request Body:** (Fields to update e.g., `name`, `description`, `avatar`, `isPrivate`)
- **Response (200):**
  ```json
  { "id": "uuid", "name": "Updated Group", "description": "...", "avatar": "...", "isPrivate": false }
  ```

### 2.5 Delete Group
- **Endpoint:** `DELETE /api/groups/:id`
- **Response (200):** `{ "message": "Group deleted successfully" }`

### 2.6 Search Groups
- **Endpoint:** `GET /api/groups/search?q=query`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "name": "Math Group", "description": "..." }
  ]
  ```

---

## 3. Notes (`/api/notes`)

### 3.1 Create Note
- **Endpoint:** `POST /api/notes/`
- **Request Body:**
  ```json
  {
    "groupId": "uuid (optional)", "name": "Algebra Notes", "subject": "Math",
    "topic": "Algebra", "content": "note content (max 700 words)", "contentType": "text",
    "topicImportance": "high", "tags": ["math"], "originalFileName": "", "storedFileName": ""
  }
  ```
- **Response (201):** Created note object.

### 3.2 Get All Notes
- **Endpoint:** `GET /api/notes/`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "name": "Algebra Notes", "subject": "Math", "topic": "Algebra", "content": "..." }
  ]
  ```

### 3.3 Get Note By ID
- **Endpoint:** `GET /api/notes/:id`
- **Response (200):**
  ```json
  { "id": "uuid", "name": "Algebra Notes", "content": "..." }
  ```

### 3.4 Update Note
- **Endpoint:** `PUT /api/notes/:id`
- **Request Body:** (Fields to update e.g., `name`, `content`, `tags`, `isArchived`)
- **Response (200):**
  ```json
  { "id": "uuid", "name": "Updated Notes", "content": "..." }
  ```

### 3.5 Delete Note
- **Endpoint:** `DELETE /api/notes/:id` (Soft delete, sets `isArchived` to true)
- **Response (200):** `{ "message": "Note deleted successfully" }`

### 3.6 Search Notes
- **Endpoint:** `GET /api/notes/search?q=query`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "name": "Algebra Notes", "topic": "Algebra" }
  ]
  ```

---

## 4. Resources (`/api/resources`)

### 4.1 Upload Resource
- **Endpoint:** `POST /api/resources/upload`
- **Request Type:** `multipart/form-data` with `file` field.
- **Response (200):**
  ```json
  {
    "message": "Resource uploaded successfully",
    "data": { "cloudinaryUrl": "...", "originalFileName": "...", "fileSize": 1024, "mimeType": "..." }
  }
  ```

### 4.2 Share Resource
- **Endpoint:** `POST /api/resources/share`
- **Request Body:** `{ "resourceId": "uuid", "sharedWithUserId": "uuid" }`
- **Response (200):** `{ "message": "Resource shared successfully (placeholder)", "data": {...} }`

### 4.3 Get All Resources
- **Endpoint:** `GET /api/resources`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "originalFileName": "...", "fileSize": 1024, "cloudinaryUrl": "..." }
  ]
  ```

### 4.4 Get Single Resource
- **Endpoint:** `GET /api/resources/:id`
- **Response (200):**
  ```json
  { "id": "uuid", "originalFileName": "...", "fileSize": 1024, "cloudinaryUrl": "..." }
  ```

### 4.5 Delete Resource
- **Endpoint:** `DELETE /api/resources/:id`
- **Response (200):** `{ "message": "Resource deleted successfully" }`

---

## 5. AI Features (`/api/ai`)

### 5.1 Get Quiz Topics
- **Endpoint:** `GET /api/ai/quiz/available-options`
- **Response (200):**
  ```json
  { "topics": [ { "id": "noteId", "topic": "topic_name", "userId": "..." } ] }
  ```

### 5.2 Generate Quiz
- **Endpoint:** `POST /api/ai/quiz/generate`
- **Request Body:** `{ "id": "noteId", "topic": "topic_name" }`
- **Response (200):**
  ```json
  {
    "success": true, "message": "...", "quiz": { "subject": "...", "questions": [ { "id": 1, "question": "...", "options": [...], "correctAnswer": "...", "explanation": "..." } ] }
  }
  ```

### 5.3 Submit Quiz Attempt
- **Endpoint:** `POST /api/ai/quiz/submit`
- **Request Body:**
  ```json
  {
    "noteId": "...", "subject": "...", "topic": "...", "difficulty": "...",
    "totalQuestions": 10, "answers": [ { "selectedAnswer": "A", "correctAnswer": "A" } ]
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "quizScore": 8,
    "totalQuestions": 10,
    "message": "Great job! You passed."
  }
  ```

### 5.4 Generate Flashcards
- **Endpoint:** `POST /api/ai/flashcards/generate`
- **Request Body:** `{ "id": "noteId", "topic": "topic_name" }`
- **Response (200):**
  ```json
  { "success": true, "flashcards": [ { "id": 1, "front": "...", "back": "..." } ] }
  ```

### 5.5 Chat With Assistant
- **Endpoint:** `POST /api/ai/chat`
- **Request Body:** `{ "id": "noteId", "topic": "topic_name", "question": "What is...?" }`
- **Response (200):**
  ```json
  { "success": true, "answer": { "title": "...", "content": "..." } }
  ```

### 5.6 Generate Summary
- **Endpoint:** `POST /api/ai/summary/generate`
- **Request Body:** `{ "id": "noteId", "topic": "topic_name" }`
- **Response (200):**
  ```json
  {
    "summary": "This is a generated summary of your notes..."
  }
  ```

---

## 6. Friends & Users (`/api`)

### 6.1 Get Friends List
- **Endpoint:** `GET /api/get-friends`
- **Response (200):** `{ "success": true, "count": 1, "friends": [...] }`

### 6.2 Get All Users
- **Endpoint:** `GET /api/get-users`
- **Response (200):** `{ "success": true, "count": 10, "users": [...] }`

### 6.3 Search Users
- **Endpoint:** `GET /api/search-users?username=query&offset=0`
- **Response (200):** `{ "success": true, "count": 10, "limit": 10, "offset": 0, "users": [...] }`

### 6.4 Send Friend Request
- **Endpoint:** `POST /api/friend-requests/send`
- **Request Body:** `{ "recipientId": "uuid" }`
- **Response (201):** `{ "message": "Friend request sent successfully" }`

### 6.5 Handle Friend Request
- **Endpoint:** `POST /api/friends-request/action`
- **Request Body:** `{ "requestId": "uuid", "action": "accept" }` // or "reject"
- **Response (200):** `{ "message": "Friend request accepted" }`

### 6.6 Get Pending Friend Requests Received
- **Endpoint:** `GET /api/get-reqests` (Note the spelling in the endpoint route)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 1,
    "requests": [
      { "id": "uuid", "sender_id": "uuid", "sender_name": "...", "status": "pending", "createdAt": "..." }
    ]
  }
  ```

---

## 7. Study Group Members (`/api/group-members`)

### 7.1 Join Group (Public)
- **Endpoint:** `POST /api/group-members/:groupId/join`
- **Response (201):** `{ "message": "Joined group successfully" }`

### 7.2 Leave Group
- **Endpoint:** `DELETE /api/group-members/:groupId/leave`
- **Response (200):** `{ "message": "Left group successfully" }`

### 7.3 Get Group Members
- **Endpoint:** `GET /api/group-members/:groupId/members`
- **Response (200):** `{ "totalMembers": 5, "members": [...] }`

### 7.4 Promote Member to Admin
- **Endpoint:** `PUT /api/group-members/:groupId/promote/:userId` (Owner only)
- **Response (200):** `{ "message": "Member promoted to admin successfully" }`

### 7.5 Demote Admin
- **Endpoint:** `PUT /api/group-members/:groupId/demote/:userId` (Owner only)
- **Response (200):** `{ "message": "Admin demoted successfully" }`

### 7.6 Remove Member
- **Endpoint:** `DELETE /api/group-members/:groupId/remove/:userId` (Admin/Owner)
- **Response (200):** `{ "message": "User removed successfully" }`

### 7.7 Get My Groups
- **Endpoint:** `GET /api/group-members/my-groups`
- **Response (200):** `{ "totalGroups": 3, "groups": [...] }`

---

## 8. Group Join Requests (`/groups`)
*For private groups.*

### 8.1 Send Join Request
- **Endpoint:** `POST /groups/:groupId/request`
- **Response (201):** `{ "message": "Join request sent successfully" }`

### 8.2 Get Pending Requests
- **Endpoint:** `GET /groups/:groupId/requests`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "userId": "uuid", "username": "...", "status": "pending" }
  ]
  ```

### 8.3 Approve Request
- **Endpoint:** `PUT /groups/:groupId/requests/:userId/approve`
- **Response (200):** `{ "message": "Request approved successfully" }`

### 8.4 Reject Request
- **Endpoint:** `PUT /groups/:groupId/requests/:userId/reject`
- **Response (200):** `{ "message": "Request rejected successfully" }`

---

## 9. Notifications (`/api/get-notifications`)

### 9.1 Get Notification History
- **Endpoint:** `GET /api/get-notifications/history`
- **Response (200):**
  ```json
  [
    { "id": "uuid", "type": "friend_request", "message": "...", "is_sent": true, "createdAt": "..." }
  ]
  ```

### 9.2 Get Unseen Notifications
- **Endpoint:** `GET /api/get-notifications/unseen`
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 2,
    "notifications": [
      { "id": "uuid", "type": "group_message", "message": "...", "is_sent": false }
    ]
  }
  ```

---

## 10. Pages Data (`/api/pages`)

### 10.1 Home Page Data
- **Endpoint:** `GET /api/pages/home`
- **Response (200):**
  Returns comprehensive data payload including stats (notes count, groups count), AI insight, recent notes, pending actions, recent group activity, and a list of my groups.

### 10.2 Dashboard Data
- **Endpoint:** `GET /api/pages/dashboard`
- **Response (200):**
  Returns exhaustive analytics data including total items, quiz overview, recent quiz attempts, topic performance, strong/weak topics, monthly activity, and AI summarized insights.

---

## 11. WebSocket (Socket.io) Integration

### 11.1 Connecting to the WebSocket Server
The application uses Socket.io to manage real-time events. Because the backend relies on session cookies (`express-session`) for authentication, the frontend **must** send credentials.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  withCredentials: true, // Required to send the session cookie
  transports: ["websocket", "polling"]
});
```
- If the user has no session, the server will reject the connection (`Unauthorized`).
- The backend maps `socket.userId` directly from the session.

### 11.2 Real-time Messaging (Events)

#### Private Messaging
- **Frontend Emits:**
  ```javascript
  socket.emit("private_message", { receiverId: "uuid", message: "Hello!" });
  ```
- **Backend Emits to Receiver:**
  ```json
  { "senderId": "uuid", "receiverId": "uuid", "message": "Hello!", "sentAt": "..." }
  ```
- **Backend Emits to Sender (Acknowledge):**
  ```javascript
  socket.on("private_message_sent", (data) => { ... });
  ```

#### Group Messaging
- **Frontend Emits:**
  ```javascript
  socket.emit("group_message", { groupId: "uuid", message: "Hey everyone!" });
  ```
- **Backend Emits to Group Members (except sender):**
  ```json
  { "id": "uuid", "groupId": "uuid", "senderId": "uuid", "messageType": "text", "content": "Hey everyone!", "createdAt": "..." }
  ```
- **Backend Emits to Sender (Acknowledge):**
  ```javascript
  socket.on("group_message_sent", (data) => { ... });
  ```

### 11.3 Real-time Notifications (Events)
The server also emits real-time events for friend requests:
- **`friend_request`**: Emitted to recipient when a new friend request is sent.
- **`friend_request_accepted`**: Emitted to sender when request is accepted.
- **`friend_request_rejected`**: Emitted to sender when request is rejected.

### 11.4 Offline Handling
If a user is not currently connected to the WebSocket server when someone messages them or sends a friend request, the server automatically saves a record in the `notifications` table (e.g., `tried_to_reach_out` or `group_message`). These can be fetched later via the `/api/get-notifications/unseen` REST endpoint.
