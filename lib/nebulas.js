const Nebulas = require("nebulas");
const Neb = Nebulas.Neb;
const neb = new Neb();
const Unit = Nebulas.Unit;

const gasPrice = 20000000000;
const gasLimit = 400000;

function initNeb(neb, net = "testnet") {
  neb.setRequest(new Nebulas.HttpRequest(`https://${net}.nebulas.io`));
}

function convert2nas(_value) {
  return parseFloat(Unit.fromBasic(_value, "nas")).toFixed(4);
}

function convert2nax(_value) {
  return parseInt(Unit.fromBasic(_value, "gwei")).toLocaleString();
}

async function getNebState(_neb) {
  const nebstate = await _neb.api.getNebState();
  return nebstate;
}

async function getAccState(_neb, keystore, config) {
  var Account = Nebulas.Account;
  var acc = new Account();
  acc = acc.fromKey(keystore, config.keystore_pwd, true);

  let address = acc.getAddressString();
  const accstate = await _neb.api.getAccountState(address);
  const balance = accstate.balance;

  // console.log(
  //   `${config.name} ${config.coinbase} 地址余额:${convert2nas(balance)} NAS`
  // );

  return {
    acc,
    nonce: accstate.nonce,
    balance,
    accstate,
  };
}

function sendNas(_neb, _acc, _value, _nonce, _to, _to_name, _nebstate) {
  var Transaction = Nebulas.Transaction;
  var tx = new Transaction({
    chainID: _nebstate.chain_id,
    from: _acc,
    to: _to,
    value: _value,
    nonce: _nonce,
    gasPrice,
    gasLimit,
  });
  tx.signTransaction();
  //send a transfer request to the NAS node
  _neb.api
    .sendRawTransaction({
      data: tx.toProtoString(),
    })
    .then((result) => {
      let txhash = result.txhash;
      let trigger = setInterval(() => {
        _neb.api.getTransactionReceipt({ hash: txhash }).then((receipt) => {
          console.log(`${_to_name} pending, status:`, receipt.status);
          if (receipt.status != 2) {
            //not in pending
            // console.log(JSON.stringify(receipt));

            if (receipt.status === 1) {
              console.log(
                `${_to_name} https://explorer.nebulas.io/#/tx/${
                  receipt.hash
                } 已发放${convert2nas(_value)} NAS`
              );
            }

            clearInterval(trigger);
          }
        });
      }, 2000);
    });
}

async function callNode(func, args = []) {
  initNeb(neb, "mainnet");

  const my_addr = "n1Y17jbmmhF8kLvcnyFE4Ds2TqHohVBvToV";
  const contract_add = "n214bLrE3nREcpRewHXF7qRDWCcaxRSiUdw";

  const tx = await neb.api.call({
    chainID: 1,
    from: my_addr,
    to: contract_add,
    value: 0,
    gasPrice,
    gasLimit,
    contract: {
      function: func,
      args: JSON.stringify(args),
    },
  });

  //code
  const result = JSON.parse(tx.result);
  return result;
}

module.exports = {
  initNeb,
  convert2nas,
  convert2nax,
  getNebState,
  getAccState,
  sendNas,
  callNode,
};
