const Nebulas = require("nebulas");
const fs = require("fs");
const {
  initNeb,
  convert2nas,
  sendNas,
  getAccState,
  getNebState,
} = require("./lib/nebulas");

const { sleep } = require("./lib/utils");

const Unit = Nebulas.Unit;

const Neb = Nebulas.Neb;
const neb = new Neb();

initNeb(neb, "mainnet");

const my_addr = "n1Y17jbmmhF8kLvcnyFE4Ds2TqHohVBvToV";

const config_gogoboost = {
  name: "gogoboost",
  to_name: "@砗磲苏州",
  to_my_name: "@leec",
  keystore: "./coinbase/gogoboost.json",
  keystore_pwd: "121513",
  coinbase: "n1YvrCZhZdcwQbk4iv4SxSPQHGutymk5ory",
  to_addr: "n1NfuNVrbr982LdsauLxtejyUnNeQsYGWpN",
  to_my: my_addr,
};

const config_switch = {
  name: "switch",
  to_name: "@光明",
  to_my_name: "@leec",
  keystore: "./coinbase/switch.json",
  keystore_pwd: "121513",
  coinbase: "n1KFrw6zqMdqavzPhCvLisX4VefmZviRwz6",
  to_addr: "n1Sq9HnsvN9YspD9qd3mdGU8ApBwpnF5Q9X",
  to_my: my_addr,
};

const config_testnet_goboost = {
  to_name: "@gogoboost coinbase",
  to_my_name: "@leec",
  keystore: "./coinbase/testnet-goboost.json",
  keystore_pwd: "nodelicheng996",
  coinbase: "n1ThThjESrCDTictwGQuKtoWThMaVF8CFUm",
  to_addr: config_switch.coinbase,
  to_my: config_gogoboost.coinbase,
};

const config = config_switch;

// load keystore

fs.readFile(config.keystore, async (err, key) => {
  if (err) throw err;
  const keystore = JSON.parse(key);
  //   console.log(keystore);

  const nebstate = await getNebState(neb);

  const { accstate, acc, balance, nonce } = await getAccState(
    neb,
    keystore,
    config
  );

  // (余额 - 1nas )/2
  const _value = Math.floor(
    (balance - Unit.toBasic(1, "nas").toString(10)) / 2
  );

  //   const _value = Unit.toBasic(5, "nas").toString(10); // 1 NAS
  console.log(`即将各自发放: ${convert2nas(_value)} NAS`);

  let _nonce = parseInt(nonce) + 1;

  //generate transfer
  // 发送给客户
  console.log("开始发放", config.to_addr, config.to_name);
  sendNas(neb, acc, _value, _nonce, config.to_addr, config.to_name, nebstate);

  // 等待
  sleep(3000).then(() => {
    console.log("开始发放", config.to_my, config.to_my_name);
    // 发送给自己
    sendNas(
      neb,
      acc,
      _value,
      _nonce + 1,
      config.to_my,
      config.to_my_name,
      nebstate
    );
  });
});
