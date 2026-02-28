# Repute — Technical Overview

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│    Frontend       │────▶│  ZK Proof Gen    │────▶│  ERC-4337 Bundler │
│  React / Vite     │     │  snarkjs/Groth16 │     │                   │
└───────┬──────────┘     └──────────────────┘     └────────┬──────────┘
        │                                                 │
        ▼                                       ┌────────▼──────────┐
┌──────────────────┐     ┌──────────────────┐     │ ReputePaymaster   │
│   Railgun Pool    │────▶│  RailgunRelay    │────▶│ (BasePaymaster)   │
│ (encrypted UTXO)  │     │ (fee + forward)  │     └────────┬──────────┘
└──────────────────┘     └──────────────────┘               │
                                              ┌────────▼──────────┐
                                              │ Groth16Verifier   │
                                              │   (on-chain)      │
                                              └───────────────────┘
```

### Smart Contracts (Solidity 0.8.23)

| Contract | Purpose |
|---|---|
| `Groth16Verifier.sol` | On-chain ZK proof verification via bn128 precompiles (ecAdd, ecMul, ecPairing) |
| `ReputePaymaster.sol` | ERC-4337 BasePaymaster — decodes proof from `paymasterAndData`, verifies via Groth16Verifier, sponsors gas if valid |
| `RailgunRelay.sol` | Adapter between Railgun shielded pool and Paymaster. Receives unshielded tokens, deducts 5% fee, forwards to Paymaster. Breaks the on-chain link between Wallet A and Paymaster funding. |
| `MockEntryPoint.sol` | Test harness for local development |
| `MockERC20.sol` | ERC-20 mock for testing RailgunRelay token forwarding |

Paymaster validates in `_validatePaymasterUserOp`:
1. Decode `nullifierHash`, `commitmentHash`, and Groth16 proof from calldata
2. Check nullifier hasn't been spent (prevents replay)
3. Call Groth16Verifier with public signals + proof
4. If valid, sponsor gas (up to `maxSponsoredOps` per wallet)

### ZK Circuit (Circom 2.1.6)

**Public signals (5):** `nullifierHash`, `minBalance`, `minTxCount`, `minWalletAge`, `commitmentHash`

**Private inputs (5):** `walletAddress`, `secret`, `bnbBalance`, `txCount`, `walletAge`

The circuit proves:
- `nullifierHash = Poseidon(secret, walletAddress)` — deterministic, prevents double-use
- `commitmentHash = Poseidon(walletAddress, bnbBalance, txCount, walletAge)` — binds proof to data
- `bnbBalance >= minBalance`
- `txCount >= minTxCount`
- `walletAge >= minWalletAge`

### Frontend (React + TypeScript + Vite)

- **Wallet connection**: RainbowKit + wagmi + viem
- **Proof generation**: snarkjs in-browser (no server round-trip)
- **Railgun integration**: Shield/unshield flow with progress indicators, mock mode for testnet
- **UserOp construction**: Built client-side, submitted to ERC-4337 bundler
- **UI**: Tailwind CSS + shadcn/ui

---

## Setup

### Prerequisites

- Node.js >= 18
- BSC Testnet wallet with tBNB ([faucet](https://www.bnbchain.org/en/testnet-faucet))

### Smart Contracts

```bash
cd contracts
cp .env.example .env
# Set DEPLOYER_PRIVATE_KEY (without 0x prefix)

npm install
npx hardhat test                                        # 62 tests
npx hardhat run scripts/deploy.js --network bscTestnet  # Deploy
```

Deployment outputs contract addresses to `deployments-bscTestnet.json`.

### Frontend

```bash
cd frontend
cp .env.example .env
# Set:
#   VITE_PAYMASTER_ADDRESS=<from deployment>
#   VITE_VERIFIER_ADDRESS=<from deployment>
#   VITE_RAILGUN_RELAY_ADDRESS=<from deployment>
#   VITE_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>

npm install
npm run dev    # http://localhost:8080
npm run build  # Production build
```

### Circuit Compilation (optional)

For real browser-side proofs instead of mock:

```bash
cd contracts
# Install circom: https://docs.circom.io/getting-started/installation/
npm run circuit:compile
cp circuits/reputation/reputation_js/reputation.wasm ../frontend/public/
cp circuits/reputation/reputation_final.zkey ../frontend/public/
```

### ERC-4337 Bundler (optional)

Set `VITE_BUNDLER_URL` to a bundler endpoint (Pimlico, Stackup, Alchemy). Without it, the frontend simulates successful submission.

---

## Stack

| Layer | Tech |
|---|---|
| Contracts | Solidity 0.8.23, Hardhat, OpenZeppelin 5.x |
| Account Abstraction | ERC-4337 v0.7, BasePaymaster |
| Privacy Layer | Railgun (shielded pool + RailgunRelay adapter) |
| ZK Proofs | Circom 2.1.6, Groth16, snarkjs |
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| Wallet | RainbowKit, wagmi, viem |
| Chain | BNB Smart Chain (Testnet: 97, Mainnet: 56) |

## Testing

```bash
# Contracts (62 tests — unit + integration + RailgunRelay)
cd contracts && npx hardhat test

# Frontend
cd frontend && npm run test
```
