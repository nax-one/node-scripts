const moment = require("moment");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const datetime = (timstamp, second = true) => {
  if (second) {
    return moment(timstamp).format("YYYY-MM-DD HH:mm");
  } else {
    return moment(timstamp * 1000).format("YYYY-MM-DD HH:mm");
  }
};

module.exports = { datetime };
