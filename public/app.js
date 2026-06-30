
const APP_VERSION = "v5-perfect";
const socket = io();

const roomInput = document.querySelector("#roomInput");
const nameInput = document.querySelector("#nameInput");
const joinBtn = document.querySelector("#joinBtn");
const shareBtn = document.querySelector("#shareBtn");
const stopBtn = document.querySelector("#stopBtn");
const statusEl = document.querySelector("#status");
const grid = document.querySelector("#grid");
const tileTemplate = document.querySelector("#tileTemplate");

let myId = "";
let roomId = "";
let myName = "";
let localStream = null;
let joined = false;

const players = new Map();
const tiles = new Map();
const peers = new Map();
const activeStreams = new Map();
const debugState = new Map();

const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

function setStatus(text) { statusEl.textContent = text; }

function setDebug(id, patch) {
  debugState.set(id, { ...(debugState.get(id) || {}), ...patch });
  renderDebug(id);
}

function renderDebug(id) {
  const data = tiles.get(id);
  if (!data) return;
  const s = debugState.get(id) || {};
  const v = data.video;
  data.debugBox.textContent = [
    APP_VERSION,
    `socket: ${socket.connected ? "connected" : "offline"}`,
    `peer: ${s.peer || "-"}`,
    `ice: ${s.ice || "-"}`,
    `signal: ${s.signal || "-"}`,
    `track: ${s.track || "-"}`,
    `video: ${v.videoWidth || 0}x${v.videoHeight || 0}`,
    `ready: ${v.readyState}`,
    `paused: ${v.paused}`
  ].join("\n");
}

function getRoomFromUrl() {
  const parts = location.pathname.split("/").filter(Boolean);
  return parts[0] === "room" && parts[1] ? decodeURIComponent(parts[1]) : "";
}

function randomRoomCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

function createTile(id, labelText, connected = false) {
  const clone = tileTemplate.content.cloneNode(true);
  const tile = clone.querySelector(".tile");
  const name = clone.querySelector(".name");
  const video = clone.querySelector("video");
  const fullscreenBtn = clone.querySelector(".fullscreenBtn");
  const playOverlay = clone.querySelector(".playOverlay");
  const debugBox = clone.querySelector(".debugBox");

  video.autoplay = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  tile.dataset.id = id;
  name.textContent = labelText;
  if (connected) tile.classList.add("connected");

  fullscreenBtn.addEventListener("click", () => toggleFocus(tile));
  video.addEventListener("dblclick", () => toggleFocus(tile));
  playOverlay.addEventListener("click", () => resumeVideo(id));

  grid.appendChild(tile);
  tiles.set(id, { tile, name, video, playOverlay, debugBox });
  renderDebug(id);
  return tiles.get(id);
}

function toggleFocus(tile) {
  const isFocused = tile.classList.contains("focused");
  document.body.classList.toggle("focus", !isFocused);
  for (const t of document.querySelectorAll(".tile")) t.classList.remove("focused");
  if (!isFocused) tile.classList.add("focused");
}

function rebuildTiles() {
  tiles.clear();
  grid.innerHTML = "";

  const ordered = [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  for (const player of ordered) {
    const label = player.id === myId ? `${player.name} (ich)` : player.name;
    createTile(player.id, label, true);
  }

  while (grid.children.length < 4) createTile(`empty-${grid.children.length}`, "Leer", false);

  for (const [id, stream] of activeStreams) attachStreamToTile(id, stream);
  if (localStream) attachStreamToTile(myId, localStream);
}

async function resumeVideo(playerId) {
  const data = tiles.get(playerId);
  if (!data || !data.video.srcObject) return;

  try {
    data.video.muted = true;
    data.video.defaultMuted = true;
    data.video.playsInline = true;
    await data.video.play();
    data.tile.classList.remove("needs-play");
  } catch {
    data.tile.classList.add("needs-play");
  }
  renderDebug(playerId);
}

function attachStreamToTile(playerId, stream) {
  activeStreams.set(playerId, stream);
  let data = tiles.get(playerId);
  if (!data) {
    const p = players.get(playerId);
    data = createTile(playerId, p?.name || "Mitspieler", true);
  }

  const track = stream.getVideoTracks()[0];
  if (track) {
    setDebug(playerId, { track: `${track.readyState}${track.muted ? " muted" : ""}` });
    track.onmute = () => setDebug(playerId, { track: `${track.readyState} muted` });
    track.onunmute = () => setDebug(playerId, { track: `${track.readyState} unmuted` });
    track.onended = () => setDebug(playerId, { track: "ended" });
  }

  data.video.srcObject = stream;
  data.tile.classList.add("has-video", "connected");
  data.video.onloadedmetadata = () => resumeVideo(playerId);
  data.video.oncanplay = () => resumeVideo(playerId);
  data.video.onresize = () => renderDebug(playerId);
  data.video.ontimeupdate = () => renderDebug(playerId);

  resumeVideo(playerId);
  renderDebug(playerId);
}

function clearStreamFromTile(playerId) {
  activeStreams.delete(playerId);
  const data = tiles.get(playerId);
  if (!data) return;
  data.video.srcObject = null;
  data.tile.classList.remove("has-video", "needs-play");
  renderDebug(playerId);
}

function addLocalTracks(peerId) {
  const item = peers.get(peerId);
  if (!item || !localStream) return;

  const senders = item.pc.getSenders();
  for (const track of localStream.getTracks()) {
    if (!senders.some(sender => sender.track === track)) {
      item.pc.addTrack(track, localStream);
    }
  }
}

function ensurePeer(peerId) {
  if (peerId === myId) return null;
  if (peers.has(peerId)) return peers.get(peerId);

  const pc = new RTCPeerConnection(iceConfig);
  const item = {
    pc,
    makingOffer: false,
    ignoreOffer: false,
    polite: myId > peerId
  };

  peers.set(peerId, item);
  setDebug(peerId, { peer: "created", ice: pc.iceConnectionState, signal: pc.signalingState });

  pc.ontrack = event => {
    const stream = event.streams[0] || new MediaStream([event.track]);
    attachStreamToTile(peerId, stream);
  };

  pc.onicecandidate = event => {
    if (event.candidate) socket.emit("webrtc-ice", { to: peerId, candidate: event.candidate });
  };

  pc.onconnectionstatechange = () => {
    setDebug(peerId, { peer: pc.connectionState });
    if (pc.connectionState === "connected") {
      const p = players.get(peerId);
      setStatus(`${APP_VERSION}: verbunden mit ${p?.name || "Mitspieler"}`);
    }
    if (pc.connectionState === "failed") restartIce(peerId);
  };

  pc.oniceconnectionstatechange = () => {
    setDebug(peerId, { ice: pc.iceConnectionState });
    if (pc.iceConnectionState === "failed") restartIce(peerId);
  };

  pc.onsignalingstatechange = () => setDebug(peerId, { signal: pc.signalingState });

  pc.onnegotiationneeded = async () => {
    try {
      item.makingOffer = true;
      await pc.setLocalDescription();
      socket.emit("webrtc-description", { to: peerId, description: pc.localDescription });
    } catch (err) {
      console.warn("negotiation failed", err);
    } finally {
      item.makingOffer = false;
    }
  };

  if (localStream) addLocalTracks(peerId);
  return item;
}

async function restartIce(peerId) {
  const item = peers.get(peerId);
  if (!item) return;
  try {
    item.pc.restartIce();
    await item.pc.setLocalDescription(await item.pc.createOffer({ iceRestart: true }));
    socket.emit("webrtc-description", { to: peerId, description: item.pc.localDescription });
  } catch (err) {
    console.warn("ICE restart failed", err);
  }
}

function ensureAllPeers() {
  for (const p of players.values()) {
    if (p.id !== myId) ensurePeer(p.id);
  }
}

async function startSharing() {
  localStream = await navigator.mediaDevices.getDisplayMedia({
    video: { width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 20, max: 30 } },
    audio: false
  });

  attachStreamToTile(myId, localStream);
  shareBtn.disabled = true;
  stopBtn.disabled = false;

  ensureAllPeers();
  for (const p of players.values()) {
    if (p.id !== myId) addLocalTracks(p.id);
  }

  socket.emit("start-sharing");
  localStream.getVideoTracks()[0].addEventListener("ended", stopSharing);
  setStatus(`${APP_VERSION}: Spiel wird geteilt.`);
}

function stopSharing() {
  if (!localStream) return;

  for (const track of localStream.getTracks()) track.stop();

  for (const item of peers.values()) {
    for (const sender of item.pc.getSenders()) {
      if (sender.track) item.pc.removeTrack(sender);
    }
  }

  localStream = null;
  clearStreamFromTile(myId);
  shareBtn.disabled = !joined;
  stopBtn.disabled = true;
  socket.emit("stop-sharing");
  setStatus(`${APP_VERSION}: Stream gestoppt.`);
}

function joinRoom() {
  roomId = roomInput.value.trim() || getRoomFromUrl() || randomRoomCode();
  myName = nameInput.value.trim() || "Spieler";
  localStorage.setItem("soullockeName", myName);
  history.replaceState(null, "", `/room/${encodeURIComponent(roomId)}`);
  socket.emit("join-room", { roomId, name: myName });
}

joinBtn.addEventListener("click", joinRoom);
shareBtn.addEventListener("click", async () => {
  try { await startSharing(); }
  catch (e) { console.error(e); setStatus("Bildschirmfreigabe abgebrochen oder blockiert."); }
});
stopBtn.addEventListener("click", stopSharing);

document.body.addEventListener("click", () => {
  for (const id of activeStreams.keys()) resumeVideo(id);
});

socket.on("connect", () => setStatus(`${APP_VERSION}: Socket verbunden.`));
socket.on("disconnect", () => setStatus(`${APP_VERSION}: Socket getrennt.`));

socket.on("joined", data => {
  joined = true;
  myId = data.myId;
  roomId = data.roomId;

  players.clear();
  for (const p of data.players) players.set(p.id, p);

  joinBtn.disabled = true;
  shareBtn.disabled = false;
  rebuildTiles();
  ensureAllPeers();

  setStatus(`${APP_VERSION}: Verbunden. Link: ${location.origin}/room/${encodeURIComponent(roomId)}`);
});

socket.on("join-error", setStatus);

socket.on("players", list => {
  players.clear();
  for (const p of list) players.set(p.id, p);
  rebuildTiles();
  ensureAllPeers();
});

socket.on("peer-stopped-sharing", ({ peerId }) => clearStreamFromTile(peerId));

socket.on("webrtc-description", async ({ from, description }) => {
  const item = ensurePeer(from);
  const pc = item.pc;

  try {
    const offerCollision = description.type === "offer" && (item.makingOffer || pc.signalingState !== "stable");
    item.ignoreOffer = !item.polite && offerCollision;
    if (item.ignoreOffer) return;

    if (offerCollision) {
      await Promise.all([
        pc.setLocalDescription({ type: "rollback" }),
        pc.setRemoteDescription(description)
      ]);
    } else {
      await pc.setRemoteDescription(description);
    }

    if (description.type === "offer") {
      if (localStream) addLocalTracks(from);
      await pc.setLocalDescription();
      socket.emit("webrtc-description", { to: from, description: pc.localDescription });
    }
  } catch (err) {
    console.warn("description failed", err);
    setDebug(from, { peer: "description-error" });
  }
});

socket.on("webrtc-ice", async ({ from, candidate }) => {
  const item = ensurePeer(from);
  try {
    await item.pc.addIceCandidate(candidate);
  } catch (err) {
    if (!item.ignoreOffer) console.warn("ICE failed", err);
  }
});

socket.on("peer-left", ({ peerId }) => {
  const item = peers.get(peerId);
  if (item) item.pc.close();
  peers.delete(peerId);
  players.delete(peerId);
  clearStreamFromTile(peerId);
  rebuildTiles();
});

setInterval(() => {
  for (const id of tiles.keys()) renderDebug(id);
}, 1000);

const roomFromUrl = getRoomFromUrl();
if (roomFromUrl) roomInput.value = roomFromUrl;
nameInput.value = localStorage.getItem("soullockeName") || "";
rebuildTiles();
