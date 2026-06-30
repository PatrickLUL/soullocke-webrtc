const socket = io();

const roomInput = document.querySelector("#roomInput");
const nameInput = document.querySelector("#nameInput");
const joinBtn = document.querySelector("#joinBtn");
const shareBtn = document.querySelector("#shareBtn");
const statusEl = document.querySelector("#status");
const grid = document.querySelector("#grid");
const tileTemplate = document.querySelector("#tileTemplate");

let roomId = "";
let myId = "";
let myName = "";
let localStream = null;

const players = new Map();
const peers = new Map();
const tiles = new Map();

function setStatus(text) {
  statusEl.textContent = text;
}

function getRoomFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "room" && parts[1]) return parts[1];
  return "";
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createTile(playerId, labelText) {
  if (tiles.has(playerId)) return tiles.get(playerId);

  const node = tileTemplate.content.cloneNode(true);
  const tile = node.querySelector(".tile");
  const label = node.querySelector(".label");
  const video = node.querySelector("video");

  label.textContent = labelText;
  grid.appendChild(tile);

  const tileData = { tile, label, video };
  tiles.set(playerId, tileData);
  return tileData;
}

function ensureFourTiles() {
  while (grid.children.length < 4) {
    const id = "empty-" + grid.children.length;
    createTile(id, "Leer");
  }
}

function setVideo(playerId, stream) {
  const player = players.get(playerId);
  const name = playerId === myId ? `${myName} (ich)` : (player?.name || "Mitspieler");
  const { tile, label, video } = createTile(playerId, name);
  label.textContent = name;
  video.srcObject = stream;
  tile.classList.add("has-video");
}

function clearPlayer(playerId) {
  const data = tiles.get(playerId);
  if (data) {
    data.video.srcObject = null;
    data.tile.remove();
    tiles.delete(playerId);
  }

  const peer = peers.get(playerId);
  if (peer) {
    peer.destroy();
    peers.delete(playerId);
  }

  players.delete(playerId);
  renderTiles();
}

function renderTiles() {
  grid.innerHTML = "";
  tiles.clear();

  const orderedPlayers = [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt);

  for (const player of orderedPlayers) {
    const label = player.id === myId ? `${player.name} (ich)` : player.name;
    createTile(player.id, label);
  }

  ensureFourTiles();

  if (localStream) setVideo(myId, localStream);
}

async function startShare() {
  localStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 20, max: 30 }
    },
    audio: false
  });

  setVideo(myId, localStream);
  socket.emit("stream-started");

  for (const player of players.values()) {
    if (player.id !== myId) createPeer(player.id, true);
  }

  localStream.getVideoTracks()[0].addEventListener("ended", () => {
    setStatus("Bildschirmfreigabe beendet.");
  });
}

function createPeer(peerId, initiator) {
  if (peerId === myId) return null;
  if (peers.has(peerId)) return peers.get(peerId);

  const peer = new SimplePeer({
    initiator,
    trickle: true,
    stream: localStream || undefined,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
      ]
    }
  });

  peer.on("signal", signal => {
    socket.emit("signal", { to: peerId, signal });
  });

  peer.on("stream", stream => {
    setVideo(peerId, stream);
  });

  peer.on("close", () => {
    peers.delete(peerId);
  });

  peer.on("error", err => {
    console.warn("Peer error", peerId, err.message);
  });

  peers.set(peerId, peer);
  return peer;
}

joinBtn.addEventListener("click", () => {
  roomId = roomInput.value.trim() || randomRoomCode();
  myName = nameInput.value.trim() || "Spieler";

  if (!window.location.pathname.startsWith("/room/")) {
    history.replaceState(null, "", `/room/${encodeURIComponent(roomId)}`);
  }

  socket.emit("join-room", { roomId, name: myName });
});

shareBtn.addEventListener("click", async () => {
  try {
    await startShare();
    setStatus("Spiel wird geteilt. Deine Freunde sehen dich, sobald sie im Raum sind.");
  } catch (error) {
    console.error(error);
    setStatus("Bildschirmfreigabe abgebrochen.");
  }
});

socket.on("room-joined", data => {
  myId = data.myId;
  players.clear();

  for (const player of data.players) {
    players.set(player.id, player);
  }

  renderTiles();

  joinBtn.disabled = true;
  shareBtn.disabled = false;

  const shareUrl = `${window.location.origin}/room/${encodeURIComponent(roomId)}`;
  setStatus(`Verbunden. Link für Freunde: ${shareUrl}`);
});

socket.on("room-full", () => {
  setStatus("Der Raum ist voll. Maximal 4 Spieler.");
});

socket.on("player-joined", player => {
  players.set(player.id, player);
  renderTiles();

  if (localStream) createPeer(player.id, true);
});

socket.on("player-left", ({ id }) => {
  clearPlayer(id);
  setStatus("Ein Spieler hat den Raum verlassen.");
});

socket.on("player-stream-started", ({ id }) => {
  if (id !== myId) createPeer(id, false);
});

socket.on("signal", ({ from, signal }) => {
  if (!players.has(from)) {
    players.set(from, { id: from, name: "Mitspieler", joinedAt: Date.now() });
    renderTiles();
  }

  const peer = createPeer(from, false);
  peer.signal(signal);
});

const roomFromUrl = getRoomFromUrl();
if (roomFromUrl) {
  roomInput.value = roomFromUrl;
}
nameInput.value = localStorage.getItem("soullockeName") || "";
nameInput.addEventListener("input", () => {
  localStorage.setItem("soullockeName", nameInput.value);
});

ensureFourTiles();
