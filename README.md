# Soullocke WebRTC v5-perfect

Diese Version ersetzt die alte 2-Verbindungen-pro-Spieler-Logik.

Neu:
- Oben sichtbar: v5-perfect
- Pro Spielerpaar nur noch eine RTCPeerConnection
- Perfect Negotiation Pattern gegen Offer-Kollisionen
- Bidirektionale Streams über dieselbe Peer-Verbindung
- Debug bleibt drin

Deploy:
```bash
git add .
git commit -m "use perfect negotiation webrtc"
git push
```

Test-Reihenfolge:
1. Beide dem Raum beitreten.
2. Patrick startet Stream.
3. Warten, ob S2 Patrick sieht.
4. S2 startet Stream.
5. Prüfen, ob Patrick S2 sieht.
