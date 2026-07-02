
const APP_VERSION = "v9.2-map-editor";
const socket = io();

const roomInput = document.querySelector("#roomInput");
const nameInput = document.querySelector("#nameInput");
const qualitySelect = document.querySelector("#qualitySelect");
const joinBtn = document.querySelector("#joinBtn");
const shareBtn = document.querySelector("#shareBtn");
const stopBtn = document.querySelector("#stopBtn");
const debugToggleBtn = document.querySelector("#debugToggleBtn");
const exportBtn = document.querySelector("#exportBtn");
const gameSelect = document.querySelector("#gameSelect");
const mapBtn = document.querySelector("#mapBtn");
const spotlightBtn = document.querySelector("#spotlightBtn");
const closeMapBtn = document.querySelector("#closeMapBtn");
const mapModal = document.querySelector("#mapModal");
const mapImageContainer = document.querySelector("#mapImageContainer");
const mapInfoPanel = document.querySelector("#mapInfoPanel");
const mapGameLabel = document.querySelector("#mapGameLabel");
const settingsBtn = document.querySelector("#settingsBtn");
const settingsPanel = document.querySelector("#settingsPanel");
const clearTeamBtn = document.querySelector("#clearTeamBtn");
const statusEl = document.querySelector("#status");
const grid = document.querySelector("#grid");
const tileTemplate = document.querySelector("#tileTemplate");
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
const badges = new Map();
let currentGame = "hgss";

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

// Quelle für Level-Caps: Nuzlocke University, "Hardcore Nuzlocke Level Caps by Generation"
// (https://nuzlockeuniversity.ca/2022/01/18/hardcore-nuzlocke-level-caps-by-generation/)
// Ace-Level des jeweiligen Gym-Leaders/Champs pro Orden. Kanto-Orden-Reihenfolge ist im
// Spiel nicht strikt vorgegeben, hier in der von Nuzlocke University gelisteten Reihenfolge.
const GAMES = {
  hgss: {
    label: "HeartGold / SoulSilver",
    badgeNames: [
      "Falkner – Violet City", "Bugsy – Azalea Town", "Whitney – Goldenrod City",
      "Morty – Ecruteak City", "Chuck – Cianwood City", "Jasmine – Olivine City",
      "Pryce – Mahogany Town", "Clair – Blackthorn City",
      "Brock – Pewter City", "Misty – Cerulean City", "Lt. Surge – Vermilion City",
      "Erika – Celadon City", "Janine – Fuchsia City", "Sabrina – Saffron City",
      "Blaine – Seafoam Islands", "Blue – Viridian City"
    ],
    badgeCaps: [13, 17, 19, 25, 31, 35, 34, 41, 54, 54, 53, 56, 50, 55, 59, 60],
    eliteFour: [42, 44, 46, 47],
    champion: { name: "Lance (Champion, nach Johto-Orden 8)", cap: 50 },
    postgame: { name: "Red – Mt. Silver", cap: 88 }
  }
};

function getGame(key) { return GAMES[key] || GAMES.hgss; }

function levelCapForBadges(gameKey, count) {
  const g = getGame(gameKey);
  if (count < g.badgeCaps.length) return g.badgeCaps[count];
  return g.postgame.cap;
}

function badgeMilestoneLabel(gameKey, count) {
  const g = getGame(gameKey);
  if (count < g.badgeNames.length) return g.badgeNames[count];
  return g.postgame.name;
}

function buildMilestoneTooltip(gameKey) {
  const g = getGame(gameKey);
  const lines = g.badgeNames.map((name, i) => `${i + 1}. ${name}: Cap Lv ${g.badgeCaps[i]}`);
  lines.push(`Top 4 (nach Johto-Orden 8): Lv ${g.eliteFour.join(" / ")}`);
  lines.push(`${g.champion.name}: Lv ${g.champion.cap}`);
  lines.push(`${g.postgame.name}: Lv ${g.postgame.cap}`);
  return lines.join("\n");
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
  const videoWrap = clone.querySelector(".videoWrap");
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
  videoWrap.addEventListener("click", (event) => {
    if (!document.body.classList.contains("spotlight")) return;
    if (event.target.closest(".fullscreenBtn") || event.target.closest(".playOverlay")) return;
    setSpotlightMain(id);
  });

  grid.appendChild(tile);
  tiles.set(id, { tile, name, video, playOverlay, debugBox });
  renderSpriteBar(id);
  renderDebug(id);
  applySpotlight();
  return tiles.get(id);
}

function toggleFocus(tile) {
  const isFocused = tile.classList.contains("focused");
  document.body.classList.toggle("focus", !isFocused);
  for (const t of document.querySelectorAll(".tile")) t.classList.remove("focused");
  if (!isFocused) tile.classList.add("focused");
}

let spotlightMainId = null;

function applySpotlight() {
  if (!document.body.classList.contains("spotlight")) return;
  if ((!spotlightMainId || !tiles.has(spotlightMainId)) && tiles.size) {
    spotlightMainId = (myId && tiles.has(myId)) ? myId : [...tiles.keys()][0];
  }
  for (const [id, data] of tiles.entries()) {
    data.tile.classList.toggle("spotlightMain", id === spotlightMainId);
  }
}

function setSpotlightMain(id) {
  if (!tiles.has(id)) return;
  spotlightMainId = id;
  applySpotlight();
}

function toggleSpotlight() {
  const enabling = !document.body.classList.contains("spotlight");
  document.body.classList.toggle("spotlight", enabling);
  spotlightBtn.textContent = enabling ? "Spotlight: An" : "Spotlight";
  if (enabling) {
    if (!spotlightMainId || !tiles.has(spotlightMainId)) {
      spotlightMainId = (myId && tiles.has(myId)) ? myId : [...tiles.keys()][0] || null;
    }
    applySpotlight();
  }
}


function emptyRoster() {
  return { team: Array.from({ length: 6 }, () => ({ pokemon: "" })), graveyard: [] };
}

function getRoster(playerId) {
  return teams.get(playerId) || emptyRoster();
}

function getTeam(playerId) {
  return getRoster(playerId).team;
}

function getGraveyard(playerId) {
  return getRoster(playerId).graveyard;
}

function setMyRoster(nextTeam, nextGraveyard) {
  const roster = { team: nextTeam, graveyard: nextGraveyard };
  teams.set(myId, roster);
  socket.emit("update-team", roster);
  renderAllSpriteBars();
}

function getBadges(playerId) {
  return badges.get(playerId) || 0;
}

function setMyBadges(count) {
  const safe = Math.max(0, Math.min(16, count));
  badges.set(myId, safe);
  socket.emit("update-badges", { badges: safe });
  renderAllSpriteBars();
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

  const bar = data.tile.querySelector(".spriteTeamBar");
  if (!bar) return;

  const roster = getRoster(playerId);
  const editable = playerId === myId && joined;

  bar.innerHTML = "";

  roster.team.forEach((pokemon, index) => {
    const slot = document.createElement("div");
    slot.className = `spriteSlot ${pokemon.pokemon ? "" : "slotEmpty"} ${editable ? "editable" : ""}`;
    slot.title = pokemon.pokemon ? `${pokemon.pokemon} (Team)` : (editable ? "Klicken, um ein Pokémon einzutragen" : "Leerer Slot");

    if (pokemon.pokemon) {
      const img = document.createElement("img");
      img.src = tinySpriteUrl(pokemon.pokemon);
      img.alt = pokemon.pokemon;
      img.onerror = () => {
        img.src = spriteUrl(pokemon.pokemon);
      };
      slot.appendChild(img);
    }

    if (editable) {
      slot.dataset.index = String(index);
      slot.addEventListener("click", (event) => {
        event.stopPropagation();
        openSlotPopover(slot, index);
      });
    }
    bar.appendChild(slot);
  });

  const graveyard = roster.graveyard || [];
  if (graveyard.length || editable) {
    const deadCount = graveyard.filter(p => p.status === "dead").length;
    const boxCount = graveyard.filter(p => p.status === "box").length;

    const graveBtn = document.createElement("button");
    graveBtn.type = "button";
    graveBtn.className = "graveyardBtn";
    graveBtn.innerHTML = `☠${deadCount} 📦${boxCount}`;
    graveBtn.title = "Friedhof & Box öffnen";
    graveBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openGraveyardPopover(graveBtn, playerId, editable);
    });
    bar.appendChild(graveBtn);
  }

  const badgeCount = getBadges(playerId);
  const cap = levelCapForBadges(currentGame, badgeCount);
  const milestone = badgeMilestoneLabel(currentGame, badgeCount);

  const levelCapBadge = document.createElement("div");
  levelCapBadge.className = "levelCapBadge";
  levelCapBadge.title = `${milestone}\n\n${buildMilestoneTooltip(currentGame)}`;

  const countLabel = document.createElement("span");
  countLabel.className = "badgeCountLabel";
  countLabel.textContent = `🏅 ${badgeCount}/16`;
  levelCapBadge.appendChild(countLabel);

  const capLabel = document.createElement("span");
  capLabel.className = "levelCapLabel";
  capLabel.textContent = cap ? `Cap Lv ${cap}` : "Start";
  levelCapBadge.appendChild(capLabel);

  if (editable) {
    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "badgeStep";
    minus.textContent = "–";
    minus.title = "Orden entfernen";
    minus.addEventListener("click", () => setMyBadges(badgeCount - 1));

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "badgeStep";
    plus.textContent = "+";
    plus.title = "Orden hinzufügen";
    plus.addEventListener("click", () => setMyBadges(badgeCount + 1));

    levelCapBadge.append(minus, plus);
  }

  bar.appendChild(levelCapBadge);
}

function renderAllSpriteBars() {
  for (const id of tiles.keys()) renderSpriteBar(id);
}

function closeSlotPopover() {
  const existing = document.querySelector(".slotPopover");
  if (existing) existing.remove();
}

function positionPopoverAtRect(pop, rect) {
  const popRect = pop.getBoundingClientRect();
  let top = rect.bottom + 8;
  let left = rect.left;

  if (left + popRect.width > window.innerWidth - 10) left = window.innerWidth - popRect.width - 10;
  if (left < 10) left = 10;
  if (top + popRect.height > window.innerHeight - 10) top = rect.top - popRect.height - 8;
  if (top < 10) top = 10;

  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;
}

function positionPopover(pop, anchorEl) {
  positionPopoverAtRect(pop, anchorEl.getBoundingClientRect());
}

function openSlotPopover(anchorEl, index) {
  const alreadyOpenForThisSlot = document.querySelector(".slotPopover")?.dataset.kind === "team" &&
    document.querySelector(".slotPopover")?.dataset.index === String(index);
  closeSlotPopover();
  if (alreadyOpenForThisSlot) return;

  const roster = getRoster(myId);
  const current = roster.team[index] || { pokemon: "" };
  const hasPokemon = Boolean(current.pokemon);

  const pop = document.createElement("div");
  pop.className = "slotPopover";
  pop.dataset.kind = "team";
  pop.dataset.index = String(index);
  pop.innerHTML = `
    <input class="slotPopoverInput" type="text" placeholder="z.B. glumanda" list="pokemonSuggestions" autocomplete="off" />
    ${hasPokemon ? `
    <div class="slotPopoverMoveActions">
      <button type="button" class="slotPopoverMove dead">☠ Als tot markieren</button>
      <button type="button" class="slotPopoverMove box">📦 In Box verschieben</button>
    </div>` : ""}
    <div class="slotPopoverActions">
      <button type="button" class="slotPopoverClear">Leeren</button>
      <button type="button" class="slotPopoverSave">✓ Speichern</button>
    </div>
  `;

  const input = pop.querySelector(".slotPopoverInput");
  input.value = current.pokemon || "";

  function save() {
    const nextTeam = getTeam(myId).slice();
    nextTeam[index] = { pokemon: normalizePokemonName(input.value) };
    setMyRoster(nextTeam, getGraveyard(myId));
    closeSlotPopover();
  }

  function clearSlot() {
    const nextTeam = getTeam(myId).slice();
    nextTeam[index] = { pokemon: "" };
    setMyRoster(nextTeam, getGraveyard(myId));
    closeSlotPopover();
  }

  function moveToGraveyard(status) {
    const name = normalizePokemonName(input.value) || current.pokemon;
    if (!name) return closeSlotPopover();
    const nextTeam = getTeam(myId).slice();
    nextTeam[index] = { pokemon: "" };
    const nextGraveyard = getGraveyard(myId).concat([{ pokemon: name, status }]);
    setMyRoster(nextTeam, nextGraveyard);
    closeSlotPopover();
  }

  pop.querySelector(".slotPopoverSave").addEventListener("click", (e) => { e.stopPropagation(); save(); });
  pop.querySelector(".slotPopoverClear").addEventListener("click", (e) => { e.stopPropagation(); clearSlot(); });
  const deadBtn = pop.querySelector(".slotPopoverMove.dead");
  const boxBtn = pop.querySelector(".slotPopoverMove.box");
  if (deadBtn) deadBtn.addEventListener("click", (e) => { e.stopPropagation(); moveToGraveyard("dead"); });
  if (boxBtn) boxBtn.addEventListener("click", (e) => { e.stopPropagation(); moveToGraveyard("box"); });
  pop.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") closeSlotPopover();
  });

  document.body.appendChild(pop);
  positionPopover(pop, anchorEl);
  input.focus();
  input.select();
}

function openGraveSlotPopover(anchorEl, gIndex) {
  const isAddSlot = gIndex === -1;
  const alreadyOpen = document.querySelector(".slotPopover")?.dataset.kind === "grave" &&
    document.querySelector(".slotPopover")?.dataset.index === String(gIndex);
  const anchorRect = anchorEl.getBoundingClientRect();
  closeSlotPopover();
  if (alreadyOpen) return;

  const graveyard = getGraveyard(myId);
  const current = isAddSlot ? { pokemon: "", status: "dead" } : (graveyard[gIndex] || { pokemon: "", status: "dead" });

  const pop = document.createElement("div");
  pop.className = "slotPopover";
  pop.dataset.kind = "grave";
  pop.dataset.index = String(gIndex);
  pop.innerHTML = `
    <input class="slotPopoverInput" type="text" placeholder="z.B. reshiram" list="pokemonSuggestions" autocomplete="off" />
    <select class="slotPopoverStatus">
      <option value="dead">Tot</option>
      <option value="box">Box</option>
    </select>
    <div class="slotPopoverActions">
      <button type="button" class="slotPopoverClear">${isAddSlot ? "Abbrechen" : "Entfernen"}</button>
      <button type="button" class="slotPopoverSave">✓ Speichern</button>
    </div>
  `;

  const input = pop.querySelector(".slotPopoverInput");
  const status = pop.querySelector(".slotPopoverStatus");
  input.value = current.pokemon || "";
  status.value = current.status || "dead";

  function save() {
    const name = normalizePokemonName(input.value);
    if (!name) return closeSlotPopover();
    const nextGraveyard = getGraveyard(myId).slice();
    const entry = { pokemon: name, status: status.value };
    if (isAddSlot) nextGraveyard.push(entry);
    else nextGraveyard[gIndex] = entry;
    setMyRoster(getTeam(myId), nextGraveyard);
    closeSlotPopover();
  }

  function removeEntry() {
    if (isAddSlot) return closeSlotPopover();
    const nextGraveyard = getGraveyard(myId).slice();
    nextGraveyard.splice(gIndex, 1);
    setMyRoster(getTeam(myId), nextGraveyard);
    closeSlotPopover();
  }

  pop.querySelector(".slotPopoverSave").addEventListener("click", (e) => { e.stopPropagation(); save(); });
  pop.querySelector(".slotPopoverClear").addEventListener("click", (e) => { e.stopPropagation(); removeEntry(); });
  pop.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") closeSlotPopover();
  });

  document.body.appendChild(pop);
  positionPopoverAtRect(pop, anchorRect);
  input.focus();
  input.select();
}

function openGraveyardPopover(anchorEl, playerId, editable) {
  const alreadyOpen = document.querySelector(".slotPopover")?.dataset.kind === "graveyard-list" &&
    document.querySelector(".slotPopover")?.dataset.player === playerId;
  const anchorRect = anchorEl.getBoundingClientRect();
  closeSlotPopover();
  if (alreadyOpen) return;

  const graveyard = getGraveyard(playerId);

  const pop = document.createElement("div");
  pop.className = "slotPopover graveyardPopover";
  pop.dataset.kind = "graveyard-list";
  pop.dataset.player = playerId;

  const header = document.createElement("div");
  header.className = "graveyardPopoverHeader";
  header.textContent = "Friedhof & Box";
  pop.appendChild(header);

  if (!graveyard.length && !editable) {
    const empty = document.createElement("div");
    empty.className = "graveyardPopoverEmpty";
    empty.textContent = "Noch keine Einträge.";
    pop.appendChild(empty);
  } else {
    const grid = document.createElement("div");
    grid.className = "graveyardPopoverGrid";

    graveyard.forEach((entry, gIndex) => {
      const slot = document.createElement("div");
      slot.className = `spriteSlot graveSlot ${entry.status}`;
      slot.title = `${entry.pokemon} (${entry.status === "dead" ? "tot" : "geboxt"})`;

      const img = document.createElement("img");
      img.src = tinySpriteUrl(entry.pokemon);
      img.alt = entry.pokemon;
      img.onerror = () => { img.src = spriteUrl(entry.pokemon); };
      slot.appendChild(img);

      if (editable) {
        slot.classList.add("editable");
        slot.addEventListener("click", (event) => {
          event.stopPropagation();
          openGraveSlotPopover(slot, gIndex);
        });
      }
      grid.appendChild(slot);
    });

    if (editable) {
      const addSlot = document.createElement("div");
      addSlot.className = "spriteSlot slotEmpty editable";
      addSlot.title = "Pokémon zu Friedhof/Box hinzufügen";
      addSlot.addEventListener("click", (event) => {
        event.stopPropagation();
        openGraveSlotPopover(addSlot, -1);
      });
      grid.appendChild(addSlot);
    }

    pop.appendChild(grid);
  }

  pop.addEventListener("click", (e) => e.stopPropagation());
  document.body.appendChild(pop);
  positionPopoverAtRect(pop, anchorRect);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}



// Interaktive Johto-Karte mit Editor-Modus.
// Die Koordinaten sind Prozentwerte relativ zur Karten-Grafik.
// Änderungen im Editor werden lokal im Browser gespeichert und können als JSON exportiert werden.
const MAP_IMAGE_PATH = "/map-johto.png";
const MAP_STORAGE_KEY = "soullockeJohtoMapMarkersV3";

const DEFAULT_JOHTO_MARKERS = [
  { id: "badge-1", type: "gymcity", n: 1, name: "Violet City / Falkner", cap: 13, encounterDone: false, xPct: 18, yPct: 30 },
  { id: "badge-2", type: "gymcity", n: 2, name: "Azalea Town / Bugsy", cap: 17, encounterDone: false, xPct: 20, yPct: 52 },
  { id: "badge-3", type: "gymcity", n: 3, name: "Goldenrod City / Whitney", cap: 19, encounterDone: false, xPct: 38, yPct: 48 },
  { id: "badge-4", type: "gymcity", n: 4, name: "Ecruteak City / Morty", cap: 25, encounterDone: false, xPct: 53, yPct: 32 },
  { id: "badge-5", type: "gymcity", n: 5, name: "Cianwood City / Chuck", cap: 31, encounterDone: false, xPct: 74, yPct: 55 },
  { id: "badge-6", type: "gymcity", n: 6, name: "Olivine City / Jasmine", cap: 35, encounterDone: false, xPct: 47, yPct: 68 },
  { id: "badge-7", type: "gymcity", n: 7, name: "Mahogany Town / Pryce", cap: 34, encounterDone: false, xPct: 66, yPct: 26 },
  { id: "badge-8", type: "gymcity", n: 8, name: "Blackthorn City / Clair", cap: 41, encounterDone: false, xPct: 84, yPct: 30 },

  { id: "city-new-bark", type: "city", name: "New Bark Town", encounterDone: false, xPct: 90, yPct: 55 },
  { id: "city-cherrygrove", type: "city", name: "Cherrygrove City", encounterDone: false, xPct: 74, yPct: 66 },

  { id: "route-29", type: "route", name: "Route 29", encounterDone: false, xPct: 83, yPct: 61 },
  { id: "route-30", type: "route", name: "Route 30", encounterDone: false, xPct: 72, yPct: 54 },
  { id: "route-31", type: "route", name: "Route 31", encounterDone: false, xPct: 31, yPct: 38 },
  { id: "route-32", type: "route", name: "Route 32", encounterDone: false, xPct: 21, yPct: 45 },
  { id: "route-33", type: "route", name: "Route 33", encounterDone: false, xPct: 25, yPct: 60 },
  { id: "route-34", type: "route", name: "Route 34", encounterDone: false, xPct: 38, yPct: 67 },
  { id: "route-35", type: "route", name: "Route 35", encounterDone: false, xPct: 39, yPct: 47 },
  { id: "route-36", type: "route", name: "Route 36", encounterDone: false, xPct: 43, yPct: 37 },
  { id: "route-37", type: "route", name: "Route 37", encounterDone: false, xPct: 49, yPct: 39 },
  { id: "route-38", type: "route", name: "Route 38", encounterDone: false, xPct: 45, yPct: 48 },
  { id: "route-39", type: "route", name: "Route 39", encounterDone: false, xPct: 47, yPct: 58 },
  { id: "route-40", type: "route", name: "Route 40", encounterDone: false, xPct: 36, yPct: 78 },
  { id: "route-41", type: "route", name: "Route 41", encounterDone: false, xPct: 23, yPct: 73 },
  { id: "route-42", type: "route", name: "Route 42", encounterDone: false, xPct: 61, yPct: 43 },
  { id: "route-43", type: "route", name: "Route 43", encounterDone: false, xPct: 66, yPct: 17 },
  { id: "route-44", type: "route", name: "Route 44", encounterDone: false, xPct: 75, yPct: 40 },
  { id: "route-45", type: "route", name: "Route 45", encounterDone: false, xPct: 84, yPct: 47 },
  { id: "route-46", type: "route", name: "Route 46", encounterDone: false, xPct: 78, yPct: 55 },
  { id: "route-47", type: "route", name: "Route 47", encounterDone: false, xPct: 17, yPct: 62 },
  { id: "route-48", type: "route", name: "Route 48", encounterDone: false, xPct: 26, yPct: 40 },

  { id: "place-ruins", type: "place", name: "Ruins of Alph", encounterDone: false, xPct: 30, yPct: 47 },
  { id: "place-ilex", type: "place", name: "Ilex Forest", encounterDone: false, xPct: 30, yPct: 61 },
  { id: "place-national-park", type: "place", name: "National Park", encounterDone: false, xPct: 39, yPct: 42 },
  { id: "place-lake-rage", type: "place", name: "Lake of Rage", encounterDone: false, xPct: 66, yPct: 17 },
  { id: "place-ice-path", type: "place", name: "Ice Path", encounterDone: false, xPct: 77, yPct: 33 },
  { id: "place-dark-cave", type: "place", name: "Dark Cave", encounterDone: false, xPct: 83, yPct: 45 }
];

let mapMarkers = loadMapMarkers();
let mapEditMode = false;
let selectedMapMarkerId = null;
let mapNodeSize = Number(localStorage.getItem("soullockeMapNodeSize") || 22);

function loadMapMarkers() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved.map(normalizeMapMarker);
  } catch {}
  return structuredClone(DEFAULT_JOHTO_MARKERS).map(normalizeMapMarker);
}

function normalizeMapMarker(marker) {
  const normalized = { ...marker };
  if (normalized.type === "badge") normalized.type = "gymcity";
  if (typeof normalized.encounterDone !== "boolean") normalized.encounterDone = false;
  if (!normalized.shape) normalized.shape = getDefaultShapeForType(normalized.type);
  if (!normalized.size) normalized.size = getDefaultSizeForType(normalized.type);
  return normalized;
}

function getDefaultSizeForType(type) {
  if (type === "route") return 22;
  if (type === "city") return 22;
  if (type === "gymcity") return 24;
  return 22;
}

function getDefaultShapeForType(type) {
  if (type === "city") return "circle";
  if (type === "route") return "rect";
  if (type === "gymcity") return "rounded";
  return "diamond";
}

function getMarkerSize(marker) {
  return Number(marker.size || getDefaultSizeForType(marker.type));
}

function getMarkerShape(marker) {
  return marker.shape || getDefaultShapeForType(marker.type);
}

function saveMapMarkers() {
  localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapMarkers));
}

function getMarkerTypeLabel(type) {
  return {
    gymcity: "Arena/Stadt",
    city: "Stadt",
    route: "Route",
    place: "Ort"
  }[type] || "Ort";
}

function getMarkerSymbol(marker) {
  if (marker.type === "gymcity") return String(marker.n || "★");
  if (marker.type === "city") return "●";
  if (marker.type === "route") return String(marker.name || "").replace(/[^0-9]/g, "") || "R";
  return "◆";
}

function markerHasEncounter(marker) {
  return ["gymcity", "city", "route", "place"].includes(marker.type);
}

function showMapMarkerInfo(marker) {
  selectedMapMarkerId = marker.id;
  const capLine = marker.cap ? `<br>Level-Cap: Lv ${marker.cap}` : "";
  const encounterLine = markerHasEncounter(marker)
    ? `<br>Encounter: <strong class="${marker.encounterDone ? "encounterNo" : "encounterYes"}">${marker.encounterDone ? "verbraucht" : "offen"}</strong>`
    : "";

  mapInfoPanel.innerHTML = `
    <strong>${escapeHtml(marker.name || "Unbenannt")}</strong>
    <br>Typ: ${escapeHtml(getMarkerTypeLabel(marker.type))}
    ${capLine}
    ${encounterLine}
    <br><span class="mapCoordText">X: ${marker.xPct.toFixed(2)}% · Y: ${marker.yPct.toFixed(2)}%</span>
  `;
}

function renderMapEditorPanel(marker) {
  if (!mapEditMode) {
    if (!marker || !markerHasEncounter(marker)) return "";
    return `
      <div class="mapEditorPanel mapQuickPanel">
        <button id="mapToggleEncounterBtn" type="button">${marker.encounterDone ? "Encounter wieder offen" : "Encounter verbraucht"}</button>
      </div>
    `;
  }

  if (!marker) {
    return `
      <div class="mapEditorPanel">
        <strong>Editor</strong>
        <p>Marker anklicken oder neuen Marker hinzufügen.</p>
      </div>
    `;
  }

  const markerSize = getMarkerSize(marker);
  const markerShape = getMarkerShape(marker);

  return `
    <div class="mapEditorPanel">
      <strong>Marker bearbeiten</strong>
      <label>Name
        <input id="mapEditName" value="${escapeHtml(marker.name || "")}">
      </label>
      <label>Typ
        <select id="mapEditType">
          <option value="gymcity" ${marker.type === "gymcity" ? "selected" : ""}>Arena/Stadt</option>
          <option value="city" ${marker.type === "city" ? "selected" : ""}>Stadt</option>
          <option value="route" ${marker.type === "route" ? "selected" : ""}>Route</option>
          <option value="place" ${marker.type === "place" ? "selected" : ""}>Ort</option>
        </select>
      </label>
      <label>Level-Cap
        <input id="mapEditCap" value="${marker.cap || ""}" placeholder="optional">
      </label>
      <label>Größe
        <div class="mapMarkerSizeRow">
          <input id="mapEditSize" type="range" min="12" max="46" value="${markerSize}">
          <span id="mapEditSizeValue">${markerSize}px</span>
        </div>
      </label>
      <label>Form
        <select id="mapEditShape">
          <option value="circle" ${markerShape === "circle" ? "selected" : ""}>Kreis</option>
          <option value="square" ${markerShape === "square" ? "selected" : ""}>Quadrat</option>
          <option value="rounded" ${markerShape === "rounded" ? "selected" : ""}>Abgerundet</option>
          <option value="rect" ${markerShape === "rect" ? "selected" : ""}>Rechteck</option>
          <option value="pill" ${markerShape === "pill" ? "selected" : ""}>Pille</option>
          <option value="diamond" ${markerShape === "diamond" ? "selected" : ""}>Diamant</option>
        </select>
      </label>
      <label class="encounterCheckbox">
        <input id="mapEditEncounter" type="checkbox" ${marker.encounterDone ? "checked" : ""}>
        Encounter verbraucht
      </label>
      <div class="mapEditorPreviewLine">
        Vorschau: <span id="mapMarkerPreview" class="mapHotspot mapHotspot-${marker.type} ${marker.encounterDone ? "encounter-done" : "encounter-open"} shape-${markerShape}" style="--node-size:${markerSize}px">${getMarkerSymbol(marker)}</span>
      </div>
      <div class="mapEditorCoords">X ${marker.xPct.toFixed(2)}% · Y ${marker.yPct.toFixed(2)}%</div>
      <div class="mapEditorActions">
        <button id="mapApplyMarkerBtn" type="button">Übernehmen</button>
        <button id="mapDeleteMarkerBtn" type="button">Löschen</button>
      </div>
    </div>
  `;
}

function attachMapEditorPanelEvents(marker) {
  if (!marker) return;

  const toggle = document.querySelector("#mapToggleEncounterBtn");
  if (toggle) {
    toggle.onclick = () => {
      marker.encounterDone = !marker.encounterDone;
      saveMapMarkers();
      openMap();
      selectMapMarker(marker.id);
    };
  }

  if (!mapEditMode) return;

  const apply = document.querySelector("#mapApplyMarkerBtn");
  const del = document.querySelector("#mapDeleteMarkerBtn");
  const sizeInput = document.querySelector("#mapEditSize");
  const sizeValue = document.querySelector("#mapEditSizeValue");
  const shapeInput = document.querySelector("#mapEditShape");
  const typeInput = document.querySelector("#mapEditType");
  const encounterInput = document.querySelector("#mapEditEncounter");
  const preview = document.querySelector("#mapMarkerPreview");

  const updatePreview = () => {
    if (!preview) return;
    const currentSize = Number(sizeInput?.value || getMarkerSize(marker));
    const currentShape = shapeInput?.value || getMarkerShape(marker);
    const currentType = typeInput?.value || marker.type;
    const done = !!encounterInput?.checked;

    if (sizeValue) sizeValue.textContent = `${currentSize}px`;
    preview.style.setProperty("--node-size", `${currentSize}px`);
    preview.className = `mapHotspot mapHotspot-${currentType} ${done ? "encounter-done" : "encounter-open"} shape-${currentShape}`;
  };

  if (sizeInput) sizeInput.oninput = updatePreview;
  if (shapeInput) shapeInput.onchange = updatePreview;
  if (typeInput) typeInput.onchange = updatePreview;
  if (encounterInput) encounterInput.onchange = updatePreview;

  if (apply) {
    apply.onclick = () => {
      marker.name = document.querySelector("#mapEditName").value.trim() || "Unbenannt";
      marker.type = document.querySelector("#mapEditType").value;
      const capValue = document.querySelector("#mapEditCap").value.trim();
      marker.cap = capValue ? Number(capValue) || capValue : "";
      marker.size = Number(document.querySelector("#mapEditSize").value) || getDefaultSizeForType(marker.type);
      marker.shape = document.querySelector("#mapEditShape").value || getDefaultShapeForType(marker.type);
      marker.encounterDone = !!document.querySelector("#mapEditEncounter")?.checked;
      saveMapMarkers();
      openMap();
      selectMapMarker(marker.id);
    };
  }

  if (del) {
    del.onclick = () => {
      mapMarkers = mapMarkers.filter(m => m.id !== marker.id);
      selectedMapMarkerId = null;
      saveMapMarkers();
      openMap();
    };
  }
}

function selectMapMarker(markerId) {
  selectedMapMarkerId = markerId;
  mapImageContainer.querySelectorAll(".mapHotspot.selected").forEach(el => el.classList.remove("selected"));
  const markerElement = mapImageContainer.querySelector(`[data-marker-id="${CSS.escape(markerId)}"]`);
  if (markerElement) markerElement.classList.add("selected");
  const marker = mapMarkers.find(m => m.id === markerId);
  if (marker) {
    showMapMarkerInfo(marker);
    mapInfoPanel.insertAdjacentHTML("beforeend", renderMapEditorPanel(marker));
    attachMapEditorPanelEvents(marker);
  }
}

function makeMapHotspot(marker) {
  const spot = document.createElement("button");
  spot.type = "button";
  spot.className = `mapHotspot mapHotspot-${marker.type} ${marker.encounterDone ? "encounter-done" : "encounter-open"} shape-${getMarkerShape(marker)}`;
  if (mapEditMode) spot.classList.add("editable");
  spot.style.left = `${marker.xPct}%`;
  spot.style.top = `${marker.yPct}%`;
  spot.style.setProperty("--node-size", `${getMarkerSize(marker)}px`);
  spot.textContent = getMarkerSymbol(marker);
  spot.dataset.symbol = getMarkerSymbol(marker);
  spot.dataset.markerId = marker.id;
  spot.title = `${marker.name}${markerHasEncounter(marker) ? (marker.encounterDone ? " – Encounter verbraucht" : " – Encounter offen") : ""}`;

  spot.addEventListener("click", (event) => {
    event.stopPropagation();
    selectMapMarker(marker.id);
  });

  if (mapEditMode) {
    spot.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectMapMarker(marker.id);
      spot.setPointerCapture(event.pointerId);

      const move = (moveEvent) => {
        const rect = mapImageContainer.getBoundingClientRect();
        marker.xPct = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
        marker.yPct = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
        spot.style.left = `${marker.xPct}%`;
        spot.style.top = `${marker.yPct}%`;
        showMapMarkerInfo(marker);
        mapInfoPanel.insertAdjacentHTML("beforeend", renderMapEditorPanel(marker));
        attachMapEditorPanelEvents(marker);
      };

      const up = () => {
        saveMapMarkers();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  return spot;
}

async function exportMapJson() {
  const json = JSON.stringify(mapMarkers, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    mapInfoPanel.innerHTML = `<strong>Export kopiert.</strong><br>JSON wurde in die Zwischenablage kopiert.`;
  } catch {
    mapInfoPanel.innerHTML = `<strong>Export JSON</strong><textarea class="mapExportBox" readonly>${escapeHtml(json)}</textarea>`;
  }
}

function addMapMarker(type = "route") {
  const id = `${type}-${Date.now()}`;
  const marker = {
    id,
    type,
    name: type === "route" ? "Neue Route" : type === "city" ? "Neue Stadt" : type === "gymcity" ? "Neue Arena/Stadt" : "Neuer Ort",
    encounterDone: false,
    size: getDefaultSizeForType(type),
    shape: getDefaultShapeForType(type),
    xPct: 50,
    yPct: 50
  };
  mapMarkers.push(marker);
  selectedMapMarkerId = id;
  saveMapMarkers();
  openMap();
  selectMapMarker(id);
}

function openMap() {
  mapGameLabel.textContent = `${getGame(currentGame).label} – Johto`;
  mapModal.classList.remove("hidden");
  mapImageContainer.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "mapToolbar";
  toolbar.innerHTML = `
    <button id="mapEditToggleBtn" type="button">${mapEditMode ? "Editor: An" : "Editor: Aus"}</button>
    <span class="mapSizeHint">Größe/Form pro Marker</span>
    <button id="mapAddRouteBtn" type="button" ${mapEditMode ? "" : "disabled"}>+ Route</button>
    <button id="mapAddCityBtn" type="button" ${mapEditMode ? "" : "disabled"}>+ Stadt</button>
    <button id="mapAddGymCityBtn" type="button" ${mapEditMode ? "" : "disabled"}>+ Arena/Stadt</button>
    <button id="mapAddPlaceBtn" type="button" ${mapEditMode ? "" : "disabled"}>+ Ort</button>
    <button id="mapExportBtn" type="button">Export JSON</button>
    <button id="mapResetBtn" type="button">Reset</button>
  `;

  const img = document.createElement("img");
  img.className = "mapImage";
  img.alt = "Johto-Karte";
  img.src = MAP_IMAGE_PATH;

  const hotspotLayer = document.createElement("div");
  hotspotLayer.className = "mapHotspotLayer";
  if (mapEditMode) hotspotLayer.classList.add("editing");

  mapMarkers.forEach(marker => hotspotLayer.appendChild(makeMapHotspot(marker)));

  const legend = document.createElement("div");
  legend.className = "mapLegend";
  legend.innerHTML = `
    <span><b class="legendOpen"></b> Encounter offen</span>
    <span><b class="legendDone"></b> Encounter verbraucht</span>
    <span><b class="legendGym"></b> Arena/Stadt</span>
    <span><b class="legendCity"></b> Stadt</span>
    <span><b class="legendRoute"></b> Route</span>
    <span><b class="legendPlace"></b> Ort</span>
  `;

  const notice = document.createElement("div");
  notice.className = "mapImageMissingNotice";
  notice.innerHTML = `Kein eigenes Kartenbild gefunden.<br>Lege deine Karte unter <code>public${MAP_IMAGE_PATH}</code> ab.`;

  img.addEventListener("error", () => mapImageContainer.classList.add("missing"), { once: true });
  img.addEventListener("load", () => mapImageContainer.classList.remove("missing"), { once: true });

  mapImageContainer.append(toolbar, img, hotspotLayer, legend, notice);

  document.querySelector("#mapEditToggleBtn").onclick = () => {
    mapEditMode = !mapEditMode;
    openMap();
  };


  document.querySelector("#mapAddRouteBtn").onclick = () => addMapMarker("route");
  document.querySelector("#mapAddCityBtn").onclick = () => addMapMarker("city");
  document.querySelector("#mapAddGymCityBtn").onclick = () => addMapMarker("gymcity");
  document.querySelector("#mapAddPlaceBtn").onclick = () => addMapMarker("place");
  document.querySelector("#mapExportBtn").onclick = exportMapJson;
  document.querySelector("#mapResetBtn").onclick = () => {
    if (!confirm("Map-Marker wirklich auf Standard zurücksetzen?")) return;
    mapMarkers = structuredClone(DEFAULT_JOHTO_MARKERS);
    selectedMapMarkerId = null;
    saveMapMarkers();
    openMap();
  };

  if (selectedMapMarkerId && mapMarkers.some(m => m.id === selectedMapMarkerId)) {
    selectMapMarker(selectedMapMarkerId);
  } else {
    mapInfoPanel.innerHTML = mapEditMode
      ? `Editor aktiv: Marker anklicken und ziehen. ${renderMapEditorPanel(null)}`
      : "Klicke auf einen Marker für Details. Grün = Encounter offen, Rot = Encounter verbraucht.";
  }
}

function closeMap() {
  mapModal.classList.add("hidden");
}

mapBtn.addEventListener("click", openMap);
spotlightBtn.addEventListener("click", toggleSpotlight);
closeMapBtn.addEventListener("click", closeMap);
mapModal.addEventListener("click", (event) => {
  if (event.target === mapModal) closeMap();
});

gameSelect.addEventListener("change", () => {
  currentGame = gameSelect.value;
  socket.emit("update-game", { game: currentGame });
  renderAllSpriteBars();
  if (!mapModal.classList.contains("hidden")) openMap();
});

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

let debugVisible = localStorage.getItem("soullockeDebugVisible") === "true";
function updateDebugToggleLabel() {
  debugToggleBtn.textContent = debugVisible ? "Debug: An" : "Debug: Aus";
}
document.body.classList.toggle("hide-debug", !debugVisible);
updateDebugToggleLabel();

settingsBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSlotPopover();
  settingsPanel.classList.toggle("hidden");
});

clearTeamBtn.addEventListener("click", () => {
  if (!joined) return;
  if (!confirm("Team UND Friedhof/Box komplett leeren?")) return;
  setMyRoster(emptyRoster().team, []);
  settingsPanel.classList.add("hidden");
});

debugToggleBtn.addEventListener("click", () => {
  debugVisible = !debugVisible;
  localStorage.setItem("soullockeDebugVisible", String(debugVisible));
  document.body.classList.toggle("hide-debug", !debugVisible);
  updateDebugToggleLabel();
});

function buildTeamExport() {
  const ordered = [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  return {
    room: roomId,
    game: currentGame,
    gameLabel: getGame(currentGame).label,
    exportedAt: new Date().toISOString(),
    players: ordered.map(p => {
      const roster = getRoster(p.id);
      const alive = roster.team.filter(s => s.pokemon).map(s => s.pokemon);
      const dead = roster.graveyard.filter(s => s.status === "dead").map(s => s.pokemon);
      const boxed = roster.graveyard.filter(s => s.status === "box").map(s => s.pokemon);
      const badgeCount = getBadges(p.id);
      return {
        name: p.name,
        alive,
        dead,
        boxed,
        badges: badgeCount,
        levelCap: levelCapForBadges(currentGame, badgeCount),
        milestone: badgeMilestoneLabel(currentGame, badgeCount)
      };
    })
  };
}

exportBtn.addEventListener("click", () => {
  const data = buildTeamExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `soullocke-export-${roomId || "raum"}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.body.addEventListener("click", (event) => {
  for (const id of activeStreams.keys()) resumeVideo(id);

  const target = event.target;
  if (target.closest && (target.closest(".slotPopover") || target.closest(".spriteSlot.editable"))) return;
  closeSlotPopover();

  if (settingsPanel && !settingsPanel.classList.contains("hidden")) {
    if (!(target.closest && (target.closest("#settingsPanel") || target.closest("#settingsBtn")))) {
      settingsPanel.classList.add("hidden");
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSlotPopover();
    if (settingsPanel) settingsPanel.classList.add("hidden");
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
  if (data.teams) for (const [id, roster] of Object.entries(data.teams)) teams.set(id, roster);
  badges.clear();
  if (data.badges) for (const [id, count] of Object.entries(data.badges)) badges.set(id, count);
  currentGame = data.game || "hgss";
  gameSelect.value = currentGame;

  joinBtn.disabled = true;
  shareBtn.disabled = false;
  exportBtn.disabled = false;
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
  if (data) for (const [id, roster] of Object.entries(data)) teams.set(id, roster);
  renderAllSpriteBars();
});

socket.on("badges", data => {
  badges.clear();
  if (data) for (const [id, count] of Object.entries(data)) badges.set(id, count);
  renderAllSpriteBars();
});

socket.on("game-changed", ({ game }) => {
  currentGame = game || "hgss";
  gameSelect.value = currentGame;
  renderAllSpriteBars();
  if (!mapModal.classList.contains("hidden")) openMap();
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
