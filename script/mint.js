"use strict";

var _nebCall = require("../lib/nebCall");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require("../lib/log"),
    Log = _require.Log;

var _require2 = require("../lib/nebUtil"),
    convert2nax = _require2.convert2nax,
    period2Time = _require2.period2Time;

var dayPeriodDuration = 27;

run();

async function run() {
  var sysInfo = await (0, _nebCall.call)("getSystemInfo");

  var latestPeriod = sysInfo.currentPeriod;
  var startPeriod = latestPeriod - dayPeriodDuration;

  var startTime = period2Time(startPeriod);
  var latestTime = period2Time(latestPeriod);

  // create day period list
  var periodList = getPeriodList(startPeriod, latestPeriod);
  var remainList = Array.from(periodList);

  var nodeList = [];

  // init log
  var log = new Log("./logs/mint/" + startPeriod + "_" + (latestPeriod - 1) + ".csv");
  log.clear();

  // clear log
  log.write("\nNebulas Node Mint Statics");
  log.write("\u661F\u4E91\u8282\u70B9\u5E73\u53F0\u51FA\u5757\u7EDF\u8BA1\n\u5982\u9700\u83B7\u53D6\u6BCF\u65E5\u4FE1\u606F\uFF0C\u8BF7\u52A0\u5C0F\u52A9\u624B\u5FAE\u4FE1 naxone01");
  log.write("Statistic period: " + startPeriod + "(" + startTime + ") ~ " + (latestPeriod - 1) + "(" + latestTime + ")");
  log.write("\nPowered by Nax.One");
  log.line("=");
  log.write("rank,node name,node id,vote nax,mint blocks,mint nas");

  await Promise.all(periodList.map(async function (p) {
    var blockData = await (0, _nebCall.call)("getBlockData", [p]);

    log.log("period: " + p);

    _lodash2.default.remove(remainList, function (prd) {
      return p === prd;
    });
    var fetch_record_progress = (periodList.length - remainList.length) / periodList.length * 100;
    log.log("fetch progress: " + fetch_record_progress.toFixed(2) + "%");

    blockData.forEach(function (bd) {
      var findInNodes = nodeList.find(function (n) {
        return n.id === bd["node"]["id"];
      });

      if (!findInNodes) {
        nodeList.push({
          id: bd["node"]["id"],
          name: bd["node"]["info"]["name"],
          totalMint: parseInt(bd["count"]),
          vote: convert2nax(bd["node"]["voteValue"]),
          rank: parseInt(bd["node"]["currentRanking"]) + 1,
          mintHistory: [{
            period: p,
            mint: parseInt(bd["count"])
          }]
        });
      } else {
        nodeList = nodeList.map(function (n) {
          if (n.id === bd["node"]["id"]) {
            n.totalMint += parseInt(bd["count"]);
            n.mintHistory.push({
              period: p,
              mint: parseInt(bd["count"])
            });
          }

          return n;
        });
      }
    }); // end: blockData.forEach
  })); // end: periodList.forEach

  //   console.log(nodeList);
  nodeList.sort(function (a, b) {
    return a.rank - b.rank;
  }).map(function (n) {
    var totalMintNas = (n.totalMint * 1.189).toFixed(2);
    log.write(n.rank + ",\"" + n.name + "\"," + n.id + ",\"" + n.vote + "\"," + n.totalMint + "," + totalMintNas + " NAS");
  });
}

function getPeriodList(startPeriod, latestPeriod) {
  return _lodash2.default.range(startPeriod, latestPeriod);
}
