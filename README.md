# Soullocke WebRTC Stable v2

Fix für schwarze Remote-Videos:

- Video-Elemente sind jetzt muted/autoplay/playsinline.
- Nach attachStreamToTile wird explizit video.play() ausgeführt.
- Empfangene Streams werden separat in activeStreams gespeichert.
- Cache-Buster `?v=2` für CSS/JS.

## Deploy

Dateien ersetzen, dann:

```bash
git add .
git commit -m "fix remote video playback"
git push
```

Danach Render neu deployen lassen und im Browser mit Strg+F5 hart neu laden.
