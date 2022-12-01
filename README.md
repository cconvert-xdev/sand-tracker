---
description: Deploying on an other environement
---

# Deploy command lines

Deployment must be done with theses command lines.

```shell

#regenerate Params and subgraph.yaml from contractsInfo.<environment name>.json
node ./scripts/generate.js <environment name>
#<environment name> can be mumbai, rinkeby, mainnet ...

#regerate ts events from abis in subgraph.yaml and schema.ts entities from schema.graphql
graph codegen

#rebuild graph
graph build

#authenticate on thegraph space
graph auth --product hosted-service <token id>

#deploy subgraph on its space
graph deploy --product hosted-service <github name>/<repository name>
#For example <github name>/<repository name> can be: pixowl/sand-tracker

```

# Prerequisite

This graph is for traking Sand owned by a user on various staking contracts and on its own wallet.
event are generated with

```shell
graph codegen
```

in folder:

```
./generated/<Contract Name>/<Contract Name>.ts
```

# Editable parameters

All editable parameters are located in

```shell
./contractsInfo.<env>.json
```
