const Nebulas = require("nebulas");
const fs = require("fs");
const {
  initNeb,
  convert2nas,
  convert2nax,
  sendNas,
  getAccState,
  getNebState,
} = require("./lib/nebulas");
const { getConfig } = require("./config");

const { clear_log, log, sleep } = require("./lib/utils");
const moment = require("moment");

const Unit = Nebulas.Unit;

const Neb = Nebulas.Neb;
const neb = new Neb();

// initNeb(neb, "mainnet");

// 分配规则
// 节点预留18%
// 剩余部分按照投票占比分配

const nodeName = "switch";
const distributeRatio = 0.82;

const distributeList = {
  out: [
    {
      address: "n1Sq9HnsvN9YspD9qd3mdGU8ApBwpnF5Q9X",
      name: "@光明",
    },
    {
      address: "n1NfuNVrbr982LdsauLxtejyUnNeQsYGWpN",
      name: "@砗磲苏州",
    },
  ],
  reserve: {
    address: "n1MtJExDte3W9JgEZNHG5dzmej4YwLMg8CD",
    name: "@lee.c",
  },
};

const my_addr = "n1Y17jbmmhF8kLvcnyFE4Ds2TqHohVBvToV";
const contract_add = "n214bLrE3nREcpRewHXF7qRDWCcaxRSiUdw";

const log_file = `${nodeName}.txt`;

const gasPrice = 20000000000;
const gasLimit = 400000;

const config = getConfig();

fs.readFile(config.keystore, async (err, key) => {
  if (err) throw err;
  const keystore = JSON.parse(key);

  initNeb(neb, "mainnet");

  const { accstate, acc, balance, nonce } = await getAccState(
    neb,
    keystore,
    config
  );

  clear_log();

  log("\n-----------------------------");

  log(
    `\n${config.name} ${config.coinbase} \n地址余额:${convert2nas(balance)} NAS`
  );

  const voteResult = await getVotes(nodeName);

  // caculate total nax vote
  let totalVote = 0;
  voteResult.forEach((vote) => {
    totalVote += parseInt(vote["value"]);
  });

  log(`\n总投票数: ${convert2nax(totalVote)} NAX`);

  // caculate total distribute amount
  let totalDistributeAmount = 0;

  // caculate addr vote ratio
  voteResult.forEach((vote) => {
    const findInDisList = distributeList["out"].find(
      (d) => d["address"] === vote["address"]
    );

    if (!findInDisList) {
      return;
    }

    // let log_vote = "\n-----------------------------\n";

    let ratio = (vote["value"] / totalVote) * 100;

    let distributeAmount = (balance * distributeRatio * ratio) / 100;

    totalDistributeAmount += distributeAmount;

    distributeList["out"] = distributeList["out"].map((d) => {
      if (d["address"] === vote["address"]) {
        d["value"] = vote["value"];
        d["ratio"] = ratio.toFixed(2);
        d["amount"] = distributeAmount;
      }

      return d;
    });
  });

  // 节点预留总计, 再预留5%作为 GAS 费
  distributeList["reserve"]["amount"] =
    (balance - totalDistributeAmount) * 0.95;

  let log_total_reserve = "\n-----------------------------\n";
  log_total_reserve += `节点预留: ${convert2nas(
    distributeList["reserve"]["amount"]
  )} NAS`;
  log(log_total_reserve);

  // 分发总计
  let log_total_distribute = "\n-----------------------------\n";
  log_total_distribute += `分发: ${convert2nas(totalDistributeAmount)} NAS`;
  log(log_total_distribute);

  distributeList["out"].forEach((d) => {
    let log_vote = "\n-----------------------------\n";

    log_vote += `投票地址: ${d["address"]}  投票人:${
      d["name"]
    }\n投票数:${convert2nax(d["value"])} NAX    占比: ${
      d["ratio"]
    }%\n应分配: ${convert2nas(d["amount"])} NAS`;
    log(log_vote);
  });

  // start transfer NAS

  initNeb(neb, "mainnet");

  let nebstate = await getNebState(neb);

  let transferNonce = parseInt(nonce) + 1;

  // transfer to my address
  console.log(
    "开始发放",
    transferNonce,
    distributeList["reserve"]["address"],
    distributeList["reserve"]["name"],
    `${convert2nas(distributeList["reserve"]["amount"])} NAS`
  );

  sendNas(
    neb,
    acc,
    distributeList["reserve"]["amount"],
    transferNonce,
    distributeList["reserve"]["address"],
    distributeList["reserve"]["name"],
    nebstate
  );

  // add nonce
  transferNonce += 1;

  // transfer to distribute out address
  distributeList["out"].forEach(async (d, index) => {
    await sleep(3000);

    transferNonce = transferNonce + index;
    console.log(
      "开始发放",
      transferNonce,
      d["address"],
      d["name"],
      `${convert2nas(d["amount"])} NAS`
    );

    sendNas(
      neb,
      acc,
      d["amount"],
      transferNonce,
      d["address"],
      d["name"],
      nebstate
    );
  });
});

async function getVotes(_nodeName) {
  initNeb(neb, "mainnet");
  const tx = await neb.api.call({
    chainID: 1,
    from: my_addr,
    to: contract_add,
    value: 0,
    gasPrice,
    gasLimit,
    contract: {
      function: "getNodeVoteStatistic",
      args: JSON.stringify([_nodeName]),
    },
  });

  //code
  const result = JSON.parse(tx.result);

  return result;
}
