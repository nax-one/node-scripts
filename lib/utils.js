const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(log_text, log_file = "./log.txt") {
  console.log(log_text);
  fs.writeFileSync(log_file, log_text, { flag: "a" });
}

function clear_log(log_file = "./log.txt") {
  fs.writeFileSync(log_file, "");
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = { clear_log, log, sleep, asyncForEach };
