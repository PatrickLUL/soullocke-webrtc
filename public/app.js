
const APP_VERSION = "v8.2-sprites";
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



const POKEMON_DB = [
  { id: 1, names: ["bulbasaur", "bisasam"] },
  { id: 2, names: ["ivysaur", "bisaknosp"] },
  { id: 3, names: ["venusaur", "bisaflor"] },
  { id: 4, names: ["charmander", "glumanda"] },
  { id: 5, names: ["charmeleon", "glutexo"] },
  { id: 6, names: ["charizard", "glurak"] },
  { id: 7, names: ["squirtle", "schiggy"] },
  { id: 8, names: ["wartortle", "schillok"] },
  { id: 9, names: ["blastoise", "turtok"] },
  { id: 10, names: ["caterpie", "raupy"] },
  { id: 11, names: ["metapod", "safcon"] },
  { id: 12, names: ["butterfree", "smettbo"] },
  { id: 13, names: ["weedle", "hornliu"] },
  { id: 14, names: ["kakuna", "kokuna"] },
  { id: 15, names: ["beedrill", "bibor"] },
  { id: 16, names: ["pidgey", "taubsi"] },
  { id: 17, names: ["pidgeotto", "tauboga"] },
  { id: 18, names: ["pidgeot", "tauboss"] },
  { id: 19, names: ["rattata", "rattfratz"] },
  { id: 20, names: ["raticate", "rattikarl"] },
  { id: 21, names: ["spearow", "habitak"] },
  { id: 22, names: ["fearow", "ibitak"] },
  { id: 23, names: ["ekans", "rettan"] },
  { id: 24, names: ["arbok", "arbok"] },
  { id: 25, names: ["pikachu", "pikachu"] },
  { id: 26, names: ["raichu", "raichu"] },
  { id: 27, names: ["sandshrew", "sandan"] },
  { id: 28, names: ["sandslash", "sandamer"] },
  { id: 29, names: ["nidoran-f", "nidoran♀", "nidoran weiblich"] },
  { id: 30, names: ["nidorina", "nidorina"] },
  { id: 31, names: ["nidoqueen", "nidoqueen"] },
  { id: 32, names: ["nidoran-m", "nidoran♂", "nidoran männlich"] },
  { id: 33, names: ["nidorino", "nidorino"] },
  { id: 34, names: ["nidoking", "nidoking"] },
  { id: 35, names: ["clefairy", "piepi"] },
  { id: 36, names: ["clefable", "pixi"] },
  { id: 37, names: ["vulpix", "vulpix"] },
  { id: 38, names: ["ninetales", "vulnona"] },
  { id: 39, names: ["jigglypuff", "pummeluff"] },
  { id: 40, names: ["wigglytuff", "knuddeluff"] },
  { id: 41, names: ["zubat", "zubat"] },
  { id: 42, names: ["golbat", "golbat"] },
  { id: 43, names: ["oddish", "myrapla"] },
  { id: 44, names: ["gloom", "duflor"] },
  { id: 45, names: ["vileplume", "giflor"] },
  { id: 46, names: ["paras", "paras"] },
  { id: 47, names: ["parasect", "parasek"] },
  { id: 48, names: ["venonat", "bluzuk"] },
  { id: 49, names: ["venomoth", "omot"] },
  { id: 50, names: ["diglett", "digda"] },
  { id: 51, names: ["dugtrio", "digdri"] },
  { id: 52, names: ["meowth", "mauzi"] },
  { id: 53, names: ["persian", "snobilikat"] },
  { id: 54, names: ["psyduck", "enton"] },
  { id: 55, names: ["golduck", "entoron"] },
  { id: 56, names: ["mankey", "menki"] },
  { id: 57, names: ["primeape", "rasaff"] },
  { id: 58, names: ["growlithe", "fukano"] },
  { id: 59, names: ["arcanine", "arkani"] },
  { id: 60, names: ["poliwag", "quapsel"] },
  { id: 61, names: ["poliwhirl", "quaputzi"] },
  { id: 62, names: ["poliwrath", "quappo"] },
  { id: 63, names: ["abra", "abra"] },
  { id: 64, names: ["kadabra", "kadabra"] },
  { id: 65, names: ["alakazam", "simsala"] },
  { id: 66, names: ["machop", "machollo"] },
  { id: 67, names: ["machoke", "maschock"] },
  { id: 68, names: ["machamp", "machomei"] },
  { id: 69, names: ["bellsprout", "knofensa"] },
  { id: 70, names: ["weepinbell", "ultrigaria"] },
  { id: 71, names: ["victreebel", "sarzenia"] },
  { id: 72, names: ["tentacool", "tentacha"] },
  { id: 73, names: ["tentacruel", "tentoxa"] },
  { id: 74, names: ["geodude", "kleinstein"] },
  { id: 75, names: ["graveler", "georok"] },
  { id: 76, names: ["golem", "geowaz"] },
  { id: 77, names: ["ponyta", "ponita"] },
  { id: 78, names: ["rapidash", "gallopa"] },
  { id: 79, names: ["slowpoke", "flegmon"] },
  { id: 80, names: ["slowbro", "lahmus"] },
  { id: 81, names: ["magnemite", "magnetilo"] },
  { id: 82, names: ["magneton", "magneton"] },
  { id: 83, names: ["farfetchd", "porenta"] },
  { id: 84, names: ["doduo", "dodu"] },
  { id: 85, names: ["dodrio", "dodri"] },
  { id: 86, names: ["seel", "jurob"] },
  { id: 87, names: ["dewgong", "jugong"] },
  { id: 88, names: ["grimer", "sleima"] },
  { id: 89, names: ["muk", "sleimok"] },
  { id: 90, names: ["shellder", "muschas"] },
  { id: 91, names: ["cloyster", "austos"] },
  { id: 92, names: ["gastly", "nebulak"] },
  { id: 93, names: ["haunter", "alpollo"] },
  { id: 94, names: ["gengar", "gengar"] },
  { id: 95, names: ["onix", "onix"] },
  { id: 96, names: ["drowzee", "traumato"] },
  { id: 97, names: ["hypno", "hypno"] },
  { id: 98, names: ["krabby", "krabby"] },
  { id: 99, names: ["kingler", "kingler"] },
  { id: 100, names: ["voltorb", "voltobal"] },
  { id: 101, names: ["electrode", "lektrobal"] },
  { id: 102, names: ["exeggcute", "owei"] },
  { id: 103, names: ["exeggutor", "kokowei"] },
  { id: 104, names: ["cubone", "tragosso"] },
  { id: 105, names: ["marowak", "knogga"] },
  { id: 106, names: ["hitmonlee", "kicklee"] },
  { id: 107, names: ["hitmonchan", "nockchan"] },
  { id: 108, names: ["lickitung", "schlurp"] },
  { id: 109, names: ["koffing", "smogon"] },
  { id: 110, names: ["weezing", "smogmog"] },
  { id: 111, names: ["rhyhorn", "rihorn"] },
  { id: 112, names: ["rhydon", "rizeros"] },
  { id: 113, names: ["chansey", "chaneira"] },
  { id: 114, names: ["tangela", "tangela"] },
  { id: 115, names: ["kangaskhan", "kangama"] },
  { id: 116, names: ["horsea", "seeper"] },
  { id: 117, names: ["seadra", "seemon"] },
  { id: 118, names: ["goldeen", "goldini"] },
  { id: 119, names: ["seaking", "golking"] },
  { id: 120, names: ["staryu", "sterndu"] },
  { id: 121, names: ["starmie", "starmie"] },
  { id: 122, names: ["mr-mime", "pantimos"] },
  { id: 123, names: ["scyther", "sichlor"] },
  { id: 124, names: ["jynx", "rossana"] },
  { id: 125, names: ["electabuzz", "elektek"] },
  { id: 126, names: ["magmar", "magmar"] },
  { id: 127, names: ["pinsir", "pinsir"] },
  { id: 128, names: ["tauros", "tauros"] },
  { id: 129, names: ["magikarp", "karpador"] },
  { id: 130, names: ["gyarados", "garados"] },
  { id: 131, names: ["lapras", "lapras"] },
  { id: 132, names: ["ditto", "ditto"] },
  { id: 133, names: ["eevee", "evoli"] },
  { id: 134, names: ["vaporeon", "aquana"] },
  { id: 135, names: ["jolteon", "blitza"] },
  { id: 136, names: ["flareon", "flamara"] },
  { id: 143, names: ["snorlax", "relaxo"] },
  { id: 147, names: ["dratini", "dratini"] },
  { id: 148, names: ["dragonair", "dragonir"] },
  { id: 149, names: ["dragonite", "dragoran"] },
  { id: 150, names: ["mewtwo", "mewtu"] },
  { id: 151, names: ["mew", "mew"] }
];

const POKEMON_BY_NAME = new Map();
for (const entry of POKEMON_DB) {
  for (const name of entry.names) POKEMON_BY_NAME.set(normalizePokemonName(name), entry);
}

function setupPokemonSuggestions() {
  if (!pokemonSuggestions) return;
  const names = [];
  for (const entry of POKEMON_DB) {
    names.push(entry.names[1] || entry.names[0]);
    if (entry.names[0] !== entry.names[1]) names.push(entry.names[0]);
  }
  pokemonSuggestions.innerHTML = [...new Set(names)]
    .sort((a, b) => a.localeCompare(b))
    .map(name => `<option value="${name}"></option>`)
    .join("");
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

function getPokemonEntry(name) {
  const normalized = normalizePokemonName(name);
  return POKEMON_BY_NAME.get(normalized) || null;
}

function spriteUrl(name) {
  const entry = getPokemonEntry(name);
  if (entry) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png`;

  const normalized = normalizePokemonName(name);
  if (!normalized) return "";
  return `https://img.pokemondb.net/sprites/home/normal/${normalized}.png`;
}

function tinySpriteUrl(name) {
  return spriteUrl(name);
}.png`;
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
  setupPokemonSuggestions();
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
rebuildTiles();
