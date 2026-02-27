// ZK Proof generation for Repute reputation proofs
// Uses snarkjs for Groth16 proof generation in the browser.
//
// In production: loads circuit WASM + zkey from /public/ and generates real proofs.
// In demo mode: generates mock proof data that matches the contract's expected format.

import type { Address } from "viem";
import type { ReputationData } from "./reputation";

export interface ZKProofResult {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[];
  nullifierHash: string;
  commitmentHash: string;
  // Formatted for contract calldata
  proofCalldata: {
    pA: [bigint, bigint];
    pB: [[bigint, bigint], [bigint, bigint]];
    pC: [bigint, bigint];
    pubSignals: [bigint, bigint, bigint, bigint, bigint];
  };
}

/**
 * Generate a ZK proof of reputation.
 *
 * Tries real snarkjs proof generation first (requires WASM + zkey in /public/).
 * Falls back to mock proof for demo.
 */
export async function generateReputationProof(
  reputationData: ReputationData,
  criteria: { minBalance: bigint; minTxCount: number; minWalletAge: number }
): Promise<ZKProofResult> {
  // Try real proof generation
  try {
    return await generateRealProof(reputationData, criteria);
  } catch (err) {
    console.warn("Real ZK proof generation failed, using mock:", err);
    return generateMockProof(reputationData, criteria);
  }
}

/**
 * Real Groth16 proof generation using snarkjs in the browser.
 * Requires reputation.wasm and reputation_final.zkey in /public/
 */
async function generateRealProof(
  reputationData: ReputationData,
  criteria: { minBalance: bigint; minTxCount: number; minWalletAge: number }
): Promise<ZKProofResult> {
  // Dynamic import of snarkjs (it's a large library)
  const snarkjs = await import("snarkjs");

  // Generate a random secret for the nullifier
  const secretBytes = crypto.getRandomValues(new Uint8Array(31));
  const secret = BigInt("0x" + Array.from(secretBytes).map(b => b.toString(16).padStart(2, "0")).join(""));

  // Circuit inputs
  const input = {
    // Private
    walletAddress: BigInt(reputationData.address),
    secret: secret,
    bnbBalance: reputationData.bnbBalance,
    txCount: BigInt(reputationData.txCount),
    walletAge: BigInt(reputationData.walletAge),
    // Public
    nullifierHash: BigInt(0), // Will be computed by circuit
    minBalance: criteria.minBalance,
    minTxCount: BigInt(criteria.minTxCount),
    minWalletAge: BigInt(criteria.minWalletAge),
    commitmentHash: BigInt(0), // Will be computed by circuit
  };

  // Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "/reputation.wasm",
    "/reputation_final.zkey"
  );

  const nullifierHash = publicSignals[0];
  const commitmentHash = publicSignals[4];

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
    nullifierHash,
    commitmentHash,
    proofCalldata: {
      pA: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      pB: [
        [BigInt(proof.pi_b[0][0]), BigInt(proof.pi_b[0][1])],
        [BigInt(proof.pi_b[1][0]), BigInt(proof.pi_b[1][1])],
      ],
      pC: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
      pubSignals: [
        BigInt(publicSignals[0]),
        BigInt(publicSignals[1]),
        BigInt(publicSignals[2]),
        BigInt(publicSignals[3]),
        BigInt(publicSignals[4]),
      ],
    },
  };
}

/**
 * Generate a mock proof for demo purposes.
 * Creates deterministic but realistic-looking proof data.
 */
export function generateMockProof(
  reputationData: ReputationData,
  criteria: { minBalance: bigint; minTxCount: number; minWalletAge: number }
): ZKProofResult {
  // Generate deterministic "random" values from the address for consistency
  const addrNum = BigInt(reputationData.address);

  // Mock nullifier = hash-like value derived from address
  const nullifierHash = (
    (addrNum * BigInt("7919") + BigInt("104729")) %
    BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617")
  ).toString();

  // Mock commitment hash
  const commitmentHash = (
    (addrNum * BigInt("6271") + BigInt("15485863")) %
    BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617")
  ).toString();

  // Mock proof points (valid G1/G2 point format but not cryptographically valid)
  const mockProof = {
    a: [
      "12345678901234567890123456789012345678901234567890123456789012345678901234567",
      "98765432109876543210987654321098765432109876543210987654321098765432109876543",
    ] as [string, string],
    b: [
      [
        "11111111111111111111111111111111111111111111111111111111111111111111111111111",
        "22222222222222222222222222222222222222222222222222222222222222222222222222222",
      ],
      [
        "33333333333333333333333333333333333333333333333333333333333333333333333333333",
        "44444444444444444444444444444444444444444444444444444444444444444444444444444",
      ],
    ] as [[string, string], [string, string]],
    c: [
      "55555555555555555555555555555555555555555555555555555555555555555555555555555",
      "66666666666666666666666666666666666666666666666666666666666666666666666666666",
    ] as [string, string],
  };

  return {
    proof: mockProof,
    publicSignals: [
      nullifierHash,
      criteria.minBalance.toString(),
      criteria.minTxCount.toString(),
      criteria.minWalletAge.toString(),
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
        criteria.minBalance,
        BigInt(criteria.minTxCount),
        BigInt(criteria.minWalletAge),
        BigInt(commitmentHash),
      ],
    },
  };
}

/**
 * Format a nullifier hash for display (truncated)
 */
export function formatNullifier(nullifierHash: string): string {
  if (nullifierHash.length <= 16) return nullifierHash;
  return `${nullifierHash.slice(0, 8)}…${nullifierHash.slice(-8)}`;
}

/**
 * Format proof ID for display
 */
export function formatProofId(proof: ZKProofResult): string {
  const proofStr = proof.proof.a[0];
  return `0x${proofStr.slice(0, 4)}…${proofStr.slice(-4)}`;
}
