# Soullocke WebRTC v10-links

Neu:
- SoulLink-Tracker unter dem Stream.
- Eine Zeile = ein gemeinsamer Encounter/Link-Ort.
- Spieler werden automatisch aus dem Raum übernommen.
- Pokémon-Feld anklicken öffnet Editor-Popup.
- Ort direkt in der Zeile auswählbar/eintippbar.
- Status pro Pokémon: Lebendig, Besiegt, Box, Bro-Failed.
- Zeilenfarbe:
  - Grün = Link lebt
  - Rot = besiegt/failed
  - Gelb = Box
- Links werden per Socket.io im Raum synchronisiert.
- Link-Export als JSON.
- Deine manuell angepassten Johto-Map-Marker sind als Default eingebaut.

Deploy:
```bash
git add .
git commit -m "add soullink tracker"
git push
```
