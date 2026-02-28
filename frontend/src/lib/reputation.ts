// Reputation data fetching — reads on-chain signals from a wallet
// In production, this reads real on-chain data via RPC.
// For the hackathon demo, it includes a mock mode.

import { createPublicClient, http, formatEther, type Address } from "viem";
import { bscTestnet } from "viem/chains";

export interface ReputationData {
  address: Address;
  bnbBalance: bigint;       // in wei
  txCount: number;
  walletAge: number;        // in days
  firstTxTimestamp: number;  // unix timestamp
  // Derived
  bnbBalanceFormatted: string;
  meetsMinBalance: boolean;
  meetsMinTxCount: boolean;
  meetsMinAge: boolean;
  isReputable: boolean;
}

export interface ReputationCriteria {
  minBalance: bigint;    // in wei
  minTxCount: number;
  minWalletAge: number;  // in days
}

// Demo mode — when true, every wallet passes criteria regardless of real data.
// Set to false for production to enforce real on-chain checks.
export const DEMO_MODE = true;

// Default criteria matching the smart contract defaults
export const DEFAULT_CRITERIA: ReputationCriteria = {
  minBalance: BigInt("10000000000000000"), // 0.01 BNB
  minTxCount: 5,
  minWalletAge: 30, // 30 days
};

const client = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

/**
 * Fetch real on-chain reputation data for a wallet
 */
export async function fetchReputationData(
  address: Address,
  criteria: ReputationCriteria = DEFAULT_CRITERIA
): Promise<ReputationData> {
  try {
    // Fetch balance and tx count in parallel
    const [balance, txCount] = await Promise.all([
      client.getBalance({ address }),
      client.getTransactionCount({ address }),
    ]);

    // Estimate wallet age — on BSC we can't easily get first tx timestamp
    // without an explorer API, so we'll use a heuristic or mock
    const walletAge = await estimateWalletAge(address);

    // In demo mode, all criteria pass regardless of actual values
    const meetsMinBalance = DEMO_MODE || balance >= criteria.minBalance;
    const meetsMinTxCount = DEMO_MODE || txCount >= criteria.minTxCount;
    const meetsMinAge = DEMO_MODE || walletAge >= criteria.minWalletAge;

    return {
      address,
      bnbBalance: balance,
      txCount,
      walletAge,
      firstTxTimestamp: Math.floor(Date.now() / 1000) - walletAge * 86400,
      bnbBalanceFormatted: formatEther(balance),
      meetsMinBalance,
      meetsMinTxCount,
      meetsMinAge,
      isReputable: meetsMinBalance && meetsMinTxCount && meetsMinAge,
    };
  } catch (error) {
    console.warn("Failed to fetch on-chain data, using mock:", error);
    return getMockReputationData(address, criteria);
  }
}

/**
 * Estimate wallet age in days.
 * On testnet/demo, we use BSCScan API if available, otherwise mock.
 */
async function estimateWalletAge(address: Address): Promise<number> {
  try {
    // Try BSCScan testnet API for first tx
    const apiKey = import.meta.env.VITE_BSCSCAN_API_KEY;
    const baseUrl = "https://api-testnet.bscscan.com/api";
    const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${apiKey || ""}`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status === "1" && data.result?.length > 0) {
      const firstTxTime = parseInt(data.result[0].timeStamp);
      const ageSeconds = Math.floor(Date.now() / 1000) - firstTxTime;
      return Math.floor(ageSeconds / 86400); // Convert to days
    }
  } catch {
    // Fall through to default
  }

  // Default: assume 90 days for demo purposes
  return 90;
}

/**
 * Mock reputation data for demo/testing
 */
export function getMockReputationData(
  address: Address,
  criteria: ReputationCriteria = DEFAULT_CRITERIA
): ReputationData {
  // Generate deterministic mock data from address
  const seed = parseInt(address.slice(2, 10), 16);
  const mockBalance = BigInt("500000000000000000"); // 0.5 BNB
  const mockTxCount = 42;
  const mockAge = 180; // 180 days

  return {
    address,
    bnbBalance: mockBalance,
    txCount: mockTxCount,
    walletAge: mockAge,
    firstTxTimestamp: Math.floor(Date.now() / 1000) - mockAge * 86400,
    bnbBalanceFormatted: formatEther(mockBalance),
    meetsMinBalance: mockBalance >= criteria.minBalance,
    meetsMinTxCount: mockTxCount >= criteria.minTxCount,
    meetsMinAge: mockAge >= criteria.minWalletAge,
    isReputable: true,
  };
}
