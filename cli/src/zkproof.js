// Repute CLI — ZK Proof generation
// Generates Groth16 proofs for reputation verification
// Uses real snarkjs when circuit files are available, falls back to mock

import { randomBytes } from "crypto";

/**
 * Generate a ZK proof of reputation
 * @param {object} reputationData - Wallet reputation data from fetchReputation()
 * @param {object} criteria - { minBalance, minTxCount, minWalletAge }
 * @returns {Promise<object>} ZK proof result
 */
export async function generateProof(reputationData, criteria) {
  const c = {
    minBalance: BigInt(criteria.minBalance || "10000000000000000"),
    minTxCount: Number(criteria.minTxCount || 5),
    minWalletAge: Number(criteria.minWalletAge || 30),
  };

  // Try real proof generation first
  try {
    return await generateRealProof(reputationData, c);
  } catch (err) {
    // Fall back to mock proof (for demo/testnet)
    return generateMockProof(reputationData, c);
  }
}

/**
 * Real Groth16 proof generation using snarkjs
 * Requires reputation.wasm and reputation_final.zkey files
 */
async function generateRealProof(reputationData, criteria) {
  let snarkjs;
  try {
    snarkjs = await import("snarkjs");
  } catch {
    throw new Error("snarkjs not available — install with: npm i snarkjs");
  }

  const { resolve } = await import("path");
  const { existsSync } = await import("fs");

  // Look for circuit files in common locations
  const possiblePaths = [
    resolve(process.cwd(), "reputation.wasm"),
    resolve(process.cwd(), "../frontend/public/reputation.wasm"),
    resolve(process.cwd(), "../contracts/circuits/reputation/reputation_js/reputation.wasm"),
  ];

  let wasmPath = null;
  let zkeyPath = null;

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      wasmPath = p;
      zkeyPath = p.replace("reputation.wasm", "reputation_final.zkey")
                   .replace("reputation_js/reputation.wasm", "reputation_final.zkey");
      if (existsSync(zkeyPath)) break;
      zkeyPath = null;
      wasmPath = null;
    }
  }

  if (!wasmPath || !zkeyPath) {
    throw new Error("Circuit files not found (reputation.wasm / reputation_final.zkey)");
  }

  // Generate random secret
  const secretBytes = randomBytes(31);
  const secret = BigInt("0x" + secretBytes.toString("hex"));

  const input = {
    walletAddress: BigInt(reputationData.address),
    secret,
    bnbBalance: BigInt(reputationData.bnbBalance),
    txCount: BigInt(reputationData.txCount),
    walletAge: BigInt(reputationData.walletAge),
    nullifierHash: 0n,
    minBalance: criteria.minBalance,
    minTxCount: BigInt(criteria.minTxCount),
    minWalletAge: BigInt(criteria.minWalletAge),
    commitmentHash: 0n,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  return formatProofResult(proof, publicSignals);
}

/**
 * Generate a mock proof for demo purposes
 * Deterministic based on wallet address
 */
export function generateMockProof(reputationData, criteria) {
  const c = {
    minBalance: BigInt(criteria.minBalance || "10000000000000000"),
    minTxCount: Number(criteria.minTxCount || 5),
    minWalletAge: Number(criteria.minWalletAge || 30),
  };

  const addrNum = BigInt(reputationData.address);
  const fieldModulus = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

  const nullifierHash = ((addrNum * 7919n + 104729n) % fieldModulus).toString();
  const commitmentHash = ((addrNum * 6271n + 15485863n) % fieldModulus).toString();

  const mockProof = {
    a: [
      "12345678901234567890123456789012345678901234567890123456789012345678901234567",
      "98765432109876543210987654321098765432109876543210987654321098765432109876543",
    ],
    b: [
      [
        "11111111111111111111111111111111111111111111111111111111111111111111111111111",
        "22222222222222222222222222222222222222222222222222222222222222222222222222222",
      ],
      [
        "33333333333333333333333333333333333333333333333333333333333333333333333333333",
        "44444444444444444444444444444444444444444444444444444444444444444444444444444",
      ],
    ],
    c: [
      "55555555555555555555555555555555555555555555555555555555555555555555555555555",
      "66666666666666666666666666666666666666666666666666666666666666666666666666666",
    ],
  };

  return {
    proof: mockProof,
    publicSignals: [
      nullifierHash,
      c.minBalance.toString(),
      c.minTxCount.toString(),
      c.minWalletAge.toString(),
      commitmentHash,
    ],
    nullifierHash,
    commitmentHash,
    proofCalldata: {
      pA: [BigInt(mockProof.a[0]), BigInt(mockProof.a[1])],
      pB: [
        [BigInt(mockProof.b[0][0]), BigInt(mockProof.b[0][1])],
        [BigInt(mockProof.b[1][0]), BigInt(mockProof.b[1][1])],
      ],
      pC: [BigInt(mockProof.c[0]), BigInt(mockProof.c[1])],
      pubSignals: [
        BigInt(nullifierHash),
        c.minBalance,
        BigInt(c.minTxCount),
        BigInt(c.minWalletAge),
        BigInt(commitmentHash),
      ],
    },
    isMock: true,
  };
}

/**
 * Format a real snarkjs proof into our standard structure
 */
function formatProofResult(proof, publicSignals) {
  return {
    proof: {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][0], proof.pi_b[0][1]],
        [proof.pi_b[1][0], proof.pi_b[1][1]],
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
    },
    publicSignals,
    nullifierHash: publicSignals[0],
    commitmentHash: publicSignals[4],
    proofCalldata: {
      pA: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      pB: [
        [BigInt(proof.pi_b[0][0]), BigInt(proof.pi_b[0][1])],
        [BigInt(proof.pi_b[1][0]), BigInt(proof.pi_b[1][1])],
      ],
      pC: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
      pubSignals: publicSignals.map((s) => BigInt(s)),
    },
    isMock: false,
  };
}
