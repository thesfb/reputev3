// Contract ABIs and addresses for the Repute system
// Addresses are updated after deployment — use .env overrides for testnet/mainnet

// ============ Addresses ============
// These will be set after deployment. For now, use placeholder zeros.
// Override with VITE_PAYMASTER_ADDRESS and VITE_VERIFIER_ADDRESS env vars.

export const ENTRYPOINT_V07_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;

export const PAYMASTER_ADDRESS = (
  import.meta.env.VITE_PAYMASTER_ADDRESS || "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const VERIFIER_ADDRESS = (
  import.meta.env.VITE_VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

// ============ ReputePaymaster ABI (key functions only) ============
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
] as const;

// ============ Groth16Verifier ABI (key functions only) ============
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
  {
    inputs: [],
    name: "initialized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
