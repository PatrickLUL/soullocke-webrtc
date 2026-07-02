# Soullocke WebRTC v10.2-links-fix

Fix:
- Link-Zeilen werden jetzt korrekt aufgebaut.
- Pokémon-Zellen sind wieder sichtbar und anklickbar.
- Aktionen ↑ ↓ × bleiben rechts in der Aktionsspalte.
- Das Pokémon-Auswahl-Popup bleibt über dem Modal.
- Version oben: v10.2-links.

Ursache:
CSS `repeat(var(--player-count), ...)` war im Grid unzuverlässig. Die Spalten werden jetzt direkt per JavaScript gesetzt.

Deploy:
```bash
git add .
git commit -m "fix soullink tracker grid"
git push
```
