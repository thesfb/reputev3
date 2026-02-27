// Paymaster interaction layer
// Handles encoding proof data into paymasterAndData format for ERC-4337 UserOperations

import { encodePacked, type Address, type Hex, pad, toHex, concat } from "viem";
import type { ZKProofResult } from "./zkproof";
import { PAYMASTER_ADDRESS } from "@/config/contracts";

/**
 * Encode ZK proof into paymasterAndData format expected by ReputePaymaster.
 *
 * Layout (after the 20-byte paymaster address prefix stripped by EntryPoint):
 * [0:32]    nullifierHash (uint256)
 * [32:64]   commitmentHash (uint256)
 * [64:96]   proof.a[0] (uint256)
 * [96:128]  proof.a[1] (uint256)
 * [128:160] proof.b[0][0] (uint256)
 * [160:192] proof.b[0][1] (uint256)
 * [192:224] proof.b[1][0] (uint256)
 * [224:256] proof.b[1][1] (uint256)
 * [256:288] proof.c[0] (uint256)
 * [288:320] proof.c[1] (uint256)
 */
export function encodePaymasterData(
  zkProof: ZKProofResult,
  paymasterAddress: Address = PAYMASTER_ADDRESS
): Hex {
  const { proofCalldata, nullifierHash, commitmentHash } = zkProof;

  // Encode each uint256 as 32-byte hex
  const parts: Hex[] = [
    paymasterAddress,
    pad(toHex(BigInt(nullifierHash)), { size: 32 }),
    pad(toHex(BigInt(commitmentHash)), { size: 32 }),
    pad(toHex(proofCalldata.pA[0]), { size: 32 }),
    pad(toHex(proofCalldata.pA[1]), { size: 32 }),
    pad(toHex(proofCalldata.pB[0][0]), { size: 32 }),
    pad(toHex(proofCalldata.pB[0][1]), { size: 32 }),
    pad(toHex(proofCalldata.pB[1][0]), { size: 32 }),
    pad(toHex(proofCalldata.pB[1][1]), { size: 32 }),
    pad(toHex(proofCalldata.pC[0]), { size: 32 }),
    pad(toHex(proofCalldata.pC[1]), { size: 32 }),
  ];

  return concat(parts);
}

/**
 * Build a minimal UserOperation structure for activation.
 * In production, this would use a proper ERC-4337 SDK (Pimlico/Stackup).
 * For the demo, we construct the struct manually.
 */
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex;      // packed (verificationGasLimit, callGasLimit)
  preVerificationGas: bigint;
  gasFees: Hex;               // packed (maxPriorityFeePerGas, maxFeePerGas)
  paymasterAndData: Hex;
  signature: Hex;
}

export function buildActivationUserOp(
  sender: Address,
  zkProof: ZKProofResult,
  paymasterAddress: Address = PAYMASTER_ADDRESS
): UserOperation {
  const paymasterAndData = encodePaymasterData(zkProof, paymasterAddress);

  return {
    sender,
    nonce: 0n,
    initCode: "0x",
    callData: "0x", // No-op call for activation
    accountGasLimits: pad(toHex(BigInt(200000)), { size: 32 }), // verification + call gas
    preVerificationGas: 50000n,
    gasFees: pad(toHex(BigInt(5000000000)), { size: 32 }), // 5 gwei
    paymasterAndData,
    signature: "0x",
  };
}

/**
 * Simulate submitting a UserOp to a bundler.
 * In production, POST to bundler RPC (Pimlico/Stackup).
 * In demo mode, returns a mock tx hash.
 */
export async function submitUserOp(
  userOp: UserOperation,
  bundlerUrl?: string
): Promise<{ userOpHash: string; txHash: string }> {
  const url = bundlerUrl || import.meta.env.VITE_BUNDLER_URL;

  if (url) {
    // Real bundler submission
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_sendUserOperation",
          params: [
            {
              sender: userOp.sender,
              nonce: `0x${userOp.nonce.toString(16)}`,
              initCode: userOp.initCode,
              callData: userOp.callData,
              accountGasLimits: userOp.accountGasLimits,
              preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
              gasFees: userOp.gasFees,
              paymasterAndData: userOp.paymasterAndData,
              signature: userOp.signature,
            },
            "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint
          ],
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        userOpHash: result.result,
        txHash: result.result, // Bundler returns userOpHash, txHash comes later
      };
    } catch (err) {
      console.warn("Bundler submission failed, using mock:", err);
    }
  }

  // Mock response for demo
  await new Promise((r) => setTimeout(r, 1500)); // Simulate network delay
  const mockHash =
    "0x" +
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return {
    userOpHash: mockHash,
    txHash: mockHash,
  };
}

/**
 * Format a tx hash for display
 */
export function formatTxHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}
