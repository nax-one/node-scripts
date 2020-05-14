const Nebulas = require("nebulas");
const fs = require("fs");
var _ = require("lodash");

const {
  initNeb,
  convert2nas,
  convert2nax,
  sendNas,
  getAccState,
  getNebState,
  callNode,
} = require("./lib/nebulas");

const { clear_log, log, asyncForEach } = require("./lib/utils");

const Neb = Nebulas.Neb;
const neb = new Neb();

initNeb(neb, "mainnet");

const log_file = `data.txt`;

const dayPeriodDuration = 27 * 7;

run();

async function run() {
  const sysInfo = await callNode("getSystemInfo");
  console.log("currentPeriod", sysInfo.currentPeriod);

  let latestPeriod = sysInfo.currentPeriod;
  let startPeriod = latestPeriod - dayPeriodDuration;

  // create day period list
  const periodList = getPeriodList(startPeriod, latestPeriod);

  console.log(periodList);

  let nodeList = [];

  // clear log
  clear_log();
  log(`\nNebulas Node Mint Statics`);
  log(`\nStatistic period: ${startPeriod} ~ ${latestPeriod - 1}`);
  log(`\nPowered by Nax.One`);
  log(`\n\n---------------------------------\n`);

  await Promise.all(
    periodList.map(async (p) => {
      const blockData = await callNode("getBlockData", [p]);
      console.log(`\nperiod: ${p}`);
      console.log(`=================================`);

      // console.log(blockData);

      blockData.forEach((bd) => {
        //   log(
        //     `\nname:${bd["node"]["info"]["name"]}  id:${bd["node"]["id"]} mint: ${bd["count"]} blocks`
        //   );
        //   log(`\n ---------------------------------`);

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

      // log(`=================================`);
    })
  ); // end: periodList.forEach

  //   console.log(nodeList);
  nodeList
    .sort((a, b) => a.rank - b.rank)
    .map((n) => {
      log(`\nnode name: ${n.name}   node id: ${n.id}`);
      log(`\nrank: ${n.rank}   nax: ${n.vote} NAX`);
      log(`\nblocks: ${n.totalMint}   mint: ${n.totalMint * 1.189} NAS`);
      log(`\n\n---------------------------------\n`);
    });
}

function getPeriodList(startPeriod, latestPeriod) {
  return _.range(startPeriod, latestPeriod);
}
