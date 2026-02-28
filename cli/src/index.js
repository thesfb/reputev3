// Repute CLI — Main entry point
// All commands are registered here via Commander.js

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import {
  printBanner,
  sectionHeader,
  printKeyValue,
  printCheck,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  fmtAddress,
  fmtBNB,
  fmtTimestamp,
  fmtHash,
  printJSON,
} from "./display.js";
import { CONTRACTS, BUNDLER_URL, getChainConfig } from "./config.js";
import { fetchReputation } from "./reputation.js";
import {
  getWalletStatus,
  getPaymasterConfig,
  getRelayInfo,
  isNullifierUsed,
  getNullifierDetails,
  encodePaymasterData,
  buildUserOp,
  submitUserOp,
} from "./paymaster.js";
import { generateProof, generateMockProof } from "./zkproof.js";

const program = new Command();

program
  .name("repute")
  .version("1.0.0")
  .description("Repute CLI — Identity-gated gas relayer on BNB Chain (ZK)")
  .option("--json", "Output raw JSON (for AI agents and scripts)")
  .option("--network <network>", "Network: bscTestnet or bscMainnet", "bscTestnet")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.network) {
      process.env.REPUTE_NETWORK = opts.network;
    }
    if (!opts.json) {
      printBanner();
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute reputation <address>
// ══════════════════════════════════════════════════════════════

program
  .command("reputation <address>")
  .alias("rep")
  .description("Check wallet on-chain reputation (balance, tx count, age)")
  .action(async (address, _, cmd) => {
    const globalOpts = cmd.parent.opts();
    const spinner = globalOpts.json ? null : ora("Fetching on-chain reputation data…").start();

    try {
      // First try to get on-chain criteria from the Paymaster
      let criteria = null;
      try {
        const config = await getPaymasterConfig();
        criteria = {
          minBalance: config.minBalance,
          minTxCount: Number(config.minTxCount),
          minWalletAge: Number(config.minWalletAge),
        };
      } catch {
        // Use defaults if Paymaster is unreachable
      }

      const rep = await fetchReputation(address, criteria);
      spinner?.stop();

      if (globalOpts.json) {
        printJSON(rep);
        return;
      }

      sectionHeader("Wallet Reputation");
      printKeyValue([
        ["Address", address],
        ["BNB Balance", `${rep.bnbBalanceFormatted} BNB`],
        ["Tx Count", rep.txCount.toString()],
        ["Wallet Age", `${rep.walletAge} days`],
      ]);

      sectionHeader("Criteria Check");
      printCheck(
        `Balance ≥ ${fmtBNB(BigInt(rep.criteria.minBalance))}`,
        rep.meetsMinBalance,
        `actual: ${rep.bnbBalanceFormatted} BNB`
      );
      printCheck(
        `Tx Count ≥ ${rep.criteria.minTxCount}`,
        rep.meetsMinTxCount,
        `actual: ${rep.txCount}`
      );
      printCheck(
        `Wallet Age ≥ ${rep.criteria.minWalletAge} days`,
        rep.meetsMinAge,
        `actual: ${rep.walletAge} days`
      );

      console.log("");
      if (rep.isReputable) {
        printSuccess("Wallet IS reputable — eligible for gas sponsorship");
      } else {
        printError("Wallet does NOT meet reputation criteria");
      }
    } catch (err) {
      spinner?.fail("Failed to fetch reputation");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute status <address>
// ══════════════════════════════════════════════════════════════

program
  .command("status <address>")
  .description("Check wallet activation status on the Paymaster")
  .action(async (address, _, cmd) => {
    const globalOpts = cmd.parent.opts();
    const spinner = globalOpts.json ? null : ora("Querying Paymaster…").start();

    try {
      const status = await getWalletStatus(address);
      spinner?.stop();

      if (globalOpts.json) {
        printJSON({ address, ...status });
        return;
      }

      sectionHeader("Paymaster Status");
      printKeyValue([
        ["Address", address],
        ["Activated", status.activated ? chalk.green("YES") : chalk.dim("NO")],
        ["Ops Remaining", status.opsRemaining.toString()],
        ["Activated At", fmtTimestamp(status.activatedAt)],
      ]);

      if (status.activated) {
        printSuccess(`Wallet is activated with ${status.opsRemaining} sponsored ops remaining`);
      } else {
        printInfo("Wallet has not been activated yet. Use 'repute activate' to activate.");
      }
    } catch (err) {
      spinner?.fail("Failed to query Paymaster");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute config
// ══════════════════════════════════════════════════════════════

program
  .command("config")
  .description("Show Paymaster on-chain configuration and thresholds")
  .action(async (_, cmd) => {
    const globalOpts = cmd.parent.opts();
    const spinner = globalOpts.json ? null : ora("Reading Paymaster config…").start();

    try {
      const config = await getPaymasterConfig();
      const relayInfo = await getRelayInfo();
      spinner?.stop();

      if (globalOpts.json) {
        printJSON({ paymaster: config, relay: relayInfo });
        return;
      }

      sectionHeader("Paymaster Configuration");
      printKeyValue([
        ["Contract", CONTRACTS.reputePaymaster],
        ["Owner", config.owner],
        ["Verifier", config.verifier],
        ["Min Balance", fmtBNB(config.minBalance)],
        ["Min Tx Count", config.minTxCount.toString()],
        ["Min Wallet Age", `${config.minWalletAge} days`],
        ["Max Sponsored Ops", config.maxSponsoredOps.toString()],
      ]);

      if (relayInfo) {
        sectionHeader("RailgunRelay");
        printKeyValue([
          ["Contract", CONTRACTS.railgunRelay],
          ["Paymaster Target", relayInfo.paymaster],
          ["Fee", `${Number(relayInfo.feeBps) / 100}%`],
          ["Treasury", relayInfo.treasury],
          ["Total BNB Received", fmtBNB(relayInfo.totalNativeReceived)],
        ]);
      }
    } catch (err) {
      spinner?.fail("Failed to read config");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute contracts
// ══════════════════════════════════════════════════════════════

program
  .command("contracts")
  .description("Show deployed contract addresses")
  .action(async (_, cmd) => {
    const globalOpts = cmd.parent.opts();
    const chain = getChainConfig();

    if (globalOpts.json) {
      printJSON({ network: chain.name, chainId: chain.id, contracts: CONTRACTS });
      return;
    }

    sectionHeader(`Deployed Contracts (${chain.name})`);
    printKeyValue([
      ["EntryPoint (v0.7)", CONTRACTS.entryPoint],
      ["Groth16Verifier", CONTRACTS.groth16Verifier],
      ["ReputePaymaster", CONTRACTS.reputePaymaster],
      ["RailgunRelay", CONTRACTS.railgunRelay],
    ]);

    sectionHeader("Explorer Links");
    for (const [name, addr] of Object.entries(CONTRACTS)) {
      console.log(`  ${chalk.dim(name.padEnd(18))} ${chain.explorer}/address/${addr}`);
    }
    console.log("");
  });

// ══════════════════════════════════════════════════════════════
//  repute nullifier <hash>
// ══════════════════════════════════════════════════════════════

program
  .command("nullifier <hash>")
  .description("Check if a nullifier hash has been used")
  .action(async (hash, _, cmd) => {
    const globalOpts = cmd.parent.opts();
    const spinner = globalOpts.json ? null : ora("Checking nullifier…").start();

    try {
      const details = await getNullifierDetails(hash);
      spinner?.stop();

      if (globalOpts.json) {
        printJSON({ nullifierHash: hash, ...details });
        return;
      }

      sectionHeader("Nullifier Status");
      printKeyValue([
        ["Hash", fmtHash(hash)],
        ["Used", details.used ? chalk.red("YES (spent)") : chalk.green("NO (available)")],
      ]);

      if (details.used) {
        printKeyValue([
          ["Activated Wallet", details.activatedWallet],
          ["Ops Remaining", details.opsRemaining.toString()],
          ["Activated At", fmtTimestamp(details.activatedAt)],
        ]);
      }
    } catch (err) {
      spinner?.fail("Failed to check nullifier");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute prove <address>
// ══════════════════════════════════════════════════════════════

program
  .command("prove <address>")
  .description("Generate a ZK reputation proof for a wallet")
  .option("--mock", "Force mock proof generation (for demo/testing)")
  .action(async (address, opts, cmd) => {
    const globalOpts = cmd.parent.opts();
    const spinner = globalOpts.json ? null : ora("Fetching reputation data…").start();

    try {
      // Step 1: Fetch reputation
      let criteria = null;
      try {
        const config = await getPaymasterConfig();
        criteria = {
          minBalance: config.minBalance,
          minTxCount: Number(config.minTxCount),
          minWalletAge: Number(config.minWalletAge),
        };
      } catch {
        // defaults
      }

      const rep = await fetchReputation(address, criteria);

      if (!rep.isReputable) {
        spinner?.fail("Wallet does not meet reputation criteria");
        if (!globalOpts.json) {
          printError("Cannot generate proof — wallet is not reputable");
          printInfo("Run 'repute reputation <address>' to see which criteria failed");
        }
        process.exit(1);
      }

      // Step 2: Generate proof
      if (spinner) spinner.text = "Generating ZK proof…";

      let proof;
      if (opts.mock) {
        proof = generateMockProof(rep, rep.criteria);
      } else {
        proof = await generateProof(rep, rep.criteria);
      }

      spinner?.stop();

      if (globalOpts.json) {
        printJSON({
          address,
          reputation: rep,
          proof: {
            nullifierHash: proof.nullifierHash,
            commitmentHash: proof.commitmentHash,
            isMock: proof.isMock,
            publicSignals: proof.publicSignals,
            proof: proof.proof,
          },
        });
        return;
      }

      sectionHeader("ZK Reputation Proof");
      printKeyValue([
        ["Wallet", address],
        ["Nullifier Hash", fmtHash(proof.nullifierHash)],
        ["Commitment Hash", fmtHash(proof.commitmentHash)],
        ["Proof Type", proof.isMock ? chalk.yellow("Mock (demo)") : chalk.green("Real (Groth16)")],
        ["Public Signals", `[${proof.publicSignals.length} elements]`],
      ]);

      if (proof.isMock) {
        printWarning("This is a MOCK proof — it will not verify on-chain");
        printInfo("For real proofs, compile the circuit and place .wasm/.zkey files");
      } else {
        printSuccess("Real Groth16 proof generated successfully");
      }

      // Print proof data for copy-paste
      sectionHeader("Proof Data (for programmatic use)");
      console.log(chalk.dim("  nullifierHash: ") + proof.nullifierHash);
      console.log(chalk.dim("  commitmentHash: ") + proof.commitmentHash);
    } catch (err) {
      spinner?.fail("Proof generation failed");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute activate <address>
// ══════════════════════════════════════════════════════════════

program
  .command("activate <address>")
  .description("Full activation flow: check reputation → generate proof → build & submit UserOp")
  .option("--mock", "Force mock proof (for demo/testing)")
  .option("--bundler <url>", "Bundler RPC endpoint")
  .option("--dry-run", "Build the UserOp but don't submit it")
  .action(async (address, opts, cmd) => {
    const globalOpts = cmd.parent.opts();
    const bundlerUrl = opts.bundler || BUNDLER_URL;
    const spinner = globalOpts.json ? null : ora("Starting activation flow…").start();

    try {
      // Step 1: Check if already activated
      spinner && (spinner.text = "Step 1/4 — Checking current status…");
      const currentStatus = await getWalletStatus(address);

      if (currentStatus.activated) {
        spinner?.succeed("Wallet is already activated");
        if (!globalOpts.json) {
          printKeyValue([
            ["Ops Remaining", currentStatus.opsRemaining.toString()],
            ["Activated At", fmtTimestamp(currentStatus.activatedAt)],
          ]);
        } else {
          printJSON({ status: "already_activated", ...currentStatus });
        }
        return;
      }

      // Step 2: Fetch reputation
      spinner && (spinner.text = "Step 2/4 — Checking wallet reputation…");
      let criteria = null;
      try {
        const config = await getPaymasterConfig();
        criteria = {
          minBalance: config.minBalance,
          minTxCount: Number(config.minTxCount),
          minWalletAge: Number(config.minWalletAge),
        };
      } catch {
        // defaults
      }

      const rep = await fetchReputation(address, criteria);

      if (!rep.isReputable) {
        spinner?.fail("Wallet does not meet reputation criteria");
        if (globalOpts.json) {
          printJSON({ status: "not_reputable", reputation: rep });
        } else {
          printError("Wallet fails reputation check");
          printCheck(`Balance ≥ ${fmtBNB(BigInt(rep.criteria.minBalance))}`, rep.meetsMinBalance);
          printCheck(`Tx Count ≥ ${rep.criteria.minTxCount}`, rep.meetsMinTxCount);
          printCheck(`Wallet Age ≥ ${rep.criteria.minWalletAge} days`, rep.meetsMinAge);
        }
        process.exit(1);
      }

      if (!globalOpts.json) {
        spinner?.succeed("Reputation verified");
      }

      // Step 3: Generate proof
      spinner && (spinner.text = "Step 3/4 — Generating ZK proof…");
      const genSpinner = globalOpts.json ? null : ora("Generating ZK proof…").start();

      let proof;
      if (opts.mock) {
        proof = generateMockProof(rep, rep.criteria);
      } else {
        proof = await generateProof(rep, rep.criteria);
      }

      genSpinner?.succeed(`Proof generated (${proof.isMock ? "mock" : "real"})`);

      // Step 4: Build UserOp
      const buildSpinner = globalOpts.json ? null : ora("Step 4/4 — Building UserOperation…").start();
      const userOp = buildUserOp(address, proof);

      if (opts.dryRun) {
        buildSpinner?.succeed("UserOp built (dry run — not submitted)");

        if (globalOpts.json) {
          printJSON({
            status: "dry_run",
            reputation: rep,
            nullifierHash: proof.nullifierHash,
            commitmentHash: proof.commitmentHash,
            isMockProof: proof.isMock,
            userOp,
          });
        } else {
          sectionHeader("UserOperation (Dry Run)");
          printKeyValue([
            ["Sender", address],
            ["Nullifier", fmtHash(proof.nullifierHash)],
            ["paymasterAndData", `${userOp.paymasterAndData.slice(0, 42)}…`],
            ["Proof Type", proof.isMock ? "Mock" : "Real"],
          ]);
          printInfo("Use --no-dry-run to actually submit to the bundler");
        }
        return;
      }

      // Submit
      buildSpinner && (buildSpinner.text = "Submitting to bundler…");
      const result = await submitUserOp(userOp, bundlerUrl);
      buildSpinner?.succeed("UserOp submitted");

      if (globalOpts.json) {
        printJSON({
          status: "submitted",
          reputation: rep,
          nullifierHash: proof.nullifierHash,
          isMockProof: proof.isMock,
          ...result,
        });
      } else {
        sectionHeader("Activation Result");
        printKeyValue([
          ["UserOp Hash", result.userOpHash],
          ["Tx Hash", result.txHash],
          ["Mock Submission", result.isMock ? chalk.yellow("Yes") : chalk.green("No")],
        ]);

        if (result.isMock) {
          printWarning("This was a mock submission (no bundler configured)");
          printInfo("Set BUNDLER_URL in .env or use --bundler <url> for real submission");
        } else {
          const chain = getChainConfig();
          printSuccess("Wallet activation submitted!");
          console.log(`  ${chalk.dim("Track:")} ${chain.explorer}/tx/${result.txHash}`);
        }
      }
    } catch (err) {
      spinner?.fail("Activation failed");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute encode-proof <address>
// ══════════════════════════════════════════════════════════════

program
  .command("encode-proof <address>")
  .description("Generate proof and output encoded paymasterAndData (for programmatic use)")
  .option("--mock", "Force mock proof")
  .action(async (address, opts, cmd) => {
    const globalOpts = cmd.parent.opts();
    const spinner = globalOpts.json ? null : ora("Generating proof and encoding…").start();

    try {
      let criteria = null;
      try {
        const config = await getPaymasterConfig();
        criteria = {
          minBalance: config.minBalance,
          minTxCount: Number(config.minTxCount),
          minWalletAge: Number(config.minWalletAge),
        };
      } catch {}

      const rep = await fetchReputation(address, criteria);
      let proof;
      if (opts.mock) {
        proof = generateMockProof(rep, rep.criteria);
      } else {
        proof = await generateProof(rep, rep.criteria);
      }

      const paymasterAndData = encodePaymasterData(proof);
      spinner?.stop();

      if (globalOpts.json) {
        printJSON({
          address,
          paymasterAndData,
          nullifierHash: proof.nullifierHash,
          commitmentHash: proof.commitmentHash,
          isMock: proof.isMock,
        });
      } else {
        sectionHeader("Encoded paymasterAndData");
        console.log("");
        console.log(chalk.dim("  (copy this into your UserOperation's paymasterAndData field)"));
        console.log("");
        console.log(`  ${paymasterAndData}`);
        console.log("");
        printKeyValue([
          ["Length", `${(paymasterAndData.length - 2) / 2} bytes`],
          ["Nullifier", fmtHash(proof.nullifierHash)],
          ["Proof Type", proof.isMock ? "Mock" : "Real"],
        ]);
      }
    } catch (err) {
      spinner?.fail("Failed");
      printError(err.message);
      process.exit(1);
    }
  });

// ══════════════════════════════════════════════════════════════
//  repute health
// ══════════════════════════════════════════════════════════════

program
  .command("health")
  .description("Check connectivity to BSC RPC and contract deployment status")
  .action(async (_, cmd) => {
    const globalOpts = cmd.parent.opts();
    const chain = getChainConfig();

    if (!globalOpts.json) {
      sectionHeader(`Health Check (${chain.name})`);
    }

    const results = {};

    // Check RPC
    try {
      const { getClient } = await import("./client.js");
      const client = getClient();
      const blockNumber = await client.getBlockNumber();
      results.rpc = { ok: true, blockNumber: blockNumber.toString() };
      if (!globalOpts.json) {
        printCheck("RPC Connection", true, `block #${blockNumber}`);
      }
    } catch (err) {
      results.rpc = { ok: false, error: err.message };
      if (!globalOpts.json) {
        printCheck("RPC Connection", false, err.message);
      }
    }

    // Check Paymaster
    try {
      const config = await getPaymasterConfig();
      results.paymaster = { ok: true, owner: config.owner };
      if (!globalOpts.json) {
        printCheck("Paymaster Contract", true, fmtAddress(config.owner));
      }
    } catch (err) {
      results.paymaster = { ok: false, error: err.message };
      if (!globalOpts.json) {
        printCheck("Paymaster Contract", false, "not reachable");
      }
    }

    // Check Verifier
    try {
      const { getClient } = await import("./client.js");
      const client = getClient();
      const code = await client.getCode({ address: CONTRACTS.groth16Verifier });
      const deployed = code && code !== "0x";
      results.verifier = { ok: deployed };
      if (!globalOpts.json) {
        printCheck("Groth16Verifier", deployed, deployed ? "deployed" : "no code");
      }
    } catch (err) {
      results.verifier = { ok: false, error: err.message };
      if (!globalOpts.json) {
        printCheck("Groth16Verifier", false, "not reachable");
      }
    }

    // Check Relay
    try {
      const relayInfo = await getRelayInfo();
      const ok = !!relayInfo;
      results.relay = { ok, ...(relayInfo || {}) };
      if (!globalOpts.json) {
        printCheck("RailgunRelay", ok, ok ? `fee: ${Number(relayInfo.feeBps) / 100}%` : "not reachable");
      }
    } catch {
      results.relay = { ok: false };
      if (!globalOpts.json) {
        printCheck("RailgunRelay", false, "not reachable");
      }
    }

    // Bundler
    const hasBundler = !!BUNDLER_URL;
    results.bundler = { configured: hasBundler, url: BUNDLER_URL || null };
    if (!globalOpts.json) {
      printCheck("Bundler URL", hasBundler, hasBundler ? BUNDLER_URL : "not configured (mock mode)");
    }

    if (globalOpts.json) {
      printJSON({ network: chain.name, chainId: chain.id, ...results });
    }
    console.log("");
  });

// ══════════════════════════════════════════════════════════════
//  PARSE & RUN
// ══════════════════════════════════════════════════════════════

program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  printBanner();
  program.outputHelp();
}
