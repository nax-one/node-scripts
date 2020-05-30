import { call } from "../lib/nebCall";
import _ from "lodash";
import async from "async";
const { program } = require("commander");
import { contract } from "../config/contract";
const { Log } = require("../lib/log");
const fs = require("fs");

run();

async function run() {
  // const result = await getUserNASWithdrawList(
  //   "n1YvrCZhZdcwQbk4iv4SxSPQHGutymk5ory"
  // );
  // console.log(result);
  // const result = await getGovAllNodesData(1);
  // console.log(result);
  // getNodeList();

  getGovAllNodesData(1);
}

async function getUserNASWithdrawList(addr) {
  const res = await call("getUserNASWithdrawList", [addr]);
  return res;
}

async function getGovAllNodesData(govPeriod) {
  const allGovNodes = await call(
    "getGovAllNodesData",
    [govPeriod],
    contract["mainnet"]["govern"]
  );

  const nodes_file = `./logs/vote/node_list.json`;
  const allNodesText = fs.readFileSync(nodes_file, "utf8");

  const allNodes = JSON.parse(allNodesText);

  let govNodesDetail = [];

  const log = new Log(`./logs/vote/gov_email.md`);
  log.clear();

  // 把对应 allGovNodes 中的 node detail push 到 govNodesDetail
  for (let govNode of allGovNodes) {
    for (let node of allNodes) {
      if (node.id === govNode.node) {
        govNodesDetail.push(node);

        log.write(`${node.info.email}`);
      }
    }
  }

  console.log(govNodesDetail);
}

async function getNodeList(addr) {
  const res = await call("getNodeList", [addr]);
  const log = new Log(`./logs/vote/node_list.json`);
  log.clear();

  log.write(JSON.stringify(res));
}
