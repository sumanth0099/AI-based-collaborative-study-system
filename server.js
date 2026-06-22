const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const socketManager = require("./src/socketManager");
const pool = require("./src/config.js");
const createID = require("./src/utils/generateuuid.js");
app.use(express.json());

// ---------------- SESSION ----------------
const sessionMiddleware = session({
  secret: "mySuperSecretKey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
});

app.use(sessionMiddleware);

// ---------------- ROUTES ----------------
app.use('/auth', require("./src/routes/auth.routes.js"));
app.use('/api/notes', require("./src/routes/note.routes.js"));
app.use('/api/resources', require("./src/routes/resource.routes.js"));
app.use('/api/groups', require("./src/routes/studygroups.routes"));
app.use('/api', require("./src/routes/friends.routes.js"));
app.use('/api', require("./src/routes/notifications.routes.js"));
// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError &&
      err.status === 400 &&
      'body' in err) {

    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body'
    });
  }

  next(err);
});

// ---------------- SERVER + SOCKET ----------------
const server = http.createServer(app);
const io = new Server(server);

socketManager.init(io);

const { userSocketMap } = socketManager;

// ---------------- SOCKET MIDDLEWARE (SESSION) ----------------
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// ---------------- ATTACH USER ID TO SOCKET ----------------
io.use((socket, next) => {
  const session = socket.request.session;

  if (!session || !session.userId) {
    return next(new Error("Unauthorized: no session user"));
  }

  socket.userId = session.userId;
  socket.username = session.username;
  next();
});

// ---------------- CONNECTION ----------------
io.on("connection", (socket) => {
  
  console.log("User connected:", socket.userId);

  // store user
  userSocketMap.set(socket.userId, socket.id);

  socket.on("private_message", async ({ receiverId, message }) => {
    try {
  
      if (!receiverId) {
        return socket.emit("message_error", {
          success: false,
          message: "Receiver ID is required"
        });
      }
  
      if (!message || !message.trim()) {
        return socket.emit("message_error", {
          success: false,
          message: "Message cannot be empty"
        });
      }
  
      if (Number(receiverId) === Number(socket.userId)) {
        return socket.emit("message_error", {
          success: false,
          message: "You cannot message yourself"
        });
      }
  
      const receiverSocketId = userSocketMap.get(receiverId);
  
      if (!receiverSocketId) {
  
        const userResult = await pool.query(
          `SELECT id FROM users WHERE id = $1`,
          [receiverId]
        );
  
        if (userResult.rowCount === 0) {
          return socket.emit("message_error", {
            success: false,
            message: "User does not exist"
          });
        }
  
        const notificationResult = await pool.query(
          `
          SELECT id
          FROM notifications
          WHERE receiverId = $1
            AND type = $2
            AND is_sent = false
          `,
          [receiverId, "tried_to_reach_out"]
        );
  
        if (notificationResult.rowCount > 0) {
          return socket.emit("message_error", {
            success: false,
            message: "User is offline and you have already tried to reach out"
          });
        }
  
        await pool.query(
          `
          INSERT INTO notifications
          (id, receiverId, type, message, is_sent, createdAt)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            createID(),
            receiverId,
            "tried_to_reach_out",
            `User ${socket.username} tried to reach you`,
            false,
            new Date()
          ]
        );
  
        return socket.emit("message_error", {
          success: false,
          message: "User is offline"
        });
      }
  
      const payload = {
        senderId: socket.userId,
        receiverId,
        message: message.trim(),
        sentAt: new Date()
      };
  
      // Send to receiver
      io.to(receiverSocketId).emit(
        "receive_private_message",
        payload
      );
  
      // Acknowledge sender
      socket.emit(
        "private_message_sent",
        payload
      );
  
    } catch (err) {
      console.error("Private message error:", err);
  
      return socket.emit("message_error", {
        success: false,
        message: "Failed to send message"
      });
    }
  });

  socket.on("disconnect", () => {
    userSocketMap.delete(socket.userId);
    console.log("User disconnected:", socket.userId);
  });

});

// ---------------- EXPORTS (IMPORTANT for controllers) ----------------
module.exports = {
  app,
  server
};

// ---------------- START SERVER ----------------
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});