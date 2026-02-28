# Repute CLI

Command-line interface & SDK for the Repute protocol — an identity-gated gas relayer on BNB Chain using zero-knowledge proofs.

Built for AI agents and developers who need programmatic access to the Repute system without a browser.

## Quick Start

```bash
cd cli
npm install
cp .env.example .env    # Optional — defaults work for BSC Testnet

# Run directly
node bin/repute.js --help

# Or install globally
npm link
repute --help
```

## Commands

| Command | Description |
|---|---|
| `repute reputation <address>` | Check wallet on-chain reputation (balance, tx count, age) |
| `repute status <address>` | Check wallet activation status on the Paymaster |
| `repute config` | Show Paymaster on-chain configuration & thresholds |
| `repute contracts` | Show deployed contract addresses & explorer links |
| `repute prove <address>` | Generate a ZK reputation proof for a wallet |
| `repute activate <address>` | Full activation flow: reputation → proof → UserOp → submit |
| `repute encode-proof <address>` | Generate proof and output encoded paymasterAndData |
| `repute nullifier <hash>` | Check if a nullifier hash has been used |
| `repute health` | Check RPC connectivity and contract deployment status |

## JSON Mode (for AI Agents)

Every command supports `--json` for machine-readable output:

```bash
repute reputation 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --json
repute status 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --json
repute config --json
repute health --json
repute prove 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --json --mock
repute activate 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --json --dry-run
```

JSON output can be piped to `jq` or consumed by any script/agent:

```bash
# Check if a wallet is reputable
repute reputation 0x... --json | jq '.isReputable'

# Get the paymasterAndData for a UserOp
repute encode-proof 0x... --json --mock | jq -r '.paymasterAndData'

# Health check in CI
repute health --json | jq '.paymaster.ok'
```

## Examples

### Check a wallet's reputation

```bash
$ repute reputation 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18

  ╔══════════════════════════════════════╗
  ║     ⚡ REPUTE CLI — BNB Chain ⚡     ║
  ║  Identity-Gated Gas Relayer (ZK)     ║
  ╚══════════════════════════════════════╝

━━━ Wallet Reputation ━━━
  Address       0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
  BNB Balance   0.500000 BNB
  Tx Count      42
  Wallet Age    180 days

━━━ Criteria Check ━━━
  ✓ Balance ≥ 0.010000 BNB (actual: 0.500000 BNB)
  ✓ Tx Count ≥ 5 (actual: 42)
  ✓ Wallet Age ≥ 30 days (actual: 180 days)

  ✓ Wallet IS reputable — eligible for gas sponsorship
```

### Full activation flow (dry run)

```bash
$ repute activate 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --dry-run --mock
```

### Get encoded proof for a custom UserOp

```bash
$ repute encode-proof 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --mock --json
```

## Network Configuration

By default, the CLI targets BSC Testnet. To switch:

```bash
# Via flag
repute health --network bscMainnet

# Via environment variable
REPUTE_NETWORK=bscMainnet repute health

# Via .env file
echo "REPUTE_NETWORK=bscMainnet" >> .env
```

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│   repute CLI    │────▶│  BSC RPC     │────▶│  Paymaster    │
│  (Node.js)      │     │  (viem)      │     │  (on-chain)   │
└───────┬─────────┘     └──────────────┘     └───────────────┘
        │
        ├── reputation.js   → Fetch balance, txCount, walletAge
        ├── zkproof.js      → Generate Groth16 proofs (mock/real)
        ├── paymaster.js    → Query Paymaster, encode proofs, build UserOps
        └── display.js      → Formatted terminal output + JSON mode
```

## For AI Agents

The CLI is designed to be consumed by AI agents through the `--json` flag. Typical agent workflow:

1. **Check health**: `repute health --json` → Verify connectivity
2. **Check reputation**: `repute reputation <addr> --json` → Get wallet eligibility
3. **Generate proof**: `repute prove <addr> --json --mock` → Get proof data
4. **Activate**: `repute activate <addr> --json --dry-run` → Build UserOp
5. **Submit**: `repute activate <addr> --json --bundler <url>` → Submit to bundler

All outputs are valid JSON with BigInt values serialized as strings.
