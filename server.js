
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, pingTimeout: 30000, pingInterval: 10000 });

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 4;
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.get("/room/:roomId", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function playerList(roomId) {
  return [...getRoom(roomId).values()]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map(p => ({ id: p.id, name: p.name, joinedAt: p.joinedAt, isSharing: p.isSharing }));
}

function broadcastPlayers(roomId) {
  io.to(roomId).emit("players", playerList(roomId));
}

io.on("connection", socket => {
  socket.on("join-room", ({ roomId, name }) => {
    roomId = String(roomId || "").trim().slice(0, 40);
    name = String(name || "Spieler").trim().slice(0, 24);
    if (!roomId) return socket.emit("join-error", "Kein Raumcode angegeben.");

    const room = getRoom(roomId);
    if (!room.has(socket.id) && room.size >= MAX_PLAYERS) {
      return socket.emit("join-error", "Der Raum ist voll. Maximal 4 Spieler.");
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    room.set(socket.id, { id: socket.id, name, joinedAt: Date.now(), isSharing: false });

    socket.emit("joined", { myId: socket.id, roomId, players: playerList(roomId) });
    broadcastPlayers(roomId);
  });

  socket.on("start-sharing", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const p = getRoom(roomId).get(socket.id);
    if (p) p.isSharing = true;
    broadcastPlayers(roomId);
    socket.to(roomId).emit("peer-started-sharing", { peerId: socket.id });
  });

  socket.on("stop-sharing", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const p = getRoom(roomId).get(socket.id);
    if (p) p.isSharing = false;
    broadcastPlayers(roomId);
    socket.to(roomId).emit("peer-stopped-sharing", { peerId: socket.id });
  });

  socket.on("request-stream", ({ fromPeerId }) => {
    io.to(fromPeerId).emit("stream-requested", { requesterId: socket.id });
  });

  socket.on("webrtc-offer", ({ to, description }) => io.to(to).emit("webrtc-offer", { from: socket.id, description }));
  socket.on("webrtc-answer", ({ to, description }) => io.to(to).emit("webrtc-answer", { from: socket.id, description }));
  socket.on("webrtc-ice", ({ to, candidate }) => io.to(to).emit("webrtc-ice", { from: socket.id, candidate }));

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    room.delete(socket.id);
    socket.to(roomId).emit("peer-left", { peerId: socket.id });
    if (room.size === 0) rooms.delete(roomId);
    else broadcastPlayers(roomId);
  });
});

server.listen(PORT, () => console.log(`Soullocke WebRTC server running on port ${PORT}`));
