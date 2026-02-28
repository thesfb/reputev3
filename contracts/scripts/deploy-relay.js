// Deploy only the RailgunRelay contract (Verifier + Paymaster already deployed)
// Usage: npx hardhat run scripts/deploy-relay.js --network bscTestnet

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log("Deploying RailgunRelay with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");

  // Existing Paymaster address from bsc.address
  const PAYMASTER = "0x6A0c7e8d7726F906C947D2E4ae66709b24BcBc33";

  // Railgun Relay Adapt — address(0) on testnet (no Railgun testnet deployment)
  const RAILGUN_RELAY_ADAPT = network === "bscMainnet"
    ? "0x741936fb83DDf324636D3048b3E6bC800B8D9e12"
    : "0x0000000000000000000000000000000000000000";

  console.log("\nDeploying RailgunRelay...");
  const Relay = await hre.ethers.getContractFactory("RailgunRelay");
  const relay = await Relay.deploy(
    PAYMASTER,
    RAILGUN_RELAY_ADAPT,
    deployer.address   // fee recipient
  );
  await relay.waitForDeployment();
  const relayAddr = await relay.getAddress();
  console.log("RailgunRelay deployed to:", relayAddr);

  // Configure accepted tokens (BSC Testnet addresses)
  const BSC_USDT = network === "bscMainnet"
    ? "0x55d398326f99059fF775485246999027B3197955"
    : "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
  const BSC_USDC = network === "bscMainnet"
    ? "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
    : "0x64544969ed7EBf5f083679233325356EbE738930";

  await relay.configureToken(BSC_USDT, hre.ethers.parseUnits("1", 18), true);
  console.log("  Configured USDT:", BSC_USDT);
  await relay.configureToken(BSC_USDC, hre.ethers.parseUnits("1", 18), true);
  console.log("  Configured USDC:", BSC_USDC);

  console.log("\n========================================");
  console.log("RailgunRelay:", relayAddr);
  console.log("Paymaster:   ", PAYMASTER);
  console.log("RelayAdapt:  ", RAILGUN_RELAY_ADAPT);
  console.log("========================================");
  console.log("\nAdd to bsc.address:");
  console.log(`RailgunRelay:          ${relayAddr}`);
  console.log("\nSet in frontend .env:");
  console.log(`VITE_RAILGUN_RELAY_ADDRESS=${relayAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
