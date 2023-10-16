const WebSocket = require("ws");

const createWebSocketServer = (server) => {
  const wss = new WebSocket.Server(server);

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return wss;
}

const isClientOpen = (client) => {
    return client.readyState === WebSocket.OPEN;
}

module.exports = { createWebSocketServer, isClientOpen };
