# Repute Privacy Relayer

**Identity-Gated Gas Relayer on BNB Chain**

> Built for the BNB Chain Hackathon — Privacy-preserving gas sponsorship using ZK proofs, Railgun shielded payments, and ERC-4337 Paymaster.

---

## What Is This?

Repute lets users prove their wallet has good reputation (minimum balance, transaction count, wallet age) **without revealing their address**. A ZK proof is verified on-chain by a Groth16 verifier, and if valid, an ERC-4337 Paymaster sponsors gas for a fresh wallet — enabling fully private transactions.

### Flow

```
Wallet A (reputable) → Shield via Railgun → ZK Proof → Paymaster verifies → Wallet B gets gas sponsored
```

1. **Connect** your reputable wallet and read on-chain reputation
2. **Shield** — Deposit tokens into Railgun's encrypted pool, privately pay the Paymaster via RailgunRelay
3. **Prove** — Generate a ZK proof of reputation (no address leaked)
4. **Pay** — Enter Wallet B address and activate the Paymaster
5. **Operate** — Wallet B transacts with sponsored gas, no on-chain link to Wallet A

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Frontend   │────▶│  ZK Proof Gen    │────▶│  ERC-4337 Bundler │
│  React/Vite  │     │  snarkjs/Groth16 │     │  (Pimlico/etc.)   │
└──────┬───────┘     └──────────────────┘     └─────────┬─────────┘
       │                                                │
       ▼                                      ┌─────────▼─────────┐
┌──────────────┐     ┌──────────────────┐     │  ReputePaymaster  │
│   Railgun    │────▶│  RailgunRelay    │────▶│  (BasePaymaster)  │
│ Shielded Pool│     │  (fee + forward) │     └─────────┬─────────┘
└──────────────┘     └──────────────────┘               │
                                              ┌─────────▼─────────┐
                                              │ Groth16Verifier   │
                                              │   (on-chain)      │
                                              └───────────────────┘
```

**Smart Contracts** (Solidity 0.8.23)
- `Groth16Verifier.sol` — On-chain ZK proof verification using bn128 precompiles
- `ReputePaymaster.sol` — ERC-4337 Paymaster that validates ZK proofs and sponsors gas
- `RailgunRelay.sol` — Adapter that receives Railgun unshielded funds and forwards to Paymaster (with 5% fee)

**Privacy Layer** (Railgun)
- Wallet A deposits tokens into Railgun's encrypted UTXO pool
- Private transfer inside the pool breaks the on-chain link
- Tokens unshield to RailgunRelay → forwarded to Paymaster
- On mainnet: real Railgun contracts; on testnet: simulated flow with same relay contract

**ZK Circuit** (Circom 2.1.6)
- `reputation.circom` — Proves wallet meets reputation criteria without revealing address
- Uses Poseidon hashes for nullifier (prevents double-use) and commitment

**Frontend** (React + TypeScript + Vite)
- RainbowKit wallet connection
- Railgun shield flow with progress indicators
- Browser-side ZK proof generation via snarkjs
- 5-step wizard UI: Connect → Shield → Prove → Pay → Operate

---

## Project Structure

```
repute/
├── contracts/              # Smart contracts + ZK circuits
│   ├── contracts/          # Solidity source
│   │   ├── ReputePaymaster.sol
│   │   ├── Groth16Verifier.sol
│   │   ├── RailgunRelay.sol
│   │   ├── MockEntryPoint.sol
│   │   └── MockERC20.sol
│   ├── circuits/           # Circom ZK circuits
│   │   └── reputation/
│   ├── scripts/            # Deploy + utility scripts
│   ├── test/               # Hardhat tests (62 passing)
│   └── hardhat.config.js
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── config/         # wagmi + contract config
│   │   ├── hooks/          # React hooks (use-railgun, use-toast, etc.)
│   │   ├── lib/            # ZK proof, reputation, paymaster, railgun logic
│   │   └── pages/          # Index, AppDashboard, History, Docs, Pricing
│   └── vite.config.ts
│
├── docs/                   # Project documentation
│   ├── PROJECT.md          # Problem, solution, impact, roadmap
│   └── TECHNICAL.md        # Architecture, contracts, circuit details
│
└── bsc.address             # Deployed BSC Testnet contract addresses
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- A BSC Testnet wallet with tBNB ([faucet](https://www.bnbchain.org/en/testnet-faucet))

### 1. Smart Contracts

```bash
cd contracts
cp .env.example .env
# Edit .env — set DEPLOYER_PRIVATE_KEY

npm install
npx hardhat test                                    # Run all 62 tests
npx hardhat run scripts/deploy.js --network bscTestnet  # Deploy to BSC Testnet
```

After deployment, note the printed contract addresses.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_PAYMASTER_ADDRESS, VITE_VERIFIER_ADDRESS, VITE_RAILGUN_RELAY_ADDRESS, VITE_WALLETCONNECT_PROJECT_ID

npm install
npm run dev      # Dev server at http://localhost:8080
npm run build    # Production build
```

---

## Deployment to BSC Testnet

### Step-by-step

1. **Get tBNB** from [BNB Chain Faucet](https://www.bnbchain.org/en/testnet-faucet)

2. **Set up contracts environment**:
   ```bash
   cd contracts
   cp .env.example .env
   # Set DEPLOYER_PRIVATE_KEY (without 0x prefix)
   ```

3. **Run deployment readiness check**:
   ```bash
   chmod +x scripts/check-deploy.sh
   ./scripts/check-deploy.sh
   ```

4. **Deploy**:
   ```bash
   npx hardhat run scripts/deploy.js --network bscTestnet
   ```
   This deploys `Groth16Verifier`, `ReputePaymaster`, and `RailgunRelay`, then configures accepted tokens, funds and stakes the paymaster on the EntryPoint.

5. **Wire frontend**:
   ```bash
   cd ../frontend
   cp .env.example .env
   # Set the deployed addresses from step 4
   ```

6. **Get a WalletConnect Project ID** from [cloud.walletconnect.com](https://cloud.walletconnect.com) and set `VITE_WALLETCONNECT_PROJECT_ID`.

7. **Build and serve**:
   ```bash
   npm run build
   npx serve dist
   ```

### Optional: Circuit Compilation

To generate real ZK proofs in-browser (instead of mock proofs):

```bash
cd contracts
# Install circom: https://docs.circom.io/getting-started/installation/
npm run circuit:compile
# Copy output to frontend
cp circuits/reputation/reputation_js/reputation.wasm ../frontend/public/
cp circuits/reputation/reputation_final.zkey ../frontend/public/
```

### Optional: ERC-4337 Bundler

For real UserOperation submission, set `VITE_BUNDLER_URL` to a bundler endpoint:
- [Pimlico](https://pimlico.io)
- [Stackup](https://stackup.sh)
- [Alchemy](https://www.alchemy.com)

Without a bundler URL, the frontend uses a mock that simulates successful submission.

---

## Testing

### Smart Contracts
```bash
cd contracts
npx hardhat test          # 62 tests (unit + integration + RailgunRelay)
npx hardhat coverage      # Coverage report
```

### Frontend
```bash
cd frontend
npm run test              # Vitest
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.23, Hardhat, OpenZeppelin 5.x |
| Account Abstraction | ERC-4337 v0.7, BasePaymaster |
| Privacy Layer | Railgun (shielded pool + RailgunRelay adapter) |
| ZK Proofs | Circom 2.1.6, Groth16, snarkjs |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Wallet | RainbowKit, wagmi, viem |
| Chain | BNB Smart Chain (BSC Testnet / Mainnet) |

---

## Key Contracts

### RailgunRelay

Adapter between Railgun's shielded pool and the Paymaster:
- Receives tokens from Railgun's Relay Adapt contract (unshield destination)
- Deducts a 5% convenience fee for protocol revenue
- Forwards the net amount to the Paymaster
- Supports multiple ERC-20 tokens (USDT, USDC) and native BNB
- Includes emergency rescue functions and configurable fee settings
- On-chain trace: `RelayAdapt → RailgunRelay → Paymaster` (Wallet A absent)

### ReputePaymaster

The paymaster validates ZK proofs in `_validatePaymasterUserOp`:
- Decodes `nullifierHash`, `commitmentHash`, and Groth16 proof from `paymasterAndData`
- Checks nullifier hasn't been used (prevents replay)
- Verifies ZK proof against on-chain criteria (min balance, tx count, wallet age)
- Sponsors gas if proof is valid (up to `maxSponsoredOps` per wallet)

### Groth16Verifier

On-chain Groth16 proof verification using EVM bn128 precompiles:
- Precompile `0x06`: EC point addition
- Precompile `0x07`: EC scalar multiplication
- Precompile `0x08`: Pairing check

Verification key is updateable by the owner (for circuit updates).

### Reputation Circuit

5 public signals: `nullifierHash`, `minBalance`, `minTxCount`, `minWalletAge`, `commitmentHash`

Private inputs: `walletAddress`, `secret`, `bnbBalance`, `txCount`, `walletAge`

The circuit proves:
1. The prover knows a wallet meeting the criteria
2. A deterministic nullifier (prevents double-use)
3. A commitment binding the proof to the wallet

---

## License

MIT
