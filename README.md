# Soullocke WebRTC v6-performance

Neu:
- Sichtbare Version: v6-performance
- Qualitätsauswahl:
  - 480p / 20 FPS
  - 720p / 30 FPS
  - 1080p / 60 FPS
- Debug pro Kachel:
  - Auflösung
  - FPS
  - Bitrate
  - RTT/Ping
  - Jitter
  - Packet Loss
  - Frames dropped
- Upload-Qualität wird über RTCRtpSender.setParameters gesetzt.
- Capture-Auflösung/FPS werden beim Start der Bildschirmfreigabe gewählt.

Wichtig:
Wenn du die Capture-Auflösung wechselst, musst du den Stream kurz stoppen und neu starten.
Die Sender-Bitrate/FPS kann live angepasst werden.

Deploy:
```bash
git add .
git commit -m "add v6 performance controls"
git push
```
