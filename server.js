const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const socketManager = require("./src/socketManager");
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
  next();
});

// ---------------- CONNECTION ----------------
io.on("connection", (socket) => {
  
  console.log("User connected:", socket.userId);

  // store user
  userSocketMap.set(socket.userId, socket.id);

  socket.on("message", (data) => {
    socket.emit("message_received", data);
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