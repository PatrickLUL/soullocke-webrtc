# Soullocke WebRTC

Private Browser-Spielansicht für bis zu 4 Spieler – gedacht für gemeinsame
Pokémon SoulLink-/Nuzlocke-Runs per Bildschirmfreigabe (WebRTC) mit
geteiltem Team-Tracking, Orden/Level-Cap und Karte.

**Aktuelle Version:** v8.10-sprites

## Features

- **Bildschirmfreigabe per WebRTC** (P2P über Socket.IO-Signaling), Qualität
  einstellbar (480p/20 FPS bis 1080p/60 FPS).
- **2×2-Raster** für bis zu 4 Spieler, Vollbild-Ansicht pro Kachel.
- **Team-Tracking pro Spieler:** 6 Slots mit Pokémon-Sprite (PokéAPI, Fallback
  auf pokemondb.net), Status `alive` / `dead` / `box`, deutsche Namen per
  Autocomplete (Gen 1). Klick auf einen Slot öffnet ein kleines Popup direkt
  daneben (Name-Eingabe + Status), keine separate Sidebar mehr.
- **Sprite-Leiste** sitzt als eigener Streifen oberhalb des Videos (kein
  Overlay mehr auf dem Stream).
- **Schlanke Topbar:** nur Kernaktionen (Raum, Name, Beitreten, Freigeben,
  Karte) direkt sichtbar; Qualität, Spielauswahl, Debug-Toggle, Team-Export
  und Team-leeren sitzen im ⚙-Einstellungen-Popup.
- **Orden-Tracker + Level-Cap:** pro Spieler einstellbar (0–16 Orden für
  HeartGold/SoulSilver), zeigt automatisch das passende Level-Cap an
  (echte Werte, siehe Quelle unten).
- **Spielauswahl:** aktuell HeartGold/SoulSilver, Struktur erweiterbar auf
  weitere Editionen (`GAMES`-Objekt in `public/app.js`).
- **Interaktive Karte:** schematische, anklickbare Übersicht aller Orden-Stationen
  (Johto → Kanto → Red), zeigt Gym-Leader, Ort und Level-Cap pro Station.
- **JSON-Export:** Team-Status (lebendig/tot/geboxt), Orden, Level-Cap und
  gewähltes Spiel für alle Spieler als Datei herunterladbar.
- **Debug-Toggle:** Verbindungs-/Stream-Debug-Infos pro Kachel global ein-/ausblendbar.

## Setup

```bash
npm install
node server.js
```

Standardport: `3000` (überschreibbar via `PORT`-Umgebungsvariable).
Raum-Link: `http://localhost:3000/room/<Raumcode>`

## Architektur

- `server.js` – Express-Server + Socket.IO-Signaling. Hält pro Raum:
  Spielerliste, Teams, Orden-Stände, gewähltes Spiel. Vermittelt WebRTC-
  Description/ICE zwischen Peers, leitet aber keine Mediendaten selbst weiter.
- `public/app.js` – kompletter Client: WebRTC-Verbindungsaufbau, Team-/Orden-
  UI, Karten-Rendering, JSON-Export.
- `public/index.html` / `public/style.css` – Markup & Styling.

## Level-Cap-Quelle

Die HeartGold/SoulSilver-Level-Caps basieren auf dem Level des stärksten
Pokémon jedes Gym-Leaders/Champions (Hardcore-Nuzlocke-Konvention), Quelle:
[Nuzlocke University – Hardcore Nuzlocke Level Caps by Generation](https://nuzlockeuniversity.ca/2022/01/18/hardcore-nuzlocke-level-caps-by-generation/).
Die Kanto-Orden-Reihenfolge ist im Spiel nicht zwingend vorgegeben; hier wird
die dort gelistete Reihenfolge (Pewter → Cerulean → Vermilion → Celadon →
Fuchsia → Saffron → Seafoam → Viridian) verwendet.

## Deploy

```bash
git add .
git commit -m "<Beschreibung der Änderung>"
git push
```

Bei Änderungen an `server.js` muss der laufende Server neu gestartet bzw.
neu deployed werden, damit neue Socket-Events greifen.

## Versionsverlauf

- **v8.10** – Topbar aufgeräumt (Einstellungen-Popup für Qualität, Spielauswahl,
  Debug-Toggle, Export, Team leeren). Pokémon-Auswahl von rechter Sidebar auf
  kleines Popup direkt am angeklickten Slot umgestellt.
- **v8.9** – Spielauswahl, Orden-Tracker mit echten Level-Cap-Werten,
  interaktive Karte, JSON-Export erweitert (Orden/Level-Cap/Spiel).
- **v8.8** – Debug-Toggle (global ein-/ausblendbar), JSON-Team-Export
  (lebendig/tot/geboxt pro Spieler).
- **v8.7** – Sprite-Leiste als eigener Streifen oberhalb des Videos
  (kein Overlay mehr), Tile-Layout auf Flexbox umgestellt.
- **v8.6** – Sprite-Leiste kompakter und transparenter (Overlay-Variante).
- **v8.5** – Größere Sprite-Slots, Status-Rahmenfarben, Team-Editor als
  rechte Sidebar statt zentriertem Overlay.
- **v8.4** – Stabile Basis: Autocomplete, deutsche Gen-1-Namen, PokéAPI-
  Sprite-URLs.
