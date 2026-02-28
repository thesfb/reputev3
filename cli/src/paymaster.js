// Repute CLI — Paymaster interaction layer
// Query Paymaster state and encode proof data for UserOperations

import { pad, toHex, concat } from "viem";
import { getClient } from "./client.js";
import { CONTRACTS, PAYMASTER_ABI, VERIFIER_ABI, RELAY_ABI } from "./config.js";

// ══════════════════════════════════════════════════════════════
//  READ PAYMASTER STATE
// ══════════════════════════════════════════════════════════════

/**
 * Get wallet activation status from the Paymaster
 * @param {string} address - Wallet address
 * @returns {Promise<object>} { activated, opsRemaining, activatedAt }
 */
export async function getWalletStatus(address) {
  const client = getClient();
  const [activated, opsRemaining, activatedAt] = await client.readContract({
    address: CONTRACTS.reputePaymaster,
    abi: PAYMASTER_ABI,
    functionName: "getWalletStatus",
    args: [address],
  });

  return { activated, opsRemaining, activatedAt };
}

/**
 * Check if a nullifier has been used
 * @param {string|bigint} nullifierHash
 * @returns {Promise<boolean>}
 */
export async function isNullifierUsed(nullifierHash) {
  const client = getClient();
  return await client.readContract({
    address: CONTRACTS.reputePaymaster,
    abi: PAYMASTER_ABI,
    functionName: "isNullifierUsed",
    args: [BigInt(nullifierHash)],
  });
}

/**
 * Get full nullifier details
 * @param {string|bigint} nullifierHash
 * @returns {Promise<object>}
 */
export async function getNullifierDetails(nullifierHash) {
  const client = getClient();
  const [used, activatedWallet, opsRemaining, activatedAt] = await client.readContract({
    address: CONTRACTS.reputePaymaster,
    abi: PAYMASTER_ABI,
    functionName: "nullifiers",
    args: [BigInt(nullifierHash)],
  });

  return { used, activatedWallet, opsRemaining, activatedAt };
}

/**
 * Get the Paymaster's on-chain configuration
 * @returns {Promise<object>} Configuration thresholds
 */
export async function getPaymasterConfig() {
  const client = getClient();

  const [minBalance, minTxCount, minWalletAge, maxSponsoredOps, owner, verifier] =
    await Promise.all([
      client.readContract({
        address: CONTRACTS.reputePaymaster,
        abi: PAYMASTER_ABI,
        functionName: "minBalance",
      }),
      client.readContract({
        address: CONTRACTS.reputePaymaster,
        abi: PAYMASTER_ABI,
        functionName: "minTxCount",
      }),
      client.readContract({
        address: CONTRACTS.reputePaymaster,
        abi: PAYMASTER_ABI,
        functionName: "minWalletAge",
      }),
      client.readContract({
        address: CONTRACTS.reputePaymaster,
        abi: PAYMASTER_ABI,
        functionName: "maxSponsoredOps",
      }),
      client.readContract({
        address: CONTRACTS.reputePaymaster,
        abi: PAYMASTER_ABI,
        functionName: "owner",
      }),
      client.readContract({
        address: CONTRACTS.reputePaymaster,
        abi: PAYMASTER_ABI,
        functionName: "verifier",
      }),
    ]);

  return { minBalance, minTxCount, minWalletAge, maxSponsoredOps, owner, verifier };
}

// ══════════════════════════════════════════════════════════════
//  RELAY INFO
// ══════════════════════════════════════════════════════════════

/**
 * Get RailgunRelay contract state
 */
export async function getRelayInfo() {
  const client = getClient();

  try {
    const [paymaster, feeBps, treasury, totalNativeReceived] = await Promise.all([
      client.readContract({
        address: CONTRACTS.railgunRelay,
        abi: RELAY_ABI,
        functionName: "paymaster",
      }),
      client.readContract({
        address: CONTRACTS.railgunRelay,
        abi: RELAY_ABI,
        functionName: "feeBps",
      }),
      client.readContract({
        address: CONTRACTS.railgunRelay,
        abi: RELAY_ABI,
        functionName: "treasury",
      }),
      client.readContract({
        address: CONTRACTS.railgunRelay,
        abi: RELAY_ABI,
        functionName: "totalNativeReceived",
      }),
    ]);

    return { paymaster, feeBps, treasury, totalNativeReceived };
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
//  ENCODE PROOF FOR USEROP
// ══════════════════════════════════════════════════════════════

/**
 * Encode ZK proof into paymasterAndData format for ERC-4337 UserOperation.
 *
 * Layout (after 20-byte paymaster address):
 *   [0:32]    nullifierHash
 *   [32:64]   commitmentHash
 *   [64:96]   proof.a[0]
 *   ...
 *   [288:320] proof.c[1]
 *
 * @param {object} zkProof - Proof result from generateProof()
 * @param {string} paymasterAddress - Override paymaster address
 * @returns {string} Hex-encoded paymasterAndData
 */
export function encodePaymasterData(zkProof, paymasterAddress = CONTRACTS.reputePaymaster) {
  const { proofCalldata, nullifierHash, commitmentHash } = zkProof;

  const parts = [
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

// ══════════════════════════════════════════════════════════════
//  BUILD & SUBMIT USER OPERATIONS
// ══════════════════════════════════════════════════════════════

/**
 * Build a minimal ERC-4337 UserOperation for wallet activation
 * @param {string} sender - New wallet address
 * @param {object} zkProof - Proof from generateProof()
 * @returns {object} UserOperation struct
 */
export function buildUserOp(sender, zkProof) {
  const paymasterAndData = encodePaymasterData(zkProof);

  return {
    sender,
    nonce: "0x0",
    initCode: "0x",
    callData: "0x",
    accountGasLimits: pad(toHex(200000n), { size: 32 }),
    preVerificationGas: "0xc350",  // 50000
    gasFees: pad(toHex(5000000000n), { size: 32 }), // 5 gwei
    paymasterAndData,
    signature: "0x",
  };
}

/**
 * Submit a UserOperation to a bundler
 * @param {object} userOp - Built UserOperation
 * @param {string} bundlerUrl - Bundler RPC endpoint
 * @returns {Promise<object>} { userOpHash, txHash }
 */
export async function submitUserOp(userOp, bundlerUrl) {
  if (!bundlerUrl) {
    // Mock submission for demo
    const mockHash =
      "0x" +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    return {
      userOpHash: mockHash,
      txHash: mockHash,
      isMock: true,
    };
  }

  const response = await fetch(bundlerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [
        userOp,
        CONTRACTS.entryPoint,
      ],
    }),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`Bundler error: ${result.error.message}`);
  }

  return {
    userOpHash: result.result,
    txHash: result.result,
    isMock: false,
  };
}
