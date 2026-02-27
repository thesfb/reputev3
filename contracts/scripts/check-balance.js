const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "tBNB");
  
  if (balance === 0n) {
    console.log("\n⚠️  No tBNB! Get some from: https://www.bnbchain.org/en/testnet-faucet");
    process.exit(1);
  }
}

main().catch(console.error);
