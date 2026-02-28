// Repute CLI — Configuration
// Contract addresses, ABIs, and chain settings

// ══════════════════════════════════════════════════════════════
//  CHAIN CONFIG
// ══════════════════════════════════════════════════════════════

export const CHAINS = {
  bscTestnet: {
    id: 97,
    name: "BSC Testnet",
    rpcUrl: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
    explorer: "https://testnet.bscscan.com",
    bscscanApi: "https://api-testnet.bscscan.com/api",
  },
  bscMainnet: {
    id: 56,
    name: "BSC Mainnet",
    rpcUrl: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/",
    explorer: "https://bscscan.com",
    bscscanApi: "https://api.bscscan.com/api",
  },
};

export function getChainConfig() {
  const network = process.env.REPUTE_NETWORK || "bscTestnet";
  const config = CHAINS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}. Use bscTestnet or bscMainnet.`);
  }
  return config;
}

// ══════════════════════════════════════════════════════════════
//  CONTRACT ADDRESSES
// ══════════════════════════════════════════════════════════════

export const CONTRACTS = {
  entryPoint: process.env.ENTRYPOINT_ADDRESS || "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  groth16Verifier: process.env.VERIFIER_ADDRESS || "0x31095AcE88bC37DB177da15D62788B0cFB2C4761",
  reputePaymaster: process.env.PAYMASTER_ADDRESS || "0x6A0c7e8d7726F906C947D2E4ae66709b24BcBc33",
  railgunRelay: process.env.RAILGUN_RELAY_ADDRESS || "0x8C5b784c9B8D6b9c9A81Cd1CA4957eA398B5Ea6a",
};

// ══════════════════════════════════════════════════════════════
//  ABIs (only the functions we need)
// ══════════════════════════════════════════════════════════════

export const PAYMASTER_ABI = [
  {
    inputs: [{ internalType: "address", name: "wallet", type: "address" }],
    name: "getWalletStatus",
    outputs: [
      { internalType: "bool", name: "activated", type: "bool" },
      { internalType: "uint256", name: "opsRemaining", type: "uint256" },
      { internalType: "uint256", name: "activatedAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "nullifierHash", type: "uint256" }],
    name: "isNullifierUsed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minTxCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minWalletAge",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSponsoredOps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "verifier",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "nullifiers",
    outputs: [
      { internalType: "bool", name: "used", type: "bool" },
      { internalType: "address", name: "activatedWallet", type: "address" },
      { internalType: "uint256", name: "opsRemaining", type: "uint256" },
      { internalType: "uint256", name: "activatedAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: true, internalType: "uint256", name: "nullifierHash", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "sponsoredOps", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "WalletActivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: true, internalType: "uint256", name: "nullifierHash", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "opsRemaining", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "actualGasCost", type: "uint256" },
    ],
    name: "GasSponsored",
    type: "event",
  },
];

export const VERIFIER_ABI = [
  {
    inputs: [
      { internalType: "uint256[2]", name: "_pA", type: "uint256[2]" },
      { internalType: "uint256[2][2]", name: "_pB", type: "uint256[2][2]" },
      { internalType: "uint256[2]", name: "_pC", type: "uint256[2]" },
      { internalType: "uint256[5]", name: "_pubSignals", type: "uint256[5]" },
    ],
    name: "verifyProof",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

export const RELAY_ABI = [
  {
    inputs: [],
    name: "paymaster",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalNativeReceived",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalReceived",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "acceptedTokens",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

// ══════════════════════════════════════════════════════════════
//  BUNDLER CONFIG
// ══════════════════════════════════════════════════════════════

export const BUNDLER_URL = process.env.BUNDLER_URL || null;
export const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
