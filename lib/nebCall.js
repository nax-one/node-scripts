import Nebulas from "nebulas";
import { gasPrice, gasLimit } from "../config/common";
import { contract } from "../config/contract";

const Neb = Nebulas.Neb;
const neb = new Neb();

const neb_env = "mainnet";

function _initNeb(neb, net = neb_env) {
  neb.setRequest(new Nebulas.HttpRequest(`https://${net}.nebulas.io`));
}

async function call(
  func,
  args = [],
  contract_addr = contract[neb_env]["proxy"]
) {
  _initNeb(neb, neb_env);
  const call_addr = "n1Y17jbmmhF8kLvcnyFE4Ds2TqHohVBvToV";

  const tx = await neb.api.call({
    chainID: 1,
    from: call_addr,
    to: contract_addr,
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

export { call };
