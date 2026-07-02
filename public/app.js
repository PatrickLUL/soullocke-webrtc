
const APP_VERSION = "v8.15-map";
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

// Positionen der 8 Johto-Stationen als Prozent-Koordinaten (relativ zur
// Bildgröße), damit sie unabhängig von der tatsächlichen Bildauflösung
// funktionieren. Das sind grobe Schätzwerte basierend auf der ungefähren
// Lage der Städte auf der Johto-Karte - nach dem Einfügen deines eigenen
// Kartenbildes (siehe MAP_IMAGE_PATH unten) am besten per Auge nachjustieren.
const MAP_IMAGE_PATH = "/map-johto.png";

// v8.15: Die Karte ist jetzt datengetrieben. Dadurch können wir Orte,
// Routen, Höhlen und Arenen getrennt anzeigen und später leicht verschieben.
// xPct/yPct sind Prozent-Koordinaten relativ zum Kartenbild.
const JOHTO_MAP_POINTS = [
  // Arenen / Level-Caps
  { id: "gym-violet", type: "gym", order: 1, xPct: 18, yPct: 30, title: "Falkner", subtitle: "Violet City", cap: 13 },
  { id: "gym-azalea", type: "gym", order: 2, xPct: 20, yPct: 55, title: "Bugsy", subtitle: "Azalea Town", cap: 17 },
  { id: "gym-goldenrod", type: "gym", order: 3, xPct: 38, yPct: 58, title: "Whitney", subtitle: "Goldenrod City", cap: 19 },
  { id: "gym-ecruteak", type: "gym", order: 4, xPct: 53, yPct: 33, title: "Morty", subtitle: "Ecruteak City", cap: 25 },
  { id: "gym-cianwood", type: "gym", order: 5, xPct: 47, yPct: 76, title: "Chuck", subtitle: "Cianwood City", cap: 31 },
  { id: "gym-olivine", type: "gym", order: 6, xPct: 41, yPct: 76, title: "Jasmine", subtitle: "Olivine City", cap: 35 },
  { id: "gym-mahogany", type: "gym", order: 7, xPct: 68, yPct: 30, title: "Pryce", subtitle: "Mahogany Town", cap: 34 },
  { id: "gym-blackthorn", type: "gym", order: 8, xPct: 85, yPct: 30, title: "Clair", subtitle: "Blackthorn City", cap: 41 },

  // Städte / wichtige Orte
  { id: "new-bark", type: "town", xPct: 89, yPct: 65, title: "New Bark Town", subtitle: "Startort" },
  { id: "cherrygrove", type: "town", xPct: 78, yPct: 76, title: "Cherrygrove City" },
  { id: "violet", type: "town", xPct: 18, yPct: 30, title: "Violet City" },
  { id: "azalea", type: "town", xPct: 20, yPct: 55, title: "Azalea Town" },
  { id: "goldenrod", type: "town", xPct: 38, yPct: 58, title: "Goldenrod City" },
  { id: "ecruteak", type: "town", xPct: 53, yPct: 33, title: "Ecruteak City" },
  { id: "olivine", type: "town", xPct: 41, yPct: 76, title: "Olivine City" },
  { id: "cianwood", type: "town", xPct: 47, yPct: 76, title: "Cianwood City" },
  { id: "mahogany", type: "town", xPct: 68, yPct: 30, title: "Mahogany Town" },
  { id: "blackthorn", type: "town", xPct: 85, yPct: 30, title: "Blackthorn City" },
  { id: "lake-rage", type: "place", xPct: 67, yPct: 14, title: "Lake of Rage" },
  { id: "national-park", type: "place", xPct: 39, yPct: 38, title: "National Park" },
  { id: "ruins-alph", type: "place", xPct: 27, yPct: 42, title: "Ruins of Alph" },
  { id: "sprout-tower", type: "place", xPct: 15, yPct: 24, title: "Sprout Tower" },
  { id: "ilex", type: "place", xPct: 29, yPct: 60, title: "Ilex Forest" },
  { id: "union-cave", type: "place", xPct: 23, yPct: 45, title: "Union Cave" },
  { id: "mt-mortar", type: "place", xPct: 61, yPct: 37, title: "Mt. Mortar" },
  { id: "ice-path", type: "place", xPct: 77, yPct: 30, title: "Ice Path" },
  { id: "whirl", type: "place", xPct: 39, yPct: 72, title: "Whirl Islands" },

  // Routen / Wasserwege - grob auf die Karte gelegt, damit sie anklickbar sind.
  { id: "r29", type: "route", xPct: 83, yPct: 70, title: "Route 29" },
  { id: "r30", type: "route", xPct: 76, yPct: 62, title: "Route 30" },
  { id: "r31", type: "route", xPct: 70, yPct: 51, title: "Route 31" },
  { id: "r32", type: "route", xPct: 20, yPct: 42, title: "Route 32" },
  { id: "r33", type: "route", xPct: 23, yPct: 54, title: "Route 33" },
  { id: "r34", type: "route", xPct: 33, yPct: 64, title: "Route 34" },
  { id: "r35", type: "route", xPct: 38, yPct: 46, title: "Route 35" },
  { id: "r36", type: "route", xPct: 31, yPct: 35, title: "Route 36" },
  { id: "r37", type: "route", xPct: 45, yPct: 35, title: "Route 37" },
  { id: "r38", type: "route", xPct: 47, yPct: 43, title: "Route 38" },
  { id: "r39", type: "route", xPct: 43, yPct: 58, title: "Route 39" },
  { id: "r40", type: "route", xPct: 42, yPct: 86, title: "Route 40" },
  { id: "r41", type: "route", xPct: 47, yPct: 86, title: "Route 41" },
  { id: "r42", type: "route", xPct: 62, yPct: 34, title: "Route 42" },
  { id: "r43", type: "route", xPct: 67, yPct: 21, title: "Route 43" },
  { id: "r44", type: "route", xPct: 74, yPct: 31, title: "Route 44" },
  { id: "r45", type: "route", xPct: 83, yPct: 44, title: "Route 45" },
  { id: "r46", type: "route", xPct: 78, yPct: 52, title: "Route 46" },
  { id: "r47", type: "route", xPct: 52, yPct: 67, title: "Route 47" },
  { id: "r48", type: "route", xPct: 55, yPct: 56, title: "Route 48" }
];

function buildMapStations(gameKey) {
  const g = getGame(gameKey);
  const gymNames = g.badgeNames;
  const caps = g.badgeCaps;

  return JOHTO_MAP_POINTS.map(point => {
    if (point.type === "gym") {
      const idx = Math.max(0, (point.order || 1) - 1);
      return {
        ...point,
        label: gymNames[idx] || point.title,
        cap: caps[idx]
      };
    }
    return point;
  });
}

function mapTypeLabel(type) {
  if (type === "gym") return "Arena";
  if (type === "route") return "Route";
  if (type === "town") return "Stadt";
  return "Ort";
}

function markerText(point) {
  if (point.type === "gym") return String(point.order);
  if (point.type === "route") return point.title.replace("Route ", "");
  if (point.type === "town") return "●";
  return "◆";
}

function mapPointDetails(point) {
  const parts = [`<strong>${escapeHtml(point.title)}</strong>`];
  if (point.subtitle) parts.push(`<span>${escapeHtml(point.subtitle)}</span>`);
  parts.push(`<span>Typ: ${mapTypeLabel(point.type)}</span>`);
  if (point.type === "gym") parts.push(`<span>Orden #${point.order} · Level-Cap: Lv ${point.cap}</span>`);
  if (point.type === "route") parts.push(`<span>Route/Encounter-Ort: für Nuzlocke-Catches markieren.</span>`);
  return parts.join("<br>");
}

function openMap() {
  mapGameLabel.textContent = `${getGame(currentGame).label} – Johto`;
  mapInfoPanel.textContent = "Klicke auf Arena, Stadt, Route oder Ort.";
  mapModal.classList.remove("hidden");

  mapImageContainer.innerHTML = "";

  const img = document.createElement("img");
  img.className = "mapImage";
  img.alt = "Johto-Karte";
  img.src = MAP_IMAGE_PATH;

  const hotspotLayer = document.createElement("div");
  hotspotLayer.className = "mapHotspotLayer";

  buildMapStations(currentGame).forEach(point => {
    const spot = document.createElement("button");
    spot.type = "button";
    spot.className = `mapHotspot mapHotspot-${point.type}`;
    spot.style.left = `${point.xPct}%`;
    spot.style.top = `${point.yPct}%`;
    spot.textContent = markerText(point);
    spot.title = `${point.title}${point.cap ? ` · Cap Lv ${point.cap}` : ""}`;
    spot.addEventListener("click", (event) => {
      event.stopPropagation();
      mapImageContainer.querySelectorAll(".mapHotspot.selected").forEach(el => el.classList.remove("selected"));
      spot.classList.add("selected");
      mapInfoPanel.innerHTML = mapPointDetails(point);
    });
    hotspotLayer.appendChild(spot);
  });

  const legend = document.createElement("div");
  legend.className = "mapLegend";
  legend.innerHTML = `
    <span><b class="legendGym"></b>Arena</span>
    <span><b class="legendTown"></b>Stadt</span>
    <span><b class="legendRoute"></b>Route</span>
    <span><b class="legendPlace"></b>Ort</span>
  `;

  const notice = document.createElement("div");
  notice.className = "mapImageMissingNotice";
  notice.innerHTML = `Kein Kartenbild gefunden.<br>Lege <code>public${MAP_IMAGE_PATH}</code> ab.`;

  img.addEventListener("error", () => mapImageContainer.classList.add("missing"), { once: true });
  img.addEventListener("load", () => mapImageContainer.classList.remove("missing"), { once: true });

  mapImageContainer.append(img, hotspotLayer, legend, notice);
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
