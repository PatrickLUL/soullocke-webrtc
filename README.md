# Soullocke WebRTC v8-sprites

Neu:
- Stream-Größe bleibt wie Release 1 / v6.1.
- Pokémon-Team liegt als kleine Sprite-Leiste über dem Spielstream.
- Pro Spieler 6 Sprite-Slots.
- Beim eigenen Team: Klick auf Sprite-Leiste oder ✎ öffnet Editor.
- Eingabe per Pokémon-Name, z.B. `pikachu`, `charizard`, `mr-mime`.
- Status:
  - Lebendig
  - Tot
  - Box
- Teams werden im Raum synchronisiert.

Sprite-Quelle:
- PokémonDB Sprite-URLs per Pokémon-Name.

Deploy:
```bash
git add .
git commit -m "add sprite team overlay"
git push
```

Hinweis:
Teams sind aktuell nur im Server-Raum gespeichert. Wenn der Raum leer ist oder Render schläft, sind sie weg.
