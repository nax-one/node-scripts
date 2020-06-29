# Nebulas Node Script

## Install

```
yarn
```

## Get all noes mint records

after execute script, view in `logs/mint/`

```
yarn mint
```

## Monitor all nodes's vote address statistic

after execute script, view in `logs/monitor/`

- get all vote address

```
yarn monitor
yarn monitor -a[ction] [v|vote]
```

- get address withdraw records

```
yarn monitor -a[ction] [w|withdraw]
```

- get all nax address balance

```
yarn monitor -a[ction] [b|balance]
```

## Get Nax.one Distribute records

after execute script, view in `logs/naxone/`

```
yarn naxone
```

## Node Govern vote

1. create .env.[nodeId] in `/env`
```
KEYSTORE=./keystore/[nodeId].json
KEYSTORE_PWD={keystore password}
NEB_ENV=mainnet
```
2. add node's keystore file to `/keystore/[nodeId].json`
3. run `yarn govern create [nodeId]`, vote file in `logs/govern/[gov_period]_[nodeId]_gov_votes.md`
4. edit `logs/govern/[gov_period]_[nodeId]_gov_votes.md`, add [s,o,a](support, oppose, abstain) to every line start. after add vote options done, change the filename to `logs/govern/[gov_period]_[nodeId]_gov_votes_do.md`
5. run `yarn govern create [nodeId]` again
6. check (node.nebulas.io/govern)[https://node.nebulas.io/govern]

