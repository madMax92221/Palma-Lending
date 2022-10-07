const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account: ", deployer.address);

  const PalmaContract = await ethers.getContractFactory("Palma");
  const palmaContract = await PalmaContract.deploy();

  await palmaContract.deployed();

  console.log("PalmaContract deployed to: ", palmaContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
