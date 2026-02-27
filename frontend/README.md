# Repute Privacy Relayer — Frontend

React + TypeScript + Vite frontend for the Repute Privacy Relayer.

## Stack

- **React 18** + **TypeScript**
- **Vite** — build tooling
- **Tailwind CSS** + **shadcn/ui** — styling
- **RainbowKit** + **wagmi** + **viem** — wallet connection
- **snarkjs** — browser-side ZK proof generation
- **Framer Motion** — animations

## Setup

```bash
cp .env.example .env
# Edit .env with your contract addresses and WalletConnect project ID
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_PAYMASTER_ADDRESS` | Deployed ReputePaymaster address | Yes |
| `VITE_VERIFIER_ADDRESS` | Deployed Groth16Verifier address | Yes |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Yes |
| `VITE_CHAIN` | `testnet` or `mainnet` | No (default: testnet) |
| `VITE_BSC_TESTNET_RPC` | Custom BSC testnet RPC | No |
| `VITE_BSC_MAINNET_RPC` | Custom BSC mainnet RPC | No |
| `VITE_BUNDLER_URL` | ERC-4337 bundler endpoint | No (mock fallback) |
| `VITE_BSCSCAN_API_KEY` | BSCScan API key for wallet age | No |

## Scripts

```bash
npm run dev       # Dev server (port 8080)
npm run build     # Production build
npm run preview   # Preview production build
npm run test      # Run tests
npm run lint      # ESLint
```

## Key Files

- `src/config/wagmi.ts` — Chain + wallet configuration
- `src/config/contracts.ts` — Contract ABIs and addresses
- `src/lib/reputation.ts` — On-chain reputation data fetching
- `src/lib/zkproof.ts` — ZK proof generation (real + mock)
- `src/lib/paymaster.ts` — UserOp encoding and submission
- `src/components/RelayerFlow.tsx` — Main 4-step wizard
