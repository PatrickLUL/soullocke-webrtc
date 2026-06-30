
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
const outgoingPeers = new Map();
const incomingPeers = new Map();
const pendingIce = new Map();
const activeStreams = new Map();

const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

function setStatus(text) { statusEl.textContent = text; }

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
  tiles.set(id, { tile, name, video, playOverlay });
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

  data.video.muted = true;
  data.video.defaultMuted = true;
  data.video.playsInline = true;

  try {
    await data.video.play();
    data.tile.classList.remove("needs-play");
    setStatus("Video gestartet.");
  } catch (e) {
    console.warn("manual play failed", e);
    setStatus("Video konnte noch nicht gestartet werden. Bitte einmal in die Kachel klicken.");
  }
}

function attachStreamToTile(playerId, stream) {
  activeStreams.set(playerId, stream);

  let data = tiles.get(playerId);
  if (!data) {
    const p = players.get(playerId);
    data = createTile(playerId, p?.name || "Mitspieler", true);
  }

  data.video.srcObject = stream;
  data.video.muted = true;
  data.video.defaultMuted = true;
  data.video.playsInline = true;
  data.tile.classList.add("has-video", "connected");

  data.video.onloadedmetadata = () => resumeVideo(playerId);
  data.video.oncanplay = () => resumeVideo(playerId);

  const promise = data.video.play();
  if (promise && promise.catch) {
    promise.catch(() => {
      data.tile.classList.add("needs-play");
      setStatus("Video empfangen. Klicke im schwarzen Feld auf „Video anzeigen“.");
    });
  }
}

function clearStreamFromTile(playerId) {
  activeStreams.delete(playerId);
  const data = tiles.get(playerId);
  if (!data) return;
  data.video.srcObject = null;
  data.tile.classList.remove("has-video", "needs-play");
}

function closePeer(map, peerId) {
  const pc = map.get(peerId);
  if (pc) pc.close();
  map.delete(peerId);
}

function addPendingIce(peerId, candidate) {
  if (!pendingIce.has(peerId)) pendingIce.set(peerId, []);
  pendingIce.get(peerId).push(candidate);
}

async function flushPendingIce(peerId, pc) {
  const list = pendingIce.get(peerId) || [];
  pendingIce.delete(peerId);
  for (const c of list) {
    try { await pc.addIceCandidate(c); } catch (e) { console.warn("queued ICE failed", e); }
  }
}

function createOutgoingPeer(viewerId) {
  closePeer(outgoingPeers, viewerId);
  const pc = new RTCPeerConnection(iceConfig);
  outgoingPeers.set(viewerId, pc);

  for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("webrtc-ice", { to: viewerId, candidate: e.candidate });
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "closed") closePeer(outgoingPeers, viewerId);
  };

  return pc;
}

function createIncomingPeer(streamerId) {
  closePeer(incomingPeers, streamerId);
  const pc = new RTCPeerConnection(iceConfig);
  incomingPeers.set(streamerId, pc);

  pc.ontrack = e => {
    const stream = e.streams[0] || new MediaStream([e.track]);
    attachStreamToTile(streamerId, stream);
  };

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("webrtc-ice", { to: streamerId, candidate: e.candidate });
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "connected") {
      const p = players.get(streamerId);
      setStatus(`Verbunden mit ${p?.name || "Mitspieler"}.`);
    }
    if (pc.connectionState === "failed" || pc.connectionState === "closed") {
      closePeer(incomingPeers, streamerId);
      clearStreamFromTile(streamerId);
    }
  };

  return pc;
}

async function offerStreamTo(viewerId) {
  if (!localStream || viewerId === myId) return;
  const pc = createOutgoingPeer(viewerId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("webrtc-offer", { to: viewerId, description: pc.localDescription });
}

function requestExistingStreams() {
  for (const p of players.values()) {
    if (p.id !== myId && p.isSharing) socket.emit("request-stream", { fromPeerId: p.id });
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

  socket.emit("start-sharing");

  for (const p of players.values()) {
    if (p.id !== myId) await offerStreamTo(p.id);
  }

  localStream.getVideoTracks()[0].addEventListener("ended", stopSharing);
  setStatus("Spiel wird geteilt.");
}

function stopSharing() {
  if (!localStream) return;
  for (const track of localStream.getTracks()) track.stop();
  localStream = null;
  for (const id of outgoingPeers.keys()) closePeer(outgoingPeers, id);
  clearStreamFromTile(myId);
  shareBtn.disabled = !joined;
  stopBtn.disabled = true;
  socket.emit("stop-sharing");
  setStatus("Stream gestoppt.");
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

socket.on("joined", data => {
  joined = true;
  myId = data.myId;
  roomId = data.roomId;
  players.clear();
  for (const p of data.players) players.set(p.id, p);

  joinBtn.disabled = true;
  shareBtn.disabled = false;
  rebuildTiles();

  setStatus(`Verbunden. Link für Freunde: ${location.origin}/room/${encodeURIComponent(roomId)}`);
  requestExistingStreams();
});

socket.on("join-error", setStatus);

socket.on("players", list => {
  players.clear();
  for (const p of list) players.set(p.id, p);
  rebuildTiles();
  requestExistingStreams();
});

socket.on("peer-started-sharing", ({ peerId }) => {
  if (peerId !== myId) socket.emit("request-stream", { fromPeerId: peerId });
});

socket.on("peer-stopped-sharing", ({ peerId }) => {
  closePeer(incomingPeers, peerId);
  clearStreamFromTile(peerId);
});

socket.on("stream-requested", async ({ requesterId }) => {
  if (localStream && requesterId !== myId) await offerStreamTo(requesterId);
});

socket.on("webrtc-offer", async ({ from, description }) => {
  const pc = createIncomingPeer(from);
  await pc.setRemoteDescription(description);
  await flushPendingIce(from, pc);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("webrtc-answer", { to: from, description: pc.localDescription });
});

socket.on("webrtc-answer", async ({ from, description }) => {
  const pc = outgoingPeers.get(from);
  if (!pc) return;
  await pc.setRemoteDescription(description);
  await flushPendingIce(from, pc);
});

socket.on("webrtc-ice", async ({ from, candidate }) => {
  const pc = incomingPeers.get(from) || outgoingPeers.get(from);
  if (!pc || !pc.remoteDescription) return addPendingIce(from, candidate);
  try { await pc.addIceCandidate(candidate); } catch (e) { console.warn("ICE failed", e); }
});

socket.on("peer-left", ({ peerId }) => {
  closePeer(incomingPeers, peerId);
  closePeer(outgoingPeers, peerId);
  players.delete(peerId);
  clearStreamFromTile(peerId);
  rebuildTiles();
});

const roomFromUrl = getRoomFromUrl();
if (roomFromUrl) roomInput.value = roomFromUrl;
nameInput.value = localStorage.getItem("soullockeName") || "";
rebuildTiles();
