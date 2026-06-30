
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

function defaultTeam() {
  return Array.from({ length: 6 }, () => ({
    pokemon: "",
    status: "alive"
  }));
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),
      teams: {},
      badges: {},
      game: "hgss"
    });
  }
  return rooms.get(roomId);
}

function playerList(roomId) {
  return [...getRoom(roomId).players.values()]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map(p => ({ id: p.id, name: p.name, joinedAt: p.joinedAt, isSharing: p.isSharing }));
}

function broadcastPlayers(roomId) {
  io.to(roomId).emit("players", playerList(roomId));
}

function broadcastTeams(roomId) {
  io.to(roomId).emit("teams", getRoom(roomId).teams);
}

function broadcastBadges(roomId) {
  io.to(roomId).emit("badges", getRoom(roomId).badges);
}

io.on("connection", socket => {
  socket.on("join-room", ({ roomId, name }) => {
    roomId = String(roomId || "").trim().slice(0, 40);
    name = String(name || "Spieler").trim().slice(0, 24);
    if (!roomId) return socket.emit("join-error", "Kein Raumcode angegeben.");

    const room = getRoom(roomId);
    if (!room.players.has(socket.id) && room.players.size >= MAX_PLAYERS) {
      return socket.emit("join-error", "Der Raum ist voll. Maximal 4 Spieler.");
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    room.players.set(socket.id, { id: socket.id, name, joinedAt: Date.now(), isSharing: false });
    if (!room.teams[socket.id]) room.teams[socket.id] = defaultTeam();
    if (typeof room.badges[socket.id] !== "number") room.badges[socket.id] = 0;

    socket.emit("joined", {
      myId: socket.id,
      roomId,
      players: playerList(roomId),
      teams: room.teams,
      badges: room.badges,
      game: room.game
    });
    broadcastPlayers(roomId);
    broadcastTeams(roomId);
    broadcastBadges(roomId);
  });

  socket.on("start-sharing", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const p = getRoom(roomId).players.get(socket.id);
    if (p) p.isSharing = true;
    broadcastPlayers(roomId);
  });

  socket.on("stop-sharing", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const p = getRoom(roomId).players.get(socket.id);
    if (p) p.isSharing = false;
    broadcastPlayers(roomId);
    socket.to(roomId).emit("peer-stopped-sharing", { peerId: socket.id });
  });

  socket.on("update-team", ({ team }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = getRoom(roomId);
    const safeTeam = Array.from({ length: 6 }, (_, i) => {
      const item = Array.isArray(team) ? (team[i] || {}) : {};
      return {
        pokemon: String(item.pokemon || "").trim().toLowerCase().slice(0, 32),
        status: ["alive", "dead", "box"].includes(item.status) ? item.status : "alive"
      };
    });

    room.teams[socket.id] = safeTeam;
    broadcastTeams(roomId);
  });

  socket.on("update-badges", ({ badges }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = getRoom(roomId);
    const safeBadges = Math.max(0, Math.min(16, Number.parseInt(badges, 10) || 0));
    room.badges[socket.id] = safeBadges;
    broadcastBadges(roomId);
  });

  socket.on("update-game", ({ game }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = getRoom(roomId);
    const allowedGames = ["hgss"];
    if (allowedGames.includes(game)) {
      room.game = game;
      io.to(roomId).emit("game-changed", { game: room.game });
    }
  });

  socket.on("quality-changed", ({ quality }) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit("peer-quality-changed", { peerId: socket.id, quality });
  });

  socket.on("webrtc-description", ({ to, description }) => io.to(to).emit("webrtc-description", { from: socket.id, description }));
  socket.on("webrtc-ice", ({ to, candidate }) => io.to(to).emit("webrtc-ice", { from: socket.id, candidate }));

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    room.players.delete(socket.id);
    socket.to(roomId).emit("peer-left", { peerId: socket.id });
    if (room.players.size === 0) rooms.delete(roomId);
    else {
      broadcastPlayers(roomId);
      broadcastTeams(roomId);
      broadcastBadges(roomId);
    }
  });
});

server.listen(PORT, () => console.log(`Soullocke WebRTC server running on port ${PORT}`));
