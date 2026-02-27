#!/bin/bash
# Compile the Reputation circuit and generate Groth16 proving/verification keys
# Prerequisites: circom (v2.1.6+), snarkjs, node

set -e

CIRCUIT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$CIRCUIT_DIR/build"
PTAU_FILE="$BUILD_DIR/pot14_final.ptau"

echo "=== Repute ZK Circuit Build ==="

# Create build directory
mkdir -p "$BUILD_DIR"

# Step 1: Compile the circuit
echo "[1/7] Compiling circuit..."
circom "$CIRCUIT_DIR/reputation.circom" \
  --r1cs --wasm --sym \
  -o "$BUILD_DIR" \
  -l "$CIRCUIT_DIR/../../node_modules"

echo "[2/7] Circuit info:"
npx snarkjs r1cs info "$BUILD_DIR/reputation.r1cs"

# Step 2: Download Powers of Tau (if not cached)
if [ ! -f "$PTAU_FILE" ]; then
  echo "[3/7] Downloading Powers of Tau ceremony file (pot14)..."
  curl -L -o "$PTAU_FILE" \
    "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau"
else
  echo "[3/7] Powers of Tau file already exists, skipping download."
fi

# Step 3: Generate zkey (Groth16 setup)
echo "[4/7] Generating zkey (Groth16 setup)..."
npx snarkjs groth16 setup \
  "$BUILD_DIR/reputation.r1cs" \
  "$PTAU_FILE" \
  "$BUILD_DIR/reputation_0000.zkey"

# Step 4: Contribute to ceremony (deterministic for dev)
echo "[5/7] Contributing to ceremony..."
npx snarkjs zkey contribute \
  "$BUILD_DIR/reputation_0000.zkey" \
  "$BUILD_DIR/reputation_final.zkey" \
  --name="Repute Dev Contribution" \
  -v -e="repute-hackathon-entropy-seed"

# Step 5: Export verification key
echo "[6/7] Exporting verification key..."
npx snarkjs zkey export verificationkey \
  "$BUILD_DIR/reputation_final.zkey" \
  "$BUILD_DIR/verification_key.json"

# Step 6: Generate Solidity verifier
echo "[7/7] Generating Solidity verifier contract..."
npx snarkjs zkey export solidityverifier \
  "$BUILD_DIR/reputation_final.zkey" \
  "$CIRCUIT_DIR/../../contracts/Groth16Verifier.sol"

echo ""
echo "=== Build Complete ==="
echo "Artifacts in: $BUILD_DIR/"
echo "  - reputation.r1cs        (constraint system)"
echo "  - reputation_js/          (WASM prover)"
echo "  - reputation_final.zkey   (proving key)"
echo "  - verification_key.json   (verification key)"
echo "Solidity verifier: contracts/Groth16Verifier.sol"
echo ""
echo "To copy WASM + zkey to frontend for browser proving:"
echo "  cp $BUILD_DIR/reputation_js/reputation.wasm ../frontend/public/"
echo "  cp $BUILD_DIR/reputation_final.zkey ../frontend/public/"
