const Nebulas = require("nebulas");
const Neb = Nebulas.Neb;
const neb = new Neb();

const { gasPrice, gasLimit } = require("../config/common");
const { convert2nax, convert2nas } = require("./nebUtil");

function initNeb(neb, net = "testnet") {
  neb.setRequest(new Nebulas.HttpRequest(`https://${net}.nebulas.io`));
}

async function getNebState(_neb) {
  const nebstate = await _neb.api.getNebState();
  return nebstate;
}

async function getAccState(_neb, keystore, keystore_pwd) {
  var Account = Nebulas.Account;
  var acc = new Account();
  acc = acc.fromKey(keystore, keystore_pwd, true);

  let address = acc.getAddressString();
  const accstate = await _neb.api.getAccountState(address);
  const balance = accstate.balance;

  return {
    acc,
    nonce: accstate.nonce,
    balance,
    accstate,
  };
}

function sendNas(
  _neb,
  _acc,
  _value,
  _nonce,
  _to,
  _nebstate,
  _neb_env = "testnet"
) {
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
          console.log(`${_to} pending, status:`, receipt.status);
          if (receipt.status != 2) {
            //not in pending
            // console.log(JSON.stringify(receipt));

            if (receipt.status === 1) {
              let hash;
              if (_neb_env === "mainnet") {
                hash = `${_to} https://explorer.nebulas.io/#/tx/${receipt.hash}`;
              } else if (_neb_env === "testnet") {
                hash = `${_to} https://explorer.nebulas.io/#/${_neb_env}/tx/${receipt.hash}`;
              }

              console.log(`${hash} 已发放${convert2nas(_value)}`);
            }

            clearInterval(trigger);
          }
        });
      }, 2000);
    });
}

function callContract(
  _neb,
  _acc,
  _to,
  _nonce,
  _function,
  _args,
  _nebstate,
  _value = 0,
  _neb_env = "testnet"
) {
  var Transaction = Nebulas.Transaction;
  var tx = new Transaction({
    chainID: _nebstate.chain_id,
    from: _acc,
    to: _to,
    value: _value,
    nonce: _nonce,
    gasPrice,
    gasLimit,
    contract: {
      function: _function,
      args: JSON.stringify(_args),
    },
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
          console.log(`nonce: ${_nonce} pending, status:`, receipt.status);
          if (receipt.status != 2) {
            //not in pending
            // console.log(JSON.stringify(receipt));

            if (receipt.status === 1) {
              let hash;
              if (_neb_env === "mainnet") {
                hash = `https://explorer.nebulas.io/#/tx/${receipt.hash}`;
              } else if (_neb_env === "testnet") {
                hash = `https://explorer.nebulas.io/#/${_neb_env}/tx/${receipt.hash}`;
              }

              console.log(`nonce:${_nonce}  ${hash}`);
            }

            clearInterval(trigger);
          }
        });
      }, 2000);
    });
}

module.exports = {
  initNeb,
  getNebState,
  getAccState,
  sendNas,
  callContract,
};
