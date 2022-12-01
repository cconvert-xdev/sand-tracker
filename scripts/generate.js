const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");

const args = process.argv.slice(2);
const chainName = args[0];
const pathArg = `./contractsInfo.${chainName}.json`;

console.log({ pathArg, chainName });

if (!pathArg) {
  console.error(
    `please provide the path to contracts info, either a directory of deployemnt or a single export file`
  );
}
if (!fs.existsSync(pathArg)) {
  console.error(`file ${pathArg} doest not exits`);
}

const stat = fs.statSync(pathArg);
let contractsInfo = null;
if (stat.isDirectory()) {
  contractsInfo = {
    contracts: {},
    chainName,
  };
  const files = fs.readdirSync(pathArg, { withFileTypes: true });
  for (const file of files) {
    if (
      !file.isDirectory() &&
      file.name.substr(file.name.length - 5) === ".json"
    ) {
      const contractName = file.name.substr(0, file.name.length - 5);
      contractsInfo.contracts[contractName] = JSON.parse(
        fs.readFileSync(path.join(pathArg, file.name)).toString()
      );
    }
  }
} else {
  contractsInfo = JSON.parse(fs.readFileSync(pathArg).toString());
  contractsInfo.chainName = chainName;
}

// clean subgraph.yaml
if (fs.existsSync("./subgraph.yaml")) fs.unlinkSync("./subgraph.yaml");

// clean existing abis
fs.emptyDirSync("./abis");

// clean existing mapping
fs.emptyDirSync("./src");

// load header of subgraph.yaml
let subgraph = fs.readFileSync("./templates/subgraph.yaml").toString();

// write param file
if (contractsInfo["parameters"] != undefined) {
  const templateParams = Handlebars.compile(
    fs.readFileSync("./templates/Params.ts").toString()
  );
  const params = templateParams(contractsInfo.parameters);
  fs.writeFileSync(path.join("src", "Params.ts"), params);
}

const contracts = contractsInfo.contracts;

for (const contract of contracts) {
  // generate the abis file from contract abi
  if (contract.isGeneric) {
    console.log(`${contract.name} is generic`.toString());
    const generic_abis = fs
      .readFileSync("./templates/generic-abis-" + contract.type + ".json")
      .toString();

    fs.writeFileSync(path.join("abis", contract.name + ".json"), generic_abis);
  } else {
    fs.writeFileSync(
      path.join("abis", contract.name + ".json"),
      JSON.stringify(contract.abi)
    );
  }

  // load mapping template
  const mappingTemplate = (type) =>
    Handlebars.compile(
      fs.readFileSync("./templates/mapping-" + type + ".ts").toString()
    );

  contract["chainName"] = contract.network ? contract.network : chainName;
  // generate the mapping from contract
  let mapping = mappingTemplate(contract.type)(contract);

  // write mapping file
  fs.writeFileSync("src/" + contract.name + "Mapping.ts", mapping);

  // generate the data source and add it to subgraph
  const templateDataSource = Handlebars.compile(
    fs
      .readFileSync(
        "./templates/subgraph-datasource-" + contract.type + ".yaml"
      )
      .toString()
  );
  subgraph += templateDataSource(contract);
}

// Write subgraph.yaml file
fs.writeFileSync("./subgraph.yaml", subgraph);
