"use strict";

var _nebCall = require("../lib/nebCall");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _contract = require("../config/contract");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require("../lib/log"),
    Log = _require.Log;

var _require2 = require("../lib/nebUtil"),
    convert2nax = _require2.convert2nax,
    period2Time = _require2.period2Time;

run();

function run() {
  getNodeIncomes("naxone01");
  getNodeIncomes("naxone02");
}

async function getNodeIncomes(node_id) {
  var _ref = await getNodePeriods(node_id),
      lastPeriod = _ref.lastPeriod,
      nowPeriod = _ref.nowPeriod;

  var lastTime = period2Time(lastPeriod);
  var nowTime = period2Time(nowPeriod);

  // init log
  var log = new Log("./logs/naxone/" + lastPeriod + "_" + nowPeriod + "_" + node_id + ".csv");
  log.clear();

  var result = await (0, _nebCall.call)("getNodeIncomes", [node_id, nowPeriod], _contract.contract["mainnet"]["naxone_distribute"]);

  log.write(node_id + " \u53D1\u653E\u8BB0\u5F55 return NAS records\n\u53D1\u653E\u65F6\u95F4 return NAS time: " + lastTime + " ~ " + nowTime + "\n\u5468\u671F period: " + lastPeriod + " ~ " + nowPeriod);
  log.line("=");
  log.write("\u6295\u7968\u5730\u5740 Vote address,\u6295\u7968\u6570 Vote NAX,\u5206\u7EA2 NAS Reward");

  result.forEach(function (d) {
    var address = d.address,
        vote = d.vote,
        value = d.value,
        transfered = d.transfered;


    if (transfered) {
      log.write(address + ",\"" + parseInt(vote).toLocaleString() + " NAX\"," + value + " NAS");
    }
  });
}

async function getNodePeriods(node_id) {
  var result = await (0, _nebCall.call)("getNodePeriods", [node_id], _contract.contract["mainnet"]["naxone_distribute"]);

  //code
  var res_len = result.length;

  var lastPeriod = result[res_len - 2];
  var nowPeriod = result[res_len - 1];

  return { lastPeriod: lastPeriod, nowPeriod: nowPeriod };
}
