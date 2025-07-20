const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- Servir les fichiers du dossier public ---
app.use(express.static(path.join(__dirname, "public")));

// --- WebSocket simple ---
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("✅ Nouveau client WebSocket");
  clients.add(ws);

  ws.on("message", (msg) => {
    // Diffuse le message à tous les autres clients
    for (let client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ Client déconnecté");
  });
});

// --- Lancer le serveur ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur HTTP + WebSocket lancé sur le port ${PORT}`);
});
