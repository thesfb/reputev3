# Repute — Project Overview

## The Problem

When you fund a new wallet from an existing one, the link between them is visible on-chain forever. Your identity, your history, your holdings — all traceable in one transaction. This is the **doxxing-at-funding** problem.

There's no middle ground today. You either accept full transparency (and the risks that come with it) or resort to mixers and privacy tools that can't distinguish between legitimate users and bad actors. Developers, activists, freelancers, security researchers — anyone who needs a clean wallet for legitimate reasons gets treated the same as someone laundering money.

## What Repute Does

Repute is an identity-gated gas relayer on BNB Chain. It lets users prove their existing wallet has good on-chain reputation — enough balance, enough transaction history, enough age — using a zero-knowledge proof. No personal data is revealed. If the proof checks out, an ERC-4337 Paymaster sponsors gas for a brand new wallet.

The result: you get a fresh, funded wallet with zero on-chain connection to your original one. And because only verified-reputable wallets can access the system, illicit actors are filtered out by design.

**Flow:**
```
Old wallet → ZK proof of reputation → Paymaster verifies on-chain → New wallet gets gas
```

## Why It Matters

- Privacy and compliance don't have to be at odds. Repute proves they can coexist.
- Reduces attack surface for users who hold significant assets and need operational wallets.
- Opens the door for protocols to offer privacy features without the regulatory gray area.
- Built entirely on BNB Chain — leveraging low fees and fast finality for practical day-to-day use.

## Roadmap

**Done:**
- Groth16 circuit for reputation proofs (Circom 2.1.6)
- On-chain verifier + ERC-4337 Paymaster on BSC Testnet
- Frontend with wallet connection, browser-side proof generation, 4-step activation flow
- History tracking, documentation, and pricing pages

**Next:**
- Security audit of smart contracts
- BSC Mainnet deployment
- API for programmatic proof generation and paymaster activation
- Custom reputation criteria per deployment (white-label)
- Multi-chain expansion beyond BNB Chain
- Explorer integration for proof verification transparency
