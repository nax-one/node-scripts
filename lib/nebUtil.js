const Nebulas = require("nebulas");
const Unit = Nebulas.Unit;

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
