const { call } = require("../lib/nebCall");
const _ = require("lodash");
const async = require("async");
const { program } = require("commander");
const fs = require("fs");
const { Log } = require("../lib/log");
const {
  convert2nas,
  convert2nax,
  convert2NaxBasic,
  period2Time,
} = require("../lib/nebUtil");
const { datetime } = require("../lib/utils");
const { contract } = require("../config/contract");
const Nebulas = require("nebulas");
const {
  initNeb,
  callContract,
  getAccState,
  getNebState,
} = require("../lib/nebulas");

const { sleep } = require("../lib/utils");

run();

async function run() {
  // load .env
  require("dotenv").config();

  // getGovAllNodesData(0);
  // getGovAllNodesData(1);
  // getGovAllNodesData(2);

  // generateCurrentGovVotes();

  // startGovernVote();

  // getNodeToVotes("switch");

  startGovernVote("switch");
}

async function getCurrentGovPeriod() {
  const currenGovPeriod = await call(
    "getCurrentGovPeriod",
    [],
    contract["mainnet"]["govern"]
  );

  console.log(`current govern period: ${currenGovPeriod}`);

  return currenGovPeriod;
}

async function getGovAllNodesData(govPeriod) {
  const file = `./logs/govern/${govPeriod}_gov_nodes.md`;
  const log = new Log(file);

  log.clear();
  const govNodes = await call(
    "getGovAllNodesData",
    [govPeriod],
    contract["mainnet"]["govern"]
  );

  const totalNodes = govNodes.length;

  log.write(`govern period: ${govPeriod}, total nodes: ${totalNodes}`);

  for (let node of govNodes) {
    log.write(`${node.node} ${node.count}`);
  }
}

async function getPeriodVoteList(govPeriod) {
  const file = `./logs/govern/${govPeriod}_gov_votes.md`;
  const log = new Log(file);
  log.clear();

  const govVoteItems = await call(
    "getPeriodVoteList",
    [govPeriod],
    contract["mainnet"]["govern"]
  );

  printGovVotes(log, govVoteItems);

  return govVoteItems;
}

// print log: govern votes
function printGovVotes(log, govVoteItems) {
  const totalVoteItems = govVoteItems.length;

  log.log(`total vote items: ${totalVoteItems}`);

  for (let item of govVoteItems) {
    let id;
    if (
      item.project.showType === "proposal" ||
      item.project.showType === "proposal-node-govern"
    ) {
      id = `NIP-${item.project.id}`;
    } else if (item.project.showType === "project") {
      id = `NP-${item.project.id}`;
    }

    log.write(
      `,${item.project.vote_id}, ${id}, ${item.project.title}, ${item.project.creator.username}`
    );
  }
}

async function generateCurrentGovVotes() {
  const currenGovPeriod = await getCurrentGovPeriod();
  return getPeriodVoteList(currenGovPeriod);
}

async function startGovernVote(node_id) {
  const currenGovPeriod = await getCurrentGovPeriod();

  const file_path = `./logs/govern/${currenGovPeriod}_${node_id}_gov_votes_do.md`;

  try {
    if (!fs.existsSync(file_path)) {
      // if not exist
      // generate current period's govern vote items to file
      console.log(`${file_path} is not exit, first to generate it.`);
      // generateGovVoteItems();
      return;
    }

    // load file: get all govern vote items(with vote option)
    // get all vote address list
    const allVoteListText = fs.readFileSync(file_path, "utf8");
    let allVoteList = [];
    let is_votes_format_right = true;

    allVoteListText.split(/\r?\n/).some((line) => {
      let line_arr = line.split(",");
      if (line) {
        // check format is right
        if (!checkGovernVoteOptionFormat(line_arr)) {
          console.log(line);
          console.log(
            "govern votes content format is not right, please check again"
          );

          is_votes_format_right = false;

          // exit loop
          return true;
        }
        allVoteList.push({
          option: convertVoteOptionValue(line_arr[0]),
          vote_id: line_arr[1],
          id: line_arr[2],
          title: line_arr[3],
          creator: line_arr[4],
        });
      }
    });

    if (!is_votes_format_right) {
      console.log(`govern votes content format is not right, stop!`);
      return;
    }

    console.log("get all govern vote items(with vote option)");
    console.log(allVoteList);

    // start to call contract to vote

    const { KEYSTORE, KEYSTORE_PWD, NEB_ENV } = process.env;
    console.log(KEYSTORE, KEYSTORE_PWD, NEB_ENV);

    const Neb = Nebulas.Neb;
    const neb = new Neb();

    console.log(`neb env: ${NEB_ENV}`);

    fs.readFile(KEYSTORE, async (err, key) => {
      if (err) throw err;
      const keystore = JSON.parse(key);

      initNeb(neb, NEB_ENV);

      const { accstate, acc, balance, nonce } = await getAccState(
        neb,
        keystore,
        KEYSTORE_PWD
      );

      const naxBalance = await getNaxBalance(keystore.address);

      console.log(
        `${keystore.address},  nas balance:${convert2nas(
          balance
        )} NAS, nax balance: ${convert2nax(naxBalance)}, nonce: ${nonce}`
      );

      const transferNonceStart = parseInt(nonce) + 1;

      allVoteList = allVoteList.map((vote, index) => {
        return Object.assign(vote, { nonce: transferNonceStart + index });
      });

      console.log("need call contract vote list");
      console.log(allVoteList);

      let nebstate = await getNebState(neb);

      initNeb(neb, NEB_ENV);

      allVoteList.forEach(async (vote, index) => {
        await sleep(2000);

        const nax = convert2NaxBasic(1);
        const { vote_id, option } = vote;

        // call tx to contract
        callContract(
          neb,
          acc,
          contract[NEB_ENV]["govern"],
          vote.nonce,
          "vote",
          [JSON.stringify({ voteId: vote_id, option }), JSON.stringify(nax)],
          nebstate,
          0,
          NEB_ENV
        );
      });
    });
  } catch (err) {
    console.error(err);
  }
}

function checkGovernVoteOptionFormat(arr) {
  const options = ["s", "o", "a"];
  if (arr.length === 5 && options.includes(arr[0].toLowerCase())) {
    return arr;
  }

  return false;
}

function convertVoteOptionValue(text) {
  let text_low = text.toLowerCase();
  if (text_low === "s") {
    return 1;
  }

  if (text_low === "o") {
    return 2;
  }

  if (text_low === "a") {
    return 3;
  }
}

// get node need to vote item list
async function getNodeToVotes(node_id) {
  const currenGovPeriod = await getCurrentGovPeriod();
  const currentGovVotes = await getPeriodVoteList(currenGovPeriod);

  const file = `./logs/govern/${currenGovPeriod}_${node_id}_gov_votes.md`;
  const log = new Log(file);
  log.clear();

  const options_key = ["yesList", "noList", "abstainedList"];

  let node_to_votes = [];

  currentGovVotes.forEach((vote) => {
    const node_is_voted = options_key.some((opt_key) =>
      vote[opt_key].includes(node_id)
    );
    if (!node_is_voted) {
      node_to_votes.push(vote);
    }
  });

  printGovVotes(log, node_to_votes);

  return node_to_votes;
}

// get address nax balance
async function getNaxBalance(addr) {
  const res = await call("balanceOf", [addr], contract["mainnet"]["nax"]);

  return parseInt(res);
}
