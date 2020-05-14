const my_addr = "n1Y17jbmmhF8kLvcnyFE4Ds2TqHohVBvToV";
const contract_add = "n214bLrE3nREcpRewHXF7qRDWCcaxRSiUdw";

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
  keystore: "./coinbase/switch.json",
  keystore_pwd: "121513",
  coinbase: "n1KFrw6zqMdqavzPhCvLisX4VefmZviRwz6",
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

const configs = {
  switch: config_switch,
  goboost: config_testnet_goboost,
};

module.exports = {
  getConfig: function (key = "switch") {
    return configs[key];
  },
};
