const Nebulas = require("nebulas");
const Unit = Nebulas.Unit;

export const convert2nas = (_value) => {
  return parseFloat(Unit.fromBasic(_value, "nas")).toFixed(4);
};

export const convert2nax = (_value, suffix = "NAX") => {
  return `${parseInt(
    Unit.fromBasic(_value, "gwei")
  ).toLocaleString()} ${suffix}`;
};
