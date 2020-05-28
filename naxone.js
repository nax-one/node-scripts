import { call } from "./lib/nebCall";
import _ from "lodash";

const { Log } = require("./lib/log");
const { convert2nax, period2Time } = require("./lib/nebUtil");
import { contract } from "./config/contract";

run();

function run() {
  getNodeIncomes("naxone01");
  getNodeIncomes("naxone02");
}

async function getNodeIncomes(node_id) {
  const { lastPeriod, nowPeriod } = await getNodePeriods(node_id);

  const lastTime = period2Time(lastPeriod);
  const nowTime = period2Time(nowPeriod);

  // init log
  const log = new Log(
    `./logs/naxone/${lastPeriod}_${nowPeriod}_${node_id}.csv`
  );
  log.clear();

  const result = await call(
    "getNodeIncomes",
    [node_id, nowPeriod],
    contract["mainnet"]["naxone_distribute"]
  );

  log.write(
    `${node_id} 发放记录 return NAS records\n发放时间 return NAS time: ${lastTime} ~ ${nowTime}\n周期 period: ${lastPeriod} ~ ${nowPeriod}`
  );
  log.line("=");
  log.write(`投票地址 Vote address,投票数 Vote NAX,分红 NAS Reward`);

  result.forEach((d) => {
    const { address, vote, value, transfered } = d;

    if (transfered) {
      log.write(
        `${address},"${parseInt(vote).toLocaleString()} NAX",${value} NAS`
      );
    }
  });
}

async function getNodePeriods(node_id) {
  const result = await call(
    "getNodePeriods",
    [node_id],
    contract["mainnet"]["naxone_distribute"]
  );

  //code
  const res_len = result.length;

  const lastPeriod = result[res_len - 2];
  const nowPeriod = result[res_len - 1];

  return { lastPeriod, nowPeriod };
}
