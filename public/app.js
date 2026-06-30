
const APP_VERSION = "v8.4-sprites";
const socket = io();

const roomInput = document.querySelector("#roomInput");
const nameInput = document.querySelector("#nameInput");
const qualitySelect = document.querySelector("#qualitySelect");
const joinBtn = document.querySelector("#joinBtn");
const shareBtn = document.querySelector("#shareBtn");
const stopBtn = document.querySelector("#stopBtn");
const statusEl = document.querySelector("#status");
const grid = document.querySelector("#grid");
const tileTemplate = document.querySelector("#tileTemplate");
const teamEditorTemplate = document.querySelector("#teamEditorTemplate");
const pokemonSuggestions = document.querySelector("#pokemonSuggestions");

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
const frameCounters = new Map();
const lastStats = new Map();
const teams = new Map();

const POKEMON_MAP = {
  "bisasam":1,"bulbasaur":1,"bisaknosp":2,"ivysaur":2,"bisaflor":3,"venusaur":3,
  "glumanda":4,"charmander":4,"glutexo":5,"charmeleon":5,"glurak":6,"charizard":6,
  "schiggy":7,"squirtle":7,"schillok":8,"wartortle":8,"turtok":9,"blastoise":9,
  "raupy":10,"caterpie":10,"safcon":11,"metapod":11,"smettbo":12,"butterfree":12,
  "hornliu":13,"weedle":13,"kokuna":14,"kakuna":14,"bibor":15,"beedrill":15,
  "taubsi":16,"pidgey":16,"tauboga":17,"pidgeotto":17,"tauboss":18,"pidgeot":18,
  "rattfratz":19,"rattata":19,"rattikarl":20,"raticate":20,"habitak":21,"spearow":21,
  "ibitak":22,"fearow":22,"rettan":23,"ekans":23,"arbok":24,"pikachu":25,"raichu":26,
  "sandan":27,"sandshrew":27,"sandamer":28,"sandslash":28,"nidoran-f":29,"nidoran♀":29,
  "nidorina":30,"nidoqueen":31,"nidoran-m":32,"nidoran♂":32,"nidorino":33,"nidoking":34,
  "piepi":35,"clefairy":35,"pixi":36,"clefable":36,"vulpix":37,"vulnona":38,"ninetales":38,
  "pummeluff":39,"jigglypuff":39,"knuddeluff":40,"wigglytuff":40,"zubat":41,"golbat":42,
  "myrapla":43,"oddish":43,"duflor":44,"gloom":44,"giflor":45,"vileplume":45,
  "paras":46,"parasek":47,"parasect":47,"bluzuk":48,"venonat":48,"omot":49,"venomoth":49,
  "digda":50,"diglett":50,"digdri":51,"dugtrio":51,"mauzi":52,"meowth":52,
  "snobilikat":53,"persian":53,"enton":54,"psyduck":54,"entoron":55,"golduck":55,
  "menki":56,"mankey":56,"rasaff":57,"primeape":57,"fukano":58,"growlithe":58,
  "arkani":59,"arcanine":59,"quapsel":60,"poliwag":60,"quaputzi":61,"poliwhirl":61,
  "quappo":62,"poliwrath":62,"abra":63,"kadabra":64,"simsala":65,"alakazam":65,
  "machollo":66,"machop":66,"maschock":67,"machoke":67,"machomei":68,"machamp":68,
  "knofensa":69,"bellsprout":69,"ultrigaria":70,"weepinbell":70,"sarzenia":71,"victreebel":71,
  "tentacha":72,"tentacool":72,"tentoxa":73,"tentacruel":73,"kleinstein":74,"geodude":74,
  "georok":75,"graveler":75,"geowaz":76,"golem":76,"ponita":77,"ponyta":77,"gallopa":78,"rapidash":78,
  "flegmon":79,"slowpoke":79,"lahmus":80,"slowbro":80,"magnetilo":81,"magnemite":81,"magneton":82,
  "porenta":83,"farfetchd":83,"dodu":84,"doduo":84,"dodri":85,"dodrio":85,"jurob":86,"seel":86,
  "jugong":87,"dewgong":87,"sleima":88,"grimer":88,"sleimok":89,"muk":89,"muschas":90,"shellder":90,
  "austos":91,"cloyster":91,"nebulak":92,"gastly":92,"alpollo":93,"haunter":93,"gengar":94,
  "onix":95,"traumato":96,"drowzee":96,"hypno":97,"krabby":98,"kingler":99,
  "voltobal":100,"voltorb":100,"lektrobal":101,"electrode":101,"owei":102,"exeggcute":102,
  "kokowei":103,"exeggutor":103,"tragosso":104,"cubone":104,"knogga":105,"marowak":105,
  "kicklee":106,"hitmonlee":106,"nockchan":107,"hitmonchan":107,"schlurp":108,"lickitung":108,
  "smogon":109,"koffing":109,"smogmog":110,"weezing":110,"rihorn":111,"rhyhorn":111,
  "rizeros":112,"rhydon":112,"chaneira":113,"chansey":113,"tangela":114,
  "kangama":115,"kangaskhan":115,"seeper":116,"horsea":116,"seemon":117,"seadra":117,
  "goldini":118,"goldeen":118,"golking":119,"seaking":119,"sterndu":120,"staryu":120,
  "starmie":121,"pantimos":122,"mr-mime":122,"sichlor":123,"scyther":123,"rossana":124,"jynx":124,
  "elektek":125,"electabuzz":125,"magmar":126,"pinsir":127,"tauros":128,
  "karpador":129,"magikarp":129,"garados":130,"gyarados":130,"lapras":131,"ditto":132,
  "evoli":133,"eevee":133,"aquana":134,"vaporeon":134,"blitza":135,"jolteon":135,"flamara":136,"flareon":136,
  "relaxo":143,"snorlax":143,"dratini":147,"dragonir":148,"dragonair":148,"dragoran":149,"dragonite":149,
  "mewtu":150,"mewtwo":150,"mew":151
};

function setupPokemonSuggestions() {
  if (!pokemonSuggestions) return;
  pokemonSuggestions.innerHTML = Object.keys(POKEMON_MAP)
    .sort((a, b) => a.localeCompare(b))
    .map(name => `<option value="${name}"></option>`)
    .join("");
}


const qualityProfiles = {
  low: {
    label: "480p / 20 FPS",
    capture: { width: 854, height: 480, fps: 20 },
    sender: { maxBitrate: 900000, maxFramerate: 20, scaleResolutionDownBy: 1.0 }
  },
  medium: {
    label: "720p / 30 FPS",
    capture: { width: 1280, height: 720, fps: 30 },
    sender: { maxBitrate: 2500000, maxFramerate: 30, scaleResolutionDownBy: 1.0 }
  },
  high: {
    label: "1080p / 60 FPS",
    capture: { width: 1920, height: 1080, fps: 60 },
    sender: { maxBitrate: 6000000, maxFramerate: 60, scaleResolutionDownBy: 1.0 }
  }
};

const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

function setStatus(text) { statusEl.textContent = text; }
function getProfile() { return qualityProfiles[qualitySelect.value] || qualityProfiles.medium; }

function setDebug(id, patch) {
  debugState.set(id, { ...(debugState.get(id) || {}), ...patch });
  renderDebug(id);
}

function formatMbps(value) {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(2)} Mbps`;
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
    `fps: ${s.fps || "-"}`,
    `bitrate: ${s.bitrate || "-"}`,
    `rtt: ${s.rtt || "-"}`,
    `jitter: ${s.jitter || "-"}`,
    `packetsLost: ${s.packetsLost ?? "-"}`,
    `framesDropped: ${s.framesDropped ?? "-"}`,
    `quality: ${s.quality || "-"}`
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
  renderSpriteBar(id);
  renderDebug(id);
  return tiles.get(id);
}

function toggleFocus(tile) {
  const isFocused = tile.classList.contains("focused");
  document.body.classList.toggle("focus", !isFocused);
  for (const t of document.querySelectorAll(".tile")) t.classList.remove("focused");
  if (!isFocused) tile.classList.add("focused");
}


function emptyTeam() {
  return Array.from({ length: 6 }, () => ({ pokemon: "", status: "alive" }));
}

function getTeam(playerId) {
  return teams.get(playerId) || emptyTeam();
}

function normalizePokemonName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll(".", "")
    .replaceAll("♀", "-f")
    .replaceAll("♂", "-m");
}

function spriteUrl(name) {
  const normalized = normalizePokemonName(name);
  const id = POKEMON_MAP[normalized];

  if (id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  if (!normalized) return "";
  return `https://img.pokemondb.net/sprites/home/normal/${normalized}.png`;
}

function tinySpriteUrl(name) {
  return spriteUrl(name);
}

function renderSpriteBar(playerId) {
  const data = tiles.get(playerId);
  if (!data) return;

  let bar = data.tile.querySelector(".spriteTeamBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "spriteTeamBar";
    data.tile.appendChild(bar);
  }

  const team = getTeam(playerId);
  const editable = playerId === myId && joined;

  bar.innerHTML = "";

  team.forEach((pokemon, index) => {
    const slot = document.createElement("div");
    slot.className = `spriteSlot ${pokemon.pokemon ? "" : "empty"} ${pokemon.status || "alive"} ${editable ? "editable" : ""}`;
    slot.title = pokemon.pokemon ? `${pokemon.pokemon} (${pokemon.status || "alive"})` : "Leerer Slot";

    if (pokemon.pokemon) {
      const img = document.createElement("img");
      img.src = tinySpriteUrl(pokemon.pokemon);
      img.alt = pokemon.pokemon;
      img.onerror = () => {
        img.src = spriteUrl(pokemon.pokemon);
      };
      slot.appendChild(img);
    }

    if (editable) slot.addEventListener("click", () => openSpriteEditor());
    bar.appendChild(slot);
  });

  if (editable) {
    const edit = document.createElement("button");
    edit.className = "spriteEditButton";
    edit.type = "button";
    edit.textContent = "✎";
    edit.title = "Team bearbeiten";
    edit.addEventListener("click", openSpriteEditor);
    bar.appendChild(edit);
  }
}

function renderAllSpriteBars() {
  for (const id of tiles.keys()) renderSpriteBar(id);
}

function openSpriteEditor() {
  console.log("openSpriteEditor clicked", { myId, joined });
  let existing = document.querySelector(".spriteEditor");
  if (existing) existing.remove();

  let editor;
  if (teamEditorTemplate && teamEditorTemplate.content) {
    const node = teamEditorTemplate.content.cloneNode(true);
    editor = node.querySelector(".spriteEditor");
  } else {
    editor = document.createElement("div");
    editor.className = "spriteEditor";
    editor.innerHTML = `
      <div class="spriteEditorHeader">
        <strong>Team bearbeiten</strong>
        <button class="closeSpriteEditor" type="button">×</button>
      </div>
      <div class="spriteEditorSlots"></div>
      <div class="spriteEditorActions">
        <button class="clearSpriteTeam" type="button">Team leeren</button>
        <button class="saveSpriteTeam" type="button">Speichern</button>
      </div>
    `;
  }

  const slots = editor.querySelector(".spriteEditorSlots");
  const team = getTeam(myId);

  team.forEach((pokemon, index) => {
    const row = document.createElement("div");
    row.className = "spriteEditorRow";
    row.dataset.index = String(index);

    const preview = document.createElement("img");
    preview.alt = "";
    preview.src = pokemon.pokemon ? tinySpriteUrl(pokemon.pokemon) : "";
    preview.style.visibility = pokemon.pokemon ? "visible" : "hidden";

    const input = document.createElement("input");
    input.className = "pokemonNameInput";
    input.placeholder = "z.B. glumanda";
    input.setAttribute("list", "pokemonSuggestions");
    input.value = pokemon.pokemon || "";

    const status = document.createElement("select");
    status.className = "pokemonStatusInput";
    status.innerHTML = `
      <option value="alive">Lebendig</option>
      <option value="dead">Tot</option>
      <option value="box">Box</option>
    `;
    status.value = pokemon.status || "alive";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.textContent = "×";
    clear.title = "Slot leeren";

    input.addEventListener("input", () => {
      const value = normalizePokemonName(input.value);
      if (value) {
        preview.src = tinySpriteUrl(value);
        preview.style.visibility = "visible";
      } else {
        preview.style.visibility = "hidden";
      }
    });

    clear.addEventListener("click", () => {
      input.value = "";
      status.value = "alive";
      preview.style.visibility = "hidden";
    });

    row.append(preview, input, status, clear);
    slots.appendChild(row);
  });

  editor.querySelector(".closeSpriteEditor").addEventListener("click", () => editor.remove());
  editor.querySelector(".clearSpriteTeam").addEventListener("click", () => {
    const next = emptyTeam();
    teams.set(myId, next);
    socket.emit("update-team", { team: next });
    renderAllSpriteBars();
    editor.remove();
  });
  editor.querySelector(".saveSpriteTeam").addEventListener("click", () => {
    const next = [...editor.querySelectorAll(".spriteEditorRow")].map(row => ({
      pokemon: normalizePokemonName(row.querySelector(".pokemonNameInput").value),
      status: row.querySelector(".pokemonStatusInput").value
    }));
    teams.set(myId, next);
    socket.emit("update-team", { team: next });
    renderAllSpriteBars();
    editor.remove();
  });

  document.body.appendChild(editor);
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

function startFpsCounter(playerId) {
  const data = tiles.get(playerId);
  if (!data || !data.video) return;

  const counter = { frames: 0, lastTime: performance.now(), running: true };
  frameCounters.set(playerId, counter);

  const callback = () => {
    if (!counter.running) return;
    counter.frames += 1;
    const now = performance.now();
    const diff = now - counter.lastTime;
    if (diff >= 1000) {
      const fps = counter.frames * 1000 / diff;
      counter.frames = 0;
      counter.lastTime = now;
      setDebug(playerId, { fps: fps.toFixed(1) });
    }
    if (data.video.requestVideoFrameCallback) data.video.requestVideoFrameCallback(callback);
    else requestAnimationFrame(callback);
  };

  if (data.video.requestVideoFrameCallback) data.video.requestVideoFrameCallback(callback);
  else requestAnimationFrame(callback);
}

function stopFpsCounter(playerId) {
  const c = frameCounters.get(playerId);
  if (c) c.running = false;
  frameCounters.delete(playerId);
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

  stopFpsCounter(playerId);
  startFpsCounter(playerId);
  resumeVideo(playerId);
  renderDebug(playerId);
}

function clearStreamFromTile(playerId) {
  activeStreams.delete(playerId);
  stopFpsCounter(playerId);
  const data = tiles.get(playerId);
  if (!data) return;
  data.video.srcObject = null;
  data.tile.classList.remove("has-video", "needs-play");
  renderDebug(playerId);
}

async function applySenderQuality(peerId) {
  const item = peers.get(peerId);
  if (!item) return;
  const profile = getProfile();

  for (const sender of item.pc.getSenders()) {
    if (!sender.track || sender.track.kind !== "video") continue;
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
    params.encodings[0].maxBitrate = profile.sender.maxBitrate;
    params.encodings[0].maxFramerate = profile.sender.maxFramerate;
    params.encodings[0].scaleResolutionDownBy = profile.sender.scaleResolutionDownBy;

    try {
      await sender.setParameters(params);
      setDebug(peerId, { quality: profile.label });
    } catch (err) {
      console.warn("setParameters failed", err);
      setDebug(peerId, { quality: `${profile.label} setParameters failed` });
    }
  }
}

function addLocalTracks(peerId) {
  const item = peers.get(peerId);
  if (!item || !localStream) return;
  const senders = item.pc.getSenders();
  for (const track of localStream.getTracks()) {
    if (!senders.some(sender => sender.track === track)) item.pc.addTrack(track, localStream);
  }
  applySenderQuality(peerId);
}

function ensurePeer(peerId) {
  if (peerId === myId) return null;
  if (peers.has(peerId)) return peers.get(peerId);

  const pc = new RTCPeerConnection(iceConfig);
  const item = { pc, makingOffer: false, ignoreOffer: false, polite: myId > peerId };
  peers.set(peerId, item);

  setDebug(peerId, { peer: "created", ice: pc.iceConnectionState, signal: pc.signalingState, quality: getProfile().label });

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
  for (const p of players.values()) if (p.id !== myId) ensurePeer(p.id);
}

async function startSharing() {
  const profile = getProfile();
  localStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: profile.capture.width },
      height: { ideal: profile.capture.height },
      frameRate: { ideal: profile.capture.fps, max: profile.capture.fps }
    },
    audio: false
  });

  setDebug(myId, { quality: `${profile.label} local` });
  attachStreamToTile(myId, localStream);

  shareBtn.disabled = true;
  stopBtn.disabled = false;

  ensureAllPeers();
  for (const p of players.values()) if (p.id !== myId) addLocalTracks(p.id);

  socket.emit("start-sharing");
  socket.emit("quality-changed", { quality: profile.label });

  localStream.getVideoTracks()[0].addEventListener("ended", stopSharing);
  setStatus(`${APP_VERSION}: Spiel wird geteilt mit ${profile.label}.`);
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

async function applyQualityToAllSenders() {
  const profile = getProfile();
  localStorage.setItem("soullockeQuality", qualitySelect.value);

  for (const peerId of peers.keys()) await applySenderQuality(peerId);
  socket.emit("quality-changed", { quality: profile.label });

  if (localStream) setStatus(`${APP_VERSION}: Upload auf ${profile.label}. Für Capture-Auflösung Stream neu starten.`);
  else setStatus(`${APP_VERSION}: Qualität gewählt: ${profile.label}.`);
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
qualitySelect.addEventListener("change", applyQualityToAllSenders);

document.body.addEventListener("click", (event) => {
  for (const id of activeStreams.keys()) resumeVideo(id);

  const target = event.target;
  if (target.closest && target.closest(".spriteEditButton")) {
    event.preventDefault();
    event.stopPropagation();
    openSpriteEditor();
  }

  const slot = target.closest && target.closest(".spriteSlot.editable");
  if (slot) {
    event.preventDefault();
    event.stopPropagation();
    openSpriteEditor();
  }
});

socket.on("connect", () => setStatus(`${APP_VERSION}: Socket verbunden.`));
socket.on("disconnect", () => setStatus(`${APP_VERSION}: Socket getrennt.`));

socket.on("joined", data => {
  joined = true;
  myId = data.myId;
  roomId = data.roomId;
  players.clear();
  for (const p of data.players) players.set(p.id, p);
  teams.clear();
  if (data.teams) for (const [id, team] of Object.entries(data.teams)) teams.set(id, team);

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
  renderAllSpriteBars();
  ensureAllPeers();
});

socket.on("teams", data => {
  teams.clear();
  if (data) for (const [id, team] of Object.entries(data)) teams.set(id, team);
  renderAllSpriteBars();
});

socket.on("peer-stopped-sharing", ({ peerId }) => clearStreamFromTile(peerId));
socket.on("peer-quality-changed", ({ peerId, quality }) => setDebug(peerId, { quality }));

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
  try { await item.pc.addIceCandidate(candidate); }
  catch (err) { if (!item.ignoreOffer) console.warn("ICE failed", err); }
});

socket.on("peer-left", ({ peerId }) => {
  const item = peers.get(peerId);
  if (item) item.pc.close();
  peers.delete(peerId);
  players.delete(peerId);
  clearStreamFromTile(peerId);
  rebuildTiles();
});

async function collectStats() {
  for (const [peerId, item] of peers) {
    try {
      const stats = await item.pc.getStats();
      const prev = lastStats.get(peerId) || {};
      const patch = {};

      stats.forEach(report => {
        if (report.type === "candidate-pair" && report.state === "succeeded" && report.nominated) {
          if (typeof report.currentRoundTripTime === "number") patch.rtt = `${Math.round(report.currentRoundTripTime * 1000)} ms`;
        }

        if (report.type === "inbound-rtp" && report.kind === "video") {
          const key = `in-${report.id}`;
          const old = prev[key];
          if (old && report.timestamp > old.timestamp) {
            const bits = (report.bytesReceived - old.bytesReceived) * 8;
            const seconds = (report.timestamp - old.timestamp) / 1000;
            patch.bitrate = formatMbps(bits / seconds / 1000000);
          }
          prev[key] = { timestamp: report.timestamp, bytesReceived: report.bytesReceived };
          patch.packetsLost = report.packetsLost ?? patch.packetsLost;
          patch.framesDropped = report.framesDropped ?? patch.framesDropped;
          if (typeof report.jitter === "number") patch.jitter = `${Math.round(report.jitter * 1000)} ms`;
        }

        if (report.type === "outbound-rtp" && report.kind === "video") {
          const key = `out-${report.id}`;
          const old = prev[key];
          if (old && report.timestamp > old.timestamp) {
            const bits = (report.bytesSent - old.bytesSent) * 8;
            const seconds = (report.timestamp - old.timestamp) / 1000;
            patch.bitrate = formatMbps(bits / seconds / 1000000);
          }
          prev[key] = { timestamp: report.timestamp, bytesSent: report.bytesSent };
        }
      });

      lastStats.set(peerId, prev);
      setDebug(peerId, patch);
    } catch (err) {
      console.warn("getStats failed", err);
    }
  }

  for (const id of tiles.keys()) renderDebug(id);
}

setInterval(collectStats, 1000);

const roomFromUrl = getRoomFromUrl();
if (roomFromUrl) roomInput.value = roomFromUrl;
nameInput.value = localStorage.getItem("soullockeName") || "";
qualitySelect.value = localStorage.getItem("soullockeQuality") || "medium";
setupPokemonSuggestions();
rebuildTiles();
