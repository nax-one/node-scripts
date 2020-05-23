"use strict";
var Nebulas = require("nebulas");
const moment = require("moment");
const fs = require("fs");
const { clear_log, log, period2Time } = require("./lib/utils");

var Neb = Nebulas.Neb;
var neb = new Neb();

neb.setRequest(new Nebulas.HttpRequest("https://mainnet.nebulas.io"));

const gasPrice = 20000000000;
const gasLimit = 400000;

const my_addr = "n1Y17jbmmhF8kLvcnyFE4Ds2TqHohVBvToV";
const contract_add = "n1vNBd93kAjBx41J9hBbvd9b9NqveCTPuov";

const genesisTimestamp = 1522377330; // miannet
const periodLength = 3150;

clear_log("naxone01.md");
clear_log("naxone02.md");

getNodeIncomes("naxone01");
getNodeIncomes("naxone02");

async function getNodeIncomes(node_name) {


  const { lastPeriod, nowPeriod } = await getNodePeriods(node_name);

  const lastTime = period2Time(lastPeriod);
  const nowTime = period2Time(nowPeriod);

  const tx = await neb.api.call({
    chainID: 1,
    from: my_addr,
    to: contract_add,
    value: 0,
    gasPrice,
    gasLimit,
    contract: {
      function: "getNodeIncomes",
      args: JSON.stringify([node_name, nowPeriod]),
    },
  });

  //code
  // console.log(tx.result);
  let result = JSON.parse(tx.result);

  let log_datetime = `\n${node_name} 发放记录 return NAS records\n发放时间 return NAS time: ${lastTime} ~ ${nowTime}\n周期 period: ${lastPeriod} ~ ${nowPeriod}`;
  log(log_datetime, `${node_name}.md`);
  log("\n\n----------------------------------\n", `${node_name}.md`);
  log(
    `\n| 投票地址 Vote address | 投票数 Vote NAX | 分红 Return NAS |`,
    `${node_name}.md`
  );
  log(`\n| ---------- | ---------- | ---------- |`, `${node_name}.md`);

  result.forEach((d) => {
    const { address, vote, value, transfered } = d;

    if (transfered) {
      let log_str = `\n| ${address} | ${parseInt(vote).toLocaleString()} NAX | ${value} NAS |`;

      log(log_str, `${node_name}.md`);
    }
  });

  log("\n\n----------------------------------", `${node_name}.md`);
}


async function getNodePeriods(node_id) {
  const tx = await neb.api.call({
    chainID: 1,
    from: my_addr,
    to: contract_add,
    value: 0,
    gasPrice,
    gasLimit,
    contract: {
      function: "getNodePeriods",
      args: JSON.stringify([node_id]),
    },
  });

  //code
  
  let result = JSON.parse(tx.result);
  const res_len = result.length;

  const lastPeriod = result[res_len - 2];
  const nowPeriod = result[res_len - 1];;

  console.log(node_id, lastPeriod, nowPeriod);

  return {lastPeriod, nowPeriod};

}