let io;
const userSocketMap = new Map();

module.exports = {
  init: (socketIo) => {
    io = socketIo;
  },

  getIO: () => io,

  userSocketMap
};