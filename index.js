const http = require("http");
const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const initializeFileWatcher = require("./csv-file-watcher");
const { createWebSocketServer } = require("./websocket");
const DataUpdater = require("./data-updater");

const app = express();
const server = http.createServer(app);
const filePath = path.join(__dirname, "metrics.csv");

app.use(express.static(__dirname));

// initial webpage
app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text-plain" });
  res.end("Hello World\n");
});

// for loading initial metrics data from csv
app.get("/metrics", (req, res) => {
  if (!fs.existsSync(filePath)) {
    return res
      .status(400)
      .json({ message: `File ${path.basename(filePath)} does not exist.` });
  }

  const readableStream = fs.createReadStream(filePath);
  const results = [];
  readableStream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.json(results);
    });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

const fileWatcher = initializeFileWatcher(filePath, {
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100,
  },
});

const wss = createWebSocketServer({ port: 3000 });

// responsible for broadcasting updated data to front-end via websocket
const dataUpdater = new DataUpdater(fileWatcher, filePath, wss);
fileWatcher.on("add", () => {
  dataUpdater.broadcastUpdatedData();
});
fileWatcher.on("change", () => {
  dataUpdater.broadcastUpdatedData();
});
fileWatcher.on("unlink", () => {
  dataUpdater.broadcastDeletedSourceFile();
});
