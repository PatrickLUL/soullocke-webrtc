# Soullocke WebRTC v9.2-map-editor

Neu:
- Keine globale Node-Größe mehr.
- Jeder Marker hat eigene Größe.
- Jeder Marker hat eigene Form:
  - Kreis
  - Quadrat
  - Abgerundet
  - Rechteck
  - Pille
  - Diamant
- Live-Vorschau im Marker-Editor.
- Export JSON enthält `size` und `shape`.

Deploy:
```bash
git add .
git commit -m "add individual map marker size and shape"
git push
```
