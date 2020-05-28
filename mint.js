const Nebulas = require("nebulas");

// const {
//   initNeb,
//   convert2nas,
//   convert2nax,
//   getAccState,
//   getNebState,
//   callNode,
// } = require("./lib/nebulas");

// const { clear_log, log, period2Time } = require("./lib/utils");

//

import { call } from "./lib/nebCall";
import _ from "lodash";

const { Log } = require("./lib/log");
const { convert2nax, period2Time } = require("./lib/nebUtil");
// import { contract } from "./config/contract";

// const Neb = Nebulas.Neb;
// const neb = new Neb();

// initNeb(neb, "mainnet");

const dayPeriodDuration = 27;

run();

async function run() {
  const sysInfo = await call("getSystemInfo");

  let latestPeriod = sysInfo.currentPeriod;
  let startPeriod = latestPeriod - dayPeriodDuration;

  let startTime = period2Time(startPeriod);
  let latestTime = period2Time(latestPeriod);

  // create day period list
  const periodList = getPeriodList(startPeriod, latestPeriod);
  let remainList = Array.from(periodList);

  // log.log(periodList);

  let nodeList = [];

  // init log
  const log = new Log(`./logs/mint/${startPeriod}_${latestPeriod - 1}.csv`);
  log.clear();

  // clear log
  log.write(`\nNebulas Node Mint Statics`);
  log.write(`星云节点平台出块统计\n如需获取每日信息，请加小助手微信 naxone01`);
  log.write(
    `Statistic period: ${startPeriod}(${startTime}) ~ ${
      latestPeriod - 1
    }(${latestTime})`
  );
  log.write(`\nPowered by Nax.One`);
  log.line("=");
  log.write(`rank,node name,node id,vote nax,mint blocks,mint nas`);

  await Promise.all(
    periodList.map(async (p) => {
      const blockData = await call("getBlockData", [p]);

      log.log(`period: ${p}`);

      _.remove(remainList, (prd) => p === prd);
      let fetch_record_progress =
        ((periodList.length - remainList.length) / periodList.length) * 100;
      log.log(`fetch progress: ${fetch_record_progress.toFixed(2)}%`);

      blockData.forEach((bd) => {
        const findInNodes = nodeList.find((n) => n.id === bd["node"]["id"]);

        if (!findInNodes) {
          nodeList.push({
            id: bd["node"]["id"],
            name: bd["node"]["info"]["name"],
            totalMint: parseInt(bd["count"]),
            vote: convert2nax(bd["node"]["voteValue"]),
            rank: parseInt(bd["node"]["currentRanking"]) + 1,
            mintHistory: [
              {
                period: p,
                mint: parseInt(bd["count"]),
              },
            ],
          });
        } else {
          nodeList = nodeList.map((n) => {
            if (n.id === bd["node"]["id"]) {
              n.totalMint += parseInt(bd["count"]);
              n.mintHistory.push({
                period: p,
                mint: parseInt(bd["count"]),
              });
            }

            return n;
          });
        }
      }); // end: blockData.forEach
    })
  ); // end: periodList.forEach

  //   console.log(nodeList);
  nodeList
    .sort((a, b) => a.rank - b.rank)
    .map((n) => {
      const totalMintNas = (n.totalMint * 1.189).toFixed(2);
      log.write(
        `${n.rank},""${n.name}",${n.id},"${n.vote} NAX",${n.totalMint},${totalMintNas} NAS`
      );
    });
}

function getPeriodList(startPeriod, latestPeriod) {
  return _.range(startPeriod, latestPeriod);
}
