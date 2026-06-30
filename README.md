# Soullocke WebRTC Stable

Stabilere 4-Spieler-Version für private Spielübertragung.

## Lokal testen

```bash
npm install
npm start
```

Dann:

```text
http://localhost:3000/room/Raum1
```

## Render

Build Command:

```text
npm install
```

Start Command:

```text
npm start
```

Nach dem Push zu GitHub macht Render automatisch ein neues Deploy.

## Wichtig

Ohne TURN-Server funktioniert WebRTC bei den meisten Heimnetzwerken, aber nicht bei allen.
Falls ein Freund trotz HTTPS keine Streams sieht, brauchen wir später noch TURN.
