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
  console.log("\n[1/3] Deploying Groth16Verifier...");
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("Groth16Verifier deployed to:", verifierAddr);

  // ---- 2. Deploy ReputePaymaster ----
  // ERC-4337 EntryPoint v0.7 canonical address
  const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

  console.log("\n[2/3] Deploying ReputePaymaster...");
  const Paymaster = await hre.ethers.getContractFactory("ReputePaymaster");
  const paymaster = await Paymaster.deploy(
    ENTRYPOINT_V07,
    verifierAddr,
    deployer.address // owner
  );
  await paymaster.waitForDeployment();
  const paymasterAddr = await paymaster.getAddress();
  console.log("ReputePaymaster deployed to:", paymasterAddr);

  // ---- 3. Fund the Paymaster (on testnet/local) ----
  const network = hre.network.name;
  if (network === "hardhat" || network === "localhost" || network === "bscTestnet") {
    console.log("\n[3/3] Funding Paymaster deposit on EntryPoint...");

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
    console.log("\n[3/3] Skipping auto-fund on mainnet. Fund manually:");
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
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Compile the ZK circuit: npm run circuit:compile");
  console.log("2. Set the verification key on the verifier contract");
  console.log("3. Copy circuit artifacts to frontend/public/");
  console.log("4. Update frontend config with contract addresses");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network,
    timestamp: new Date().toISOString(),
    contracts: {
      entryPoint: ENTRYPOINT_V07,
      groth16Verifier: verifierAddr,
      reputePaymaster: paymasterAddr,
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
