# Soullocke WebRTC v7-teams

Neu:
- Sichtbare Version: v7-teams
- Team-Overlay pro Spieler direkt in jeder Kachel
- Eigenes Team über „Bearbeiten“ pflegen
- 6 Slots pro Spieler
- Status pro Pokémon:
  - Lebendig
  - Tot
  - Box
- Teams werden über Socket.io im Raum synchronisiert
- WebRTC-Streaming basiert auf v6.1/v5-perfect

Deploy:
```bash
git add .
git commit -m "add pokemon team overlay"
git push
```

Hinweis:
Das Team ist vorerst raum-live im Server-Speicher. Wenn Render schläft oder der Raum leer wird, ist es weg.
Später können wir Speicherung per LocalStorage, Datenbank oder Raum-Export ergänzen.
