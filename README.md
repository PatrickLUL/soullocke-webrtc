# Soullocke Private Game View

Private 4-Spieler-Spielübertragung mit Socket.io als Signaling und WebRTC für die Videos.

## Lokal testen

```bash
npm install
npm start
```

Dann öffnen:

```text
http://localhost:3000
```

Oder direkt:

```text
http://localhost:3000/room/test1
```

## Mit Freunden benutzen

Du musst das Projekt öffentlich hosten, z.B. auf Render, Railway, Fly.io oder deinem eigenen VPS.

Wichtig: Screen Share funktioniert außerhalb von localhost nur mit HTTPS.

## Ablauf

1. Host öffnet `/room/test1`.
2. Host gibt Namen ein und klickt `Raum beitreten`.
3. Host kopiert den Link und sendet ihn an Freunde.
4. Jeder tritt bei.
5. Jeder klickt `Spiel freigeben` und wählt Emulator/Spielfenster.
6. Discord kann weiter nur für Voice benutzt werden.

## Hinweise

- Maximal 4 Spieler.
- Der Server überträgt keine Videodaten.
- Der Server macht nur Signaling.
- Videos laufen per WebRTC Peer-to-Peer.
- Für Pokémon reichen 480p/20 FPS meistens völlig aus.
