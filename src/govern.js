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

run();

async function run() {
  getGovAllNodesData(0);
  getGovAllNodesData(1);
  getGovAllNodesData(2);
}

async function getGovAllNodesData(govPeriod) {
  const file = `./logs/govern/${govPeriod}_gov_nodes.md`;
  const log = new Log(file);

  log.clear();
  const govNodes = await call(
    "getGovAllNodesData",
    [govPeriod],
    contract["mainnet"]["govern"]
  );

  const totalNodes = govNodes.length;

  log.write(`govern period: ${govPeriod}, total nodes: ${totalNodes}`);

  for (let node of govNodes) {
    log.write(`${node.node} ${node.count}`);
  }
}
