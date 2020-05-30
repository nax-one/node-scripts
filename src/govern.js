import { call } from "../lib/nebCall";
import _ from "lodash";
import async from "async";
const { program } = require("commander");

const fs = require("fs");
const { Log } = require("../lib/log");
const {
  convert2nax,
  convert2NaxBasic,
  period2Time,
} = require("../lib/nebUtil");
const { datetime } = require("../lib/utils");
import { contract } from "../config/contract";

async function getUserNAXWithdrawList(addr) {
  const res = await call("getUserNAXWithdrawList", [addr]);
  return res;
}
