const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
const pairs = new Map();

function pairClients() {
  const unpaired = Array.from(clients).filter(c => !pairs.has(c));
  while (unpaired.length >= 2) {
    const a = unpaired.pop();
    const b = unpaired.pop();
    pairs.set(a, [a, b]);
    pairs.set(b, [a, b]);
  }
}

wss.on("connection", (ws) => {
  clients.add(ws);
  pairClients();

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (["offer", "answer", "ice-candidate"].includes(data.type)) {
        const peers = pairs.get(ws);
        if (peers) {
          peers.forEach(peer => {
            if (peer !== ws && peer.readyState === WebSocket.OPEN) {
              peer.send(JSON.stringify(data));
            }
          });
        }
        return;
      }
    } catch (e) {
      // message texte classique
    }

    const peers = pairs.get(ws);
    if (peers) {
      peers.forEach(peer => {
        if (peer !== ws && peer.readyState === WebSocket.OPEN) {
          peer.send(message);
        }
      });
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    const peers = pairs.get(ws);
    if (peers) {
      peers.forEach(p => {
        if (p !== ws) pairs.delete(p);
      });
    }
    pairs.delete(ws);
  });
});

// ======== FIX CSP ========
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  );
  next();
});

// ======== SERVE STATIC ========
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur HTTP + WebSocket lancé sur port ${PORT}`);
});
