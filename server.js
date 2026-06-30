const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/room/:roomId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function publicPlayers(roomId) {
  const room = getRoom(roomId);
  return [...room.values()].map(player => ({
    id: player.id,
    name: player.name,
    joinedAt: player.joinedAt
  }));
}

io.on("connection", socket => {
  socket.on("join-room", ({ roomId, name }) => {
    if (!roomId) return;

    const room = getRoom(roomId);

    if (room.size >= 4) {
      socket.emit("room-full");
      return;
    }

    socket.join(roomId);
    room.set(socket.id, {
      id: socket.id,
      name: name || "Spieler",
      joinedAt: Date.now()
    });

    socket.data.roomId = roomId;
    socket.data.name = name || "Spieler";

    socket.emit("room-joined", {
      myId: socket.id,
      players: publicPlayers(roomId)
    });

    socket.to(roomId).emit("player-joined", {
      id: socket.id,
      name: socket.data.name,
      joinedAt: Date.now()
    });
  });

  socket.on("signal", ({ to, signal }) => {
    io.to(to).emit("signal", {
      from: socket.id,
      signal
    });
  });

  socket.on("stream-started", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("player-stream-started", {
      id: socket.id
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = getRoom(roomId);
    room.delete(socket.id);

    socket.to(roomId).emit("player-left", {
      id: socket.id
    });

    if (room.size === 0) rooms.delete(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Soullocke WebRTC server running on http://localhost:${PORT}`);
});
