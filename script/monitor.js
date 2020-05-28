#!/usr/bin/env babel-node --
"use strict";

var _nebCall = require("../lib/nebCall");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _contract = require("../config/contract");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require("commander"),
    program = _require.program;

var fs = require("fs");

var _require2 = require("../lib/log"),
    Log = _require2.Log;

var _require3 = require("../lib/nebUtil"),
    convert2nax = _require3.convert2nax,
    convert2NaxBasic = _require3.convert2NaxBasic,
    period2Time = _require3.period2Time;

var _require4 = require("../lib/utils"),
    datetime = _require4.datetime;

async function run() {
  program.option("-a, --action <type>", "node monitor action", "vote");

  program.parse(process.argv);

  console.log(program.action);

  switch (program.action) {
    case "vote":
    case "v":
      // 1. get all vote address
      getAllVoteAddress();
      break;
    case "withdraw":
    case "w":
      // 2. get address withdraw records from file
      getAddrWithdrawFromFile();
      break;

    case "balance":
    case "b":
      // 3. get all nax address balance
      getAllBlance();
      break;
    default:
      break;
  }
}

run();

async function getNodeList() {
  var res = await (0, _nebCall.call)("getNodeList");
  return res;
}

async function getNodeVoteStatistic(nodeId) {
  var res = await (0, _nebCall.call)("getNodeVoteStatistic", [nodeId]);
  return res;
}

async function getUserNAXWithdrawList(addr) {
  var res = await (0, _nebCall.call)("getUserNAXWithdrawList", [addr]);
  return res;
}

// get address nax balance
async function getNaxBalance(addr) {
  var res = await (0, _nebCall.call)("balanceOf", [addr], _contract.contract["mainnet"]["nax"]);

  return parseInt(res);
}

async function getCurrent() {
  var sysInfo = await (0, _nebCall.call)("getSystemInfo");
  var latestPeriod = sysInfo.currentPeriod;
  var latestTime = period2Time(latestPeriod);
  return {
    period: latestPeriod,
    datetime: latestTime
  };
}

// get all nax address balance
async function getAllBlance() {
  var current = await getCurrent();

  var log = new Log("./logs/node-monitor/" + current.period + "_balance.md");
  log.clear();

  log.write(current.datetime + "(" + current.period + ")");

  var node_contract_balance = await getNaxBalance(_contract.contract["mainnet"]["proxy"]);
  log.write("node contract nax balance(" + _contract.contract["mainnet"]["proxy"] + "): " + convert2nax(node_contract_balance));

  var cool_wallet_balance = await getNaxBalance(_contract.contract["mainnet"]["cool"]);

  // fix cool wallet previous balance
  cool_wallet_balance -= convert2NaxBasic(636804);
  log.write("cool wallet nax balance(" + _contract.contract["mainnet"]["cool"] + "): " + convert2nax(cool_wallet_balance));

  var total_nax_balance = node_contract_balance + cool_wallet_balance;
  log.write("total nax balance: " + convert2nax(total_nax_balance));
}

// get address withdraw records from file
async function getAddrWithdrawFromFile() {
  var current = await getCurrent();

  var file_path = "./logs/node-monitor/" + current.period + "_votes.md";

  try {
    if (!fs.existsSync(file_path)) {
      // if not exist
      // generate current period's votes file
      getAllVoteAddress();
    }

    // get all vote address list
    var allVoteListText = fs.readFileSync(file_path, "utf8");
    var allVoteList = [];
    allVoteListText.split(/\r?\n/).forEach(function (line) {
      if (line) {
        allVoteList.push(line);
      }
    });
    console.log("get vote address withdraw record");
    console.log(allVoteListText);
    // get all vote address withdraw record list
    getAllWithdrawList(allVoteList);
  } catch (err) {
    console.error(err);
  }
}

// get all withdraw record list
async function getAllWithdrawList(allVoteList) {
  var current = await getCurrent();

  var log = new Log("./logs/node-monitor/" + current.period + "_withdraw.csv");
  log.clear();

  log.write(current.datetime + "(" + current.period + ")");

  var remainList = Array.from(allVoteList);

  _async2.default.mapLimit(allVoteList, 10, async function (address) {
    log.log("get [" + address + "] withdraw record ing...");

    var voteWithdrawList = await getUserNAXWithdrawList(address);
    log.log("get [" + address + "] withdraw record success.");

    _lodash2.default.remove(remainList, function (addr) {
      return addr === address;
    });
    var fetch_record_progress = (allVoteList.length - remainList.length) / allVoteList.length * 100;
    log.log("remain progress: " + fetch_record_progress.toFixed(2) + "%");

    // if exist withdraw record
    if (voteWithdrawList.length > 0) {
      log.log(address + " has withdraw record");
      return voteWithdrawList;
    }

    return [];
  }, function (err, results) {
    if (err) throw err;

    var totalWaitWithdrawNax = 0;

    // table head
    log.write("wait to withdraw,from addr,id,type,from node,withdraw time,status");

    // results is all vote address withdraw records
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = results[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var voteWithdrawList = _step.value;

        if (voteWithdrawList.length > 0) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = voteWithdrawList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var voteWithdraw = _step2.value;
              var id = voteWithdraw.id,
                  from = voteWithdraw.from,
                  type = voteWithdraw.type,
                  node = voteWithdraw.node,
                  value = voteWithdraw.value,
                  withdrawnTime = voteWithdraw.withdrawnTime,
                  status = voteWithdraw.status;

              log.write("\"" + convert2nax(value) + "\"," + from + "," + (id ? id : "-") + "," + type + ",\"" + node.info.name + "(" + node.id + ")\"," + datetime(withdrawnTime, false) + "," + status);

              totalWaitWithdrawNax += parseInt(value);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    log.write("total wait withdraw nax: " + convert2nax(totalWaitWithdrawNax));
  });
}

async function getAllVoteAddress() {
  var current = await getCurrent();

  // init log
  var log = new Log("./logs/node-monitor/" + current.period + "_nodes.md");

  // clear all log
  log.clear();

  // get all nodes
  var nodeList = await getNodeList();
  var remainList = Array.from(nodeList);

  // init all vote list array
  var allVoteList = [];

  _async2.default.mapLimit(nodeList, 10, async function (node) {
    log.log("get [" + node.id + "] vote statistic ing...");

    // get node's vote address list
    var nodeVoteList = await getNodeVoteStatistic(node.id);
    log.log("get [" + node.id + "] vote statistic success.");

    _lodash2.default.remove(remainList, function (n) {
      return n.id === node.id;
    });
    // log.log(`remain list: [${remainList.map((e) => e.id).join(",")}]`);

    var fetch_record_progress = (nodeList.length - remainList.length) / nodeList.length * 100;
    log.log("remain progress: " + fetch_record_progress.toFixed(2) + "%");

    return {
      node: {
        id: node.id,
        name: node.info.name
      },
      voteList: nodeVoteList
    };
  }, function (err, results) {
    if (err) throw err;
    // results is all nodes vote list
    //   log.write(results);

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = results[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var node = _step3.value;

        log.write(node.node.name + "(" + node.node.id + ")");
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          var _loop = function _loop() {
            var vote = _step5.value;

            log.write(vote.address + " " + convert2nax(vote.value));

            // find this vote addr in all vote list
            var findVoteIndex = allVoteList.findIndex(function (v) {
              return v.address === vote.address;
            });

            // if exist
            if (findVoteIndex >= 0) {
              allVoteList[findVoteIndex] = {
                address: vote.address,
                voteNodes: _lodash2.default.concat(allVoteList[findVoteIndex].voteNodes, {
                  node: {
                    id: node.node.id,
                    name: node.node.name
                  },
                  value: vote.value
                }),
                total: allVoteList[findVoteIndex].total + parseInt(vote.value)
              };
            } else {
              // no exist, add to `allVoteList`
              allVoteList.push({
                address: vote.address,
                voteNodes: [{
                  node: {
                    id: node.node.id,
                    name: node.node.name
                  },
                  value: vote.value
                }],
                total: parseInt(vote.value)
              });
            }
          };

          for (var _iterator5 = node.voteList[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            _loop();
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        log.line();
      } // end of results loop

      // start get all vote address vote detail
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    var log_votes = new Log("./logs/node-monitor/" + current.period + "_votes.md");
    log_votes.clear();

    var log_votes_detail = new Log("./logs/node-monitor/" + current.period + "_votes-detail.md");
    log_votes_detail.clear();

    log_votes_detail.line("=");
    log_votes_detail.write("allVoteList");
    log_votes_detail.line("=");
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = allVoteList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var _vote = _step4.value;

        log_votes.write(_vote.address);
        log_votes_detail.write(_vote.address + " " + convert2nax(_vote.total));
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = _vote.voteNodes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var voteNode = _step6.value;

            log_votes_detail.write(voteNode.node.id + " " + voteNode.node.name + " " + convert2nax(voteNode.value));
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }

        log_votes_detail.line();
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  } //end of callback
  );
}
