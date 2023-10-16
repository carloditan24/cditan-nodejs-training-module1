const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const initializeFileWatcher = (csvPath, options) => {
  const watcher = chokidar.watch(csvPath, options);

  watcher.on("ready", () => {
    console.log(`Watching for changes in ${csvPath}`);
  });

  watcher.on("add", (filePath) => {
    if(filePath.endsWith('metrics.csv')) {
      console.log("File metrics.csv has been created.");
    }
  });

  watcher.on("change", () => {
    console.log(`File ${csvPath} has been updated.`);
  });

  watcher.on("unlink", () => {
    console.log(`File ${csvPath} has been deleted.`);
  });

  watcher.on("error", (error) => {
    console.error("Error watching the file:", error);
  });

  return watcher;
};

module.exports = initializeFileWatcher;
