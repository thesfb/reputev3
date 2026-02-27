#!/bin/bash
# Pre-deployment checklist for BSC Testnet
# Run this before deploying to verify everything is ready

set -e

echo "========================================"
echo "REPUTE - BSC Testnet Deployment Checklist"
echo "========================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# 1. Check environment
echo "[1/8] Checking environment..."
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo "  ⚠  DEPLOYER_PRIVATE_KEY not set"
  echo "     Export it: export DEPLOYER_PRIVATE_KEY=your_key_here"
  echo "     (without 0x prefix)"
  MISSING_ENV=1
else
  echo "  ✓  DEPLOYER_PRIVATE_KEY is set"
fi

if [ -z "$BSC_TESTNET_RPC" ]; then
  echo "  ℹ  BSC_TESTNET_RPC not set, using default"
else
  echo "  ✓  BSC_TESTNET_RPC is set"
fi

# 2. Compile contracts
echo ""
echo "[2/8] Compiling contracts..."
npx hardhat compile --quiet
echo "  ✓  Contracts compiled"

# 3. Run tests
echo ""
echo "[3/8] Running tests..."
npx hardhat test --quiet
echo "  ✓  All tests pass"

# 4. Check deployer balance
echo ""
echo "[4/8] Checking deployer balance..."
if [ -n "$DEPLOYER_PRIVATE_KEY" ]; then
  BALANCE=$(npx hardhat run --network bscTestnet -e "
    async function main() {
      const [deployer] = await ethers.getSigners();
      const balance = await ethers.provider.getBalance(deployer.address);
      console.log(ethers.formatEther(balance));
    }
    main();
  " 2>/dev/null || echo "0")
  echo "  Deployer balance: $BALANCE tBNB"
  echo "  Need at least 0.5 tBNB for deployment + staking"
  echo "  Get testnet BNB from: https://www.bnbchain.org/en/testnet-faucet"
else
  echo "  ⚠  Cannot check balance without DEPLOYER_PRIVATE_KEY"
fi

# 5. Check artifacts
echo ""
echo "[5/8] Checking artifacts..."
if [ -f "artifacts/contracts/ReputePaymaster.sol/ReputePaymaster.json" ]; then
  echo "  ✓  ReputePaymaster artifact exists"
else
  echo "  ✗  ReputePaymaster artifact missing — run 'npx hardhat compile'"
fi

if [ -f "artifacts/contracts/Groth16Verifier.sol/Groth16Verifier.json" ]; then
  echo "  ✓  Groth16Verifier artifact exists"
else
  echo "  ✗  Groth16Verifier artifact missing — run 'npx hardhat compile'"
fi

# 6. Check circuit (optional for initial deploy)
echo ""
echo "[6/8] Checking ZK circuit artifacts..."
if [ -f "circuits/reputation/build/reputation_final.zkey" ]; then
  echo "  ✓  Circuit proving key exists"
else
  echo "  ℹ  Circuit not compiled yet (optional for initial deploy)"
  echo "     To compile: npm run circuit:compile"
  echo "     Requires: circom v2.1.6+, snarkjs"
fi

# 7. Check frontend ready
echo ""
echo "[7/8] Checking frontend..."
FRONTEND_DIR="$PROJECT_DIR/../frontend"
if [ -f "$FRONTEND_DIR/src/config/contracts.ts" ]; then
  echo "  ✓  Frontend contract config exists"
  echo "  ℹ  After deploy, update VITE_PAYMASTER_ADDRESS and VITE_VERIFIER_ADDRESS"
else
  echo "  ⚠  Frontend contract config not found"
fi

# 8. Summary
echo ""
echo "[8/8] Summary"
echo "========================================"
if [ -n "$MISSING_ENV" ]; then
  echo "STATUS: NOT READY — missing environment variables"
  echo ""
  echo "Required steps:"
  echo "  1. export DEPLOYER_PRIVATE_KEY=<your_testnet_key>"
  echo "  2. Get tBNB from faucet"
  echo "  3. Run: npx hardhat run scripts/deploy.js --network bscTestnet"
else
  echo "STATUS: READY FOR DEPLOYMENT"
  echo ""
  echo "Deploy with:"
  echo "  npx hardhat run scripts/deploy.js --network bscTestnet"
  echo ""
  echo "After deployment:"
  echo "  1. Copy contract addresses from output"
  echo "  2. Set in frontend/.env:"
  echo "     VITE_PAYMASTER_ADDRESS=<paymaster_address>"
  echo "     VITE_VERIFIER_ADDRESS=<verifier_address>"
  echo "  3. Optionally compile the ZK circuit for real proof generation"
fi
echo "========================================"
