# Soullocke WebRTC v9-map-editor

Neu:
- Map Editor direkt im Karten-Popup.
- Editor: An/Aus.
- Marker per Drag & Drop verschieben.
- Neue Marker hinzufügen: Route, Stadt, Arena, Ort.
- Marker bearbeiten: Name, Typ, Level-Cap.
- Marker löschen.
- Reset auf Standard.
- Export JSON kopiert die Marker in die Zwischenablage.
- Positionen werden lokal im Browser gespeichert.

Deploy:
```bash
git add .
git commit -m "add map editor"
git push
```

Hinweis:
Die bearbeiteten Marker werden aktuell im Browser-localStorage gespeichert.
Für dauerhaft geteilte Marker kann der exportierte JSON später in eine Datei wie `public/maps/johto.json` übernommen werden.
