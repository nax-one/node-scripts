const Nebulas = require("nebulas");
const Unit = Nebulas.Unit;

const { datetime } = require("../lib/utils");

export const convert2nas = (_value) => {
  return parseFloat(Unit.fromBasic(_value, "nas")).toFixed(4);
};

export const convert2nax = (_value, suffix = "NAX") => {
  return `${convert2NaxNumber(_value).toLocaleString()} ${suffix}`;
};

export const convert2NaxNumber = (_value) => {
  return parseInt(Unit.fromBasic(_value, "gwei"));
};

export const convert2NaxBasic = (_value) => {
  return parseInt(Unit.toBasic(_value, "gwei"));
};

export const period2Time = (period) => {
  // env = mainnet
  const genesisTimestamp = 1522377330;
  const periodLength = 3150;

  return datetime((genesisTimestamp + period * periodLength) * 1000);
};
