const fs = require("fs");
const path = require("path");
const { isClientOpen } = require("./websocket");
const metricDataSchema = require("./schema/MetricData");
const EventEmitter = require("events");
const csv = require("csv-parser");

const isValidData = (lineNumber, readableStream, data) => {
  try {
    metricDataSchema.parse(data);
    return true;
  } catch (err) {
    console.error("----------------");
    console.error("Data is invalid:", err.message);
    console.error(`Error on line ${lineNumber}.`);
    console.error("----------------");
    readableStream.destroy();
    return false;
  }
};

class DataUpdater {
  constructor(fileWatcher, filePath, wss) {
    this.fileWatcher = fileWatcher;
    this.filePath = filePath;
    this.wss = wss;
    this.dataEmitter = new EventEmitter();

    this.dataEmitter.on("broadcastUpdatedData", (updatedData) => {
      const json = JSON.stringify(updatedData);
      const encoder = new TextEncoder();
      const arrayBuffer = encoder.encode(json);

      this.wss.clients.forEach((client) => {
        if (isClientOpen(client)) {
          client.send(arrayBuffer);
        }
      });
    });

    this.dataEmitter.on("broadcastErrorOnData", () => {
      const errorMessage = {
        message: `There's an error on your metrics.csv file. Please check logs.`,
      };
  
      this.wss.clients.forEach((client) => {
        if (isClientOpen(client)) {
          client.send(JSON.stringify(errorMessage));
        }
      });
    });
  }

  broadcastUpdatedData() {
    const readableStream = fs.createReadStream(this.filePath);
    const results = [];
    let lineNumber = 2; // start after data headers

    readableStream
      .pipe(csv())
      .on("data", (data) => {
        if (isValidData(lineNumber, readableStream, data)) {
          lineNumber++;
          results.push(data);
        } else {
          this.dataEmitter.emit("broadcastErrorOnData");
        }
      })
      .on("error", (error) => {
        console.error("File error:", error.message);
      })
      .on("end", () => {
        if (results.length) {
          console.log("Data has been updated on your dashboard.");
          this.dataEmitter.emit("broadcastUpdatedData", results);
        }
      });
  }

  broadcastDeletedSourceFile() {
    const errorMessage = {
      message: `File ${path.basename(this.filePath)} does not exist.`,
    };

    this.wss.clients.forEach((client) => {
      if (isClientOpen(client)) {
        client.send(JSON.stringify(errorMessage));
      }
    });
  }
}

module.exports = DataUpdater;
