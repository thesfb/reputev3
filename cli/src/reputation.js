// Repute CLI — Reputation data fetching
// Check wallet on-chain reputation (balance, tx count, age)

import { formatEther } from "viem";
import { getClient } from "./client.js";
import { getChainConfig, BSCSCAN_API_KEY } from "./config.js";

/**
 * Fetch real on-chain reputation data for a wallet address
 * @param {string} address - Wallet address (0x...)
 * @param {object} criteria - Minimum thresholds: { minBalance, minTxCount, minWalletAge }
 * @returns {Promise<object>} Reputation data with pass/fail status
 */
export async function fetchReputation(address, criteria = null) {
  const defaults = {
    minBalance: BigInt("10000000000000000"), // 0.01 BNB
    minTxCount: 5,
    minWalletAge: 30,
  };
  const c = criteria || defaults;

  const client = getClient();

  // Fetch balance and tx count in parallel
  const [balance, txCount] = await Promise.all([
    client.getBalance({ address }),
    client.getTransactionCount({ address }),
  ]);

  // Estimate wallet age
  const walletAge = await estimateWalletAge(address);

  const meetsMinBalance = balance >= c.minBalance;
  const meetsMinTxCount = txCount >= c.minTxCount;
  const meetsMinAge = walletAge >= c.minWalletAge;

  return {
    address,
    bnbBalance: balance,
    bnbBalanceFormatted: formatEther(balance),
    txCount,
    walletAge,
    firstTxTimestamp: Math.floor(Date.now() / 1000) - walletAge * 86400,
    meetsMinBalance,
    meetsMinTxCount,
    meetsMinAge,
    isReputable: meetsMinBalance && meetsMinTxCount && meetsMinAge,
    criteria: {
      minBalance: c.minBalance.toString(),
      minTxCount: c.minTxCount,
      minWalletAge: c.minWalletAge,
    },
  };
}

/**
 * Estimate wallet age in days using BSCScan API
 * @param {string} address
 * @returns {Promise<number>} Age in days
 */
async function estimateWalletAge(address) {
  try {
    const chain = getChainConfig();
    const url = `${chain.bscscanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${BSCSCAN_API_KEY}`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status === "1" && data.result?.length > 0) {
      const firstTxTime = parseInt(data.result[0].timeStamp);
      const ageSeconds = Math.floor(Date.now() / 1000) - firstTxTime;
      return Math.floor(ageSeconds / 86400);
    }
  } catch {
    // Fall through to default
  }

  // Default heuristic: check if wallet has any txns
  const client = getClient();
  const txCount = await client.getTransactionCount({ address });
  return txCount > 0 ? 90 : 0; // Assume 90 days if has txns, 0 if empty
}
