#!/usr/bin/env node

/**
 * Repute CLI — Command-line interface for the Repute protocol
 * Identity-gated gas relayer on BNB Chain
 *
 * Usage:
 *   repute reputation <address>     Check wallet reputation
 *   repute status <address>         Check Paymaster activation status
 *   repute config                   Show Paymaster configuration
 *   repute prove <address>          Generate ZK reputation proof
 *   repute activate <address>       Full activation flow (prove + submit)
 *   repute contracts                Show deployed contract addresses
 *   repute nullifier <hash>         Check if a nullifier has been used
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

// Load .env from cli/ directory
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

// Now import the CLI app
import("../src/index.js");
