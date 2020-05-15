const Nebulas = require("nebulas");
const fs = require("fs");
var _ = require("lodash");
const moment = require("moment");

const {
  initNeb,
  convert2nas,
  convert2nax,
  getAccState,
  getNebState,
  callNode,
} = require("./lib/nebulas");

const { clear_log, log, period2Time } = require("./lib/utils");

const Neb = Nebulas.Neb;
const neb = new Neb();

initNeb(neb, "mainnet");

const log_file = `data.md`;

const dayPeriodDuration = 27;

run();

async function run() {
  const sysInfo = await callNode("getSystemInfo");
  console.log("currentPeriod", sysInfo.currentPeriod);

  let latestPeriod = sysInfo.currentPeriod;
  let startPeriod = latestPeriod - dayPeriodDuration;

  let startTime = period2Time(startPeriod);
  let latestTime = period2Time(latestPeriod);

  // create day period list
  const periodList = getPeriodList(startPeriod, latestPeriod);

  console.log(periodList);

  let nodeList = [];

  // clear log
  clear_log(log_file);
  log(`\nNebulas Node Mint Statics`, log_file);
  log(
    `\n星云节点平台出块统计\n如需获取每日信息，请加小助手微信 naxone01`,
    log_file
  );
  log(
    `\nStatistic period: ${startPeriod}(${startTime}) ~ ${
      latestPeriod - 1
    }(${latestTime})`,
    log_file
  );
  log(`\nPowered by Nax.One`, log_file);
  log(`\n\n---------------------------------`, log_file);
  log(
    `\n\n| node name | node id | rank | vote nax | mint blocks | mint nas |`,
    log_file
  );
  log(
    `\n| ----------- | ----------- | ----------- | ----------- | ----------- | ----------- |`,
    log_file
  );

  await Promise.all(
    periodList.map(async (p) => {
      const blockData = await callNode("getBlockData", [p]);
      console.log(`\nperiod: ${p}`);
      console.log(`\n\n------------------------------`);

      // console.log(blockData);

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
      log(
        `\n| \`${n.name}\` | ${n.id} | ${n.rank} | ${n.vote} NAX | ${
          n.totalMint
        } | ${(n.totalMint * 1.189).toFixed(2)} NAS |`,
        log_file
      );
    });
}

function getPeriodList(startPeriod, latestPeriod) {
  return _.range(startPeriod, latestPeriod);
}
