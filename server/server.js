const express = require("express");
const app = express();
const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ userId, roomId }) => {
    socket.join(roomId);

    // returns set of clients in roomId
    const clients = io.sockets.adapter.rooms.get(roomId);
    socket.to(roomId).emit("user-connected", userId);
  });
});

server.listen(3001, () => {
  console.log("server listening on port 3001");
});
