// Deploy script for Repute contracts
// Usage:
//   npx hardhat run scripts/deploy.js --network hardhat
//   npx hardhat run scripts/deploy.js --network bscTestnet

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // ---- 1. Deploy Groth16 Verifier ----
  console.log("\n[1/4] Deploying Groth16Verifier...");
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("Groth16Verifier deployed to:", verifierAddr);

  // ---- 2. Deploy ReputePaymaster ----
  // ERC-4337 EntryPoint v0.7 canonical address
  const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

  console.log("\n[2/4] Deploying ReputePaymaster...");
  const Paymaster = await hre.ethers.getContractFactory("ReputePaymaster");
  const paymaster = await Paymaster.deploy(
    ENTRYPOINT_V07,
    verifierAddr,
    deployer.address // owner
  );
  await paymaster.waitForDeployment();
  const paymasterAddr = await paymaster.getAddress();
  console.log("ReputePaymaster deployed to:", paymasterAddr);

  // ---- 3. Deploy RailgunRelay ----
  // Railgun Relay Adapt on BSC Mainnet: 0x741936fb83DDf324636D3048b3E6bC800B8D9e12
  // On testnet/local we use address(0) since Railgun doesn't have testnet contracts
  const network = hre.network.name;
  const RAILGUN_RELAY_ADAPT = network === "bscMainnet"
    ? "0x741936fb83DDf324636D3048b3E6bC800B8D9e12"
    : "0x0000000000000000000000000000000000000000";

  console.log("\n[3/4] Deploying RailgunRelay...");
  const Relay = await hre.ethers.getContractFactory("RailgunRelay");
  const relay = await Relay.deploy(
    paymasterAddr,           // paymaster
    RAILGUN_RELAY_ADAPT,     // railgun Relay Adapt
    deployer.address         // fee recipient (protocol treasury)
  );
  await relay.waitForDeployment();
  const relayAddr = await relay.getAddress();
  console.log("RailgunRelay deployed to:", relayAddr);

  // Configure accepted tokens on RailgunRelay
  const BSC_USDT = network === "bscMainnet"
    ? "0x55d398326f99059fF775485246999027B3197955"
    : "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
  const BSC_USDC = network === "bscMainnet"
    ? "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
    : "0x64544969ed7EBf5f083679233325356EbE738930";

  // Accept USDT with minimum 1 USDT deposit
  await relay.configureToken(BSC_USDT, hre.ethers.parseUnits("1", 18), true);
  console.log("  Configured USDT:", BSC_USDT);
  // Accept USDC with minimum 1 USDC deposit
  await relay.configureToken(BSC_USDC, hre.ethers.parseUnits("1", 18), true);
  console.log("  Configured USDC:", BSC_USDC);

  // ---- 4. Fund the Paymaster (on testnet/local) ----
  if (network === "hardhat" || network === "localhost" || network === "bscTestnet") {
    console.log("\n[4/4] Funding Paymaster deposit on EntryPoint...");

    // Deposit ETH/BNB into EntryPoint for the Paymaster
    const depositAmount = hre.ethers.parseEther("0.1"); // 0.1 BNB
    const depositTx = await paymaster.deposit({ value: depositAmount });
    await depositTx.wait();
    console.log("Deposited", hre.ethers.formatEther(depositAmount), "BNB to EntryPoint for Paymaster");

    // Add stake (required by EntryPoint for paymasters)
    const stakeAmount = hre.ethers.parseEther("0.05");
    const unstakeDelaySec = 86400; // 1 day
    const stakeTx = await paymaster.addStake(unstakeDelaySec, { value: stakeAmount });
    await stakeTx.wait();
    console.log("Added", hre.ethers.formatEther(stakeAmount), "BNB stake with", unstakeDelaySec, "s delay");
  } else {
    console.log("\n[4/4] Skipping auto-fund on mainnet. Fund manually:");
    console.log("  paymaster.deposit({ value: ethers.parseEther('1.0') })");
    console.log("  paymaster.addStake(86400, { value: ethers.parseEther('0.5') })");
  }

  // ---- Summary ----
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:          ", network);
  console.log("Deployer:         ", deployer.address);
  console.log("EntryPoint:       ", ENTRYPOINT_V07);
  console.log("Groth16Verifier:  ", verifierAddr);
  console.log("ReputePaymaster:  ", paymasterAddr);
  console.log("RailgunRelay:     ", relayAddr);
  console.log("RailgunRelayAdapt:", RAILGUN_RELAY_ADAPT);
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Compile the ZK circuit: npm run circuit:compile");
  console.log("2. Set the verification key on the verifier contract");
  console.log("3. Copy circuit artifacts to frontend/public/");
  console.log("4. Update frontend config with contract addresses");
  console.log("5. Set VITE_RAILGUN_RELAY_ADDRESS in frontend .env");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network,
    timestamp: new Date().toISOString(),
    contracts: {
      entryPoint: ENTRYPOINT_V07,
      groth16Verifier: verifierAddr,
      reputePaymaster: paymasterAddr,
      railgunRelay: relayAddr,
      railgunRelayAdapt: RAILGUN_RELAY_ADAPT,
    },
    deployer: deployer.address,
  };

  const outPath = `./deployments-${network}.json`;
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${outPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
