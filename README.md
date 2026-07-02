# Soullocke WebRTC v9.1-map-editor

Neu:
- Node-Größe ist über Slider einstellbar.
- Arena und Stadt sind jetzt ein gemeinsamer Typ: `Arena/Stadt`.
- Es gibt weiterhin normale `Stadt`-Nodes.
- Jeder Marker hat `encounterDone`.
- Grün = Encounter offen.
- Rot = Encounter verbraucht.
- Marker-Editor hat Toggle für Encounter verbraucht.
- Außerhalb vom Editor kann man beim ausgewählten Marker schnell Encounter offen/verbraucht toggeln.
- Export JSON enthält die Encounter-Werte.

Deploy:
```bash
git add .
git commit -m "improve map nodes and encounters"
git push
```
