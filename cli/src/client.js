// Repute CLI — Blockchain client
// Shared viem client for all commands

import { createPublicClient, http } from "viem";
import { bscTestnet, bsc } from "viem/chains";
import { getChainConfig } from "./config.js";

let _client = null;

/**
 * Get a shared public client for the configured network
 */
export function getClient() {
  if (_client) return _client;

  const chain = getChainConfig();
  const viemChain = chain.id === 97 ? bscTestnet : bsc;

  _client = createPublicClient({
    chain: viemChain,
    transport: http(chain.rpcUrl),
  });

  return _client;
}
