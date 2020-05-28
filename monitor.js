import { call } from "./lib/nebCall";
import _ from "lodash";
import async from "async";

const fs = require("fs");
const { Log } = require("./lib/log");
const { convert2nax, convert2NaxBasic } = require("./lib/nebUtil");
const { datetime } = require("./lib/utils");
import { contract } from "./config/contract";

async function run() {
  // 1. get all vote address
  // getAllVoteAddress();

  // 2. get address withdraw records from file
  // getAddrWithdrawFromFile();

  // 3. get all nax address balance
  getAllBlance();
}

run();

async function getNodeList() {
  const res = await call("getNodeList");
  return res;
}

async function getNodeVoteStatistic(nodeId) {
  const res = await call("getNodeVoteStatistic", [nodeId]);
  return res;
}

async function getUserNAXWithdrawList(addr) {
  const res = await call("getUserNAXWithdrawList", [addr]);
  return res;
}

// get address nax balance
async function getNaxBalance(addr) {
  const res = await call("balanceOf", [addr], contract["mainnet"]["nax"]);

  return parseInt(res);
}

// get all nax address balance
async function getAllBlance() {
  const log = new Log("./logs/node-monitor/balance.md");
  log.clear();

  const node_contract_balance = await getNaxBalance(
    contract["mainnet"]["proxy"]
  );
  log.write(
    `node contract nax balance(${contract["mainnet"]["proxy"]}): ${convert2nax(
      node_contract_balance
    )}`
  );

  let cool_wallet_balance = await getNaxBalance(contract["mainnet"]["cool"]);

  // fix cool wallet previous balance
  cool_wallet_balance -= convert2NaxBasic(636804);
  log.write(
    `cool wallet nax balance(${contract["mainnet"]["cool"]}): ${convert2nax(
      cool_wallet_balance
    )}`
  );

  const total_nax_balance = node_contract_balance + cool_wallet_balance;
  log.write(`total nax balance: ${convert2nax(total_nax_balance)}`);
}

// get address withdraw records from file
function getAddrWithdrawFromFile() {
  // get all vote address list
  const allVoteListText = fs.readFileSync(
    "./logs/node-monitor/votes.md",
    "utf8"
  );
  const allVoteList = [];
  allVoteListText.split(/\r?\n/).forEach((line) => {
    if (line) {
      allVoteList.push(line);
    }
  });
  console.log("get vote address withdraw record");
  console.log(allVoteListText);
  // get all vote address withdraw record list
  getAllWithdrawList(allVoteList);
}

// get all withdraw record list
function getAllWithdrawList(allVoteList) {
  const log = new Log("./logs/node-monitor/withdraw.csv");
  log.clear();

  let remainList = Array.from(allVoteList);

  async.mapLimit(
    allVoteList,
    10,
    async function (address) {
      log.log(`get [${address}] withdraw record ing...`);

      const voteWithdrawList = await getUserNAXWithdrawList(address);
      log.log(`get [${address}] withdraw record success.`);

      _.remove(remainList, (addr) => addr === address);
      let fetch_record_progress =
        ((allVoteList.length - remainList.length) / allVoteList.length) * 100;
      log.log(`remain progress: ${fetch_record_progress.toFixed(2)}%`);

      // if exist withdraw record
      if (voteWithdrawList.length > 0) {
        log.log(`${address} has withdraw record`);
        return voteWithdrawList;
      }

      return [];
    },
    (err, results) => {
      if (err) throw err;

      let totalWaitWithdrawNax = 0;

      // table head
      log.write(
        `wait to withdraw,from addr,id,type,from node,withdraw time,status`
      );

      // results is all vote address withdraw records
      for (const voteWithdrawList of results) {
        if (voteWithdrawList.length > 0) {
          for (const voteWithdraw of voteWithdrawList) {
            const {
              id,
              from,
              type,
              node,
              value,
              withdrawnTime,
              status,
            } = voteWithdraw;
            log.write(
              `"${convert2nax(value)}",${from},${id ? id : "-"},${type},"${
                node.info.name
              }(${node.id})",${datetime(withdrawnTime, false)},${status}`
            );

            totalWaitWithdrawNax += parseInt(value);
          }
        }
      }

      log.write(
        `total wait withdraw nax: ${convert2nax(totalWaitWithdrawNax)}`
      );
    }
  );
}

async function getAllVoteAddress() {
  // init log
  let log = new Log("./logs/node-monitor/nodes.md");

  // clear all log
  log.clear();

  // get all nodes
  let nodeList = await getNodeList();
  let remainList = Array.from(nodeList);

  // init all vote list array
  let allVoteList = [];

  async.mapLimit(
    nodeList,
    10,
    async function (node) {
      log.log(`get [${node.id}] vote statistic ing...`);

      // get node's vote address list
      const nodeVoteList = await getNodeVoteStatistic(node.id);
      log.log(`get [${node.id}] vote statistic success.`);

      _.remove(remainList, (n) => n.id === node.id);
      // log.log(`remain list: [${remainList.map((e) => e.id).join(",")}]`);

      let fetch_record_progress =
        ((allVoteList.length - remainList.length) / nodeList.length) * 100;
      log.log(`remain progress: ${fetch_record_progress.toFixed(2)}%`);

      return {
        node: {
          id: node.id,
          name: node.info.name,
        },
        voteList: nodeVoteList,
      };
    },
    (err, results) => {
      if (err) throw err;
      // results is all nodes vote list
      //   log.write(results);

      for (const node of results) {
        log.write(`${node.node.name}(${node.node.id})`);
        for (const vote of node.voteList) {
          log.write(`${vote.address} ${convert2nax(vote.value)}`);

          // find this vote addr in all vote list
          const findVoteIndex = allVoteList.findIndex(
            (v) => v.address === vote.address
          );

          // if exist
          if (findVoteIndex >= 0) {
            allVoteList[findVoteIndex] = {
              address: vote.address,
              voteNodes: _.concat(allVoteList[findVoteIndex].voteNodes, {
                node: {
                  id: node.node.id,
                  name: node.node.name,
                },
                value: vote.value,
              }),
              total: allVoteList[findVoteIndex].total + parseInt(vote.value),
            };
          } else {
            // no exist, add to `allVoteList`
            allVoteList.push({
              address: vote.address,
              voteNodes: [
                {
                  node: {
                    id: node.node.id,
                    name: node.node.name,
                  },
                  value: vote.value,
                },
              ],
              total: parseInt(vote.value),
            });
          }
        }
        log.line();
      } // end of results loop

      // start get all vote address vote detail
      const log_votes = new Log("./logs/node-monitor/votes.md");
      log_votes.clear();

      const log_votes_detail = new Log("./logs/node-monitor/votes-detail.md");
      log_votes_detail.clear();

      log_votes_detail.line("=");
      log_votes_detail.write("allVoteList");
      log_votes_detail.line("=");
      for (const vote of allVoteList) {
        log_votes.write(vote.address);
        log_votes_detail.write(`${vote.address} ${convert2nax(vote.total)}`);
        for (const voteNode of vote.voteNodes) {
          log_votes_detail.write(
            `${voteNode.node.id} ${voteNode.node.name} ${convert2nax(
              voteNode.value
            )}`
          );
        }
        log_votes_detail.line();
      }
    } //end of callback
  );
}
