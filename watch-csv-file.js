const chokidar = require("chokidar");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");

const dataEmitter = new EventEmitter();
const metricDataSchema = require("./schema/MetricData");
const csvFilePath = path.join(__dirname, "metrics.csv");

const { createWebSocketServer, isClientOpen } = require("./websocket");
const wss = createWebSocketServer({ port: 3000 });

const watcher = chokidar.watch(csvFilePath, {
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100,
  },
});

const validateData = (readableStream, data) => {
  try {
    metricDataSchema.parse(data);
  } catch (err) {
    console.error("Data is invalid:", err.message);
    readableStream.destroy();
    return;
  }
};

const getUpdatedData = (path) => {
  const readableStream = fs.createReadStream(csvFilePath);
  const results = [];
  readableStream
    .pipe(csv())
    .on("data", (data) => {
      validateData(readableStream, data);
      results.push(data);
    })
    .on("error", (error) => {
      console.error("File error:", error.message);
    })
    .on("end", () => {
      if (results.length) {
        console.log(`File ${path} has been updated.`);
        dataEmitter.emit("dataUpdated", results);
      }
    });
};

dataEmitter.on("dataUpdated", (updatedData) => {
  const json = JSON.stringify(updatedData);
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(json);

  wss.clients.forEach((client) => {
    if (isClientOpen(client)) {
      client.send(arrayBuffer);
    }
  });
});

watcher.on("change", () => {
  getUpdatedData(csvFilePath);
});

watcher.on("error", (error) => {
  console.error("Error watching the file:", error);
});

console.log(`Watching for changes in ${csvFilePath}`);
