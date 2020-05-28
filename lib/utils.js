const moment = require("moment");

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const datetime = (timstamp, second = true) => {
  if (second) {
    return moment(timstamp).format("YYYY-MM-DD HH:mm");
  } else {
    return moment(timstamp * 1000).format("YYYY-MM-DD HH:mm");
  }
};
