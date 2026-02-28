// Repute CLI — Display utilities
// Formatting, colors, and output helpers

import chalk from "chalk";

// ══════════════════════════════════════════════════════════════
//  BRANDING
// ══════════════════════════════════════════════════════════════

export function printBanner() {
  console.log("");
  console.log(chalk.bold.yellow("  ╔══════════════════════════════════════╗"));
  console.log(chalk.bold.yellow("  ║") + chalk.bold.white("     ⚡ REPUTE CLI — BNB Chain ⚡     ") + chalk.bold.yellow("║"));
  console.log(chalk.bold.yellow("  ║") + chalk.dim("  Identity-Gated Gas Relayer (ZK)     ") + chalk.bold.yellow("║"));
  console.log(chalk.bold.yellow("  ╚══════════════════════════════════════╝"));
  console.log("");
}

// ══════════════════════════════════════════════════════════════
//  TABLE / KEY-VALUE OUTPUT
// ══════════════════════════════════════════════════════════════

/**
 * Print a labeled section header
 */
export function sectionHeader(title) {
  console.log("");
  console.log(chalk.bold.cyan(`━━━ ${title} ━━━`));
}

/**
 * Print key-value pairs as an aligned table
 */
export function printKeyValue(pairs, indent = 2) {
  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length));
  const pad = " ".repeat(indent);
  for (const [key, value, color] of pairs) {
    const paddedKey = key.padEnd(maxKeyLen);
    const colorFn = color ? chalk[color] || chalk.white : chalk.white;
    console.log(`${pad}${chalk.dim(paddedKey)}  ${colorFn(value)}`);
  }
}

/**
 * Print a pass/fail check line
 */
export function printCheck(label, passed, detail = "") {
  const icon = passed ? chalk.green("✓") : chalk.red("✗");
  const text = passed ? chalk.green(label) : chalk.red(label);
  const extra = detail ? chalk.dim(` (${detail})`) : "";
  console.log(`  ${icon} ${text}${extra}`);
}

/**
 * Print a success message
 */
export function printSuccess(msg) {
  console.log(chalk.green(`\n  ✓ ${msg}`));
}

/**
 * Print an error message
 */
export function printError(msg) {
  console.log(chalk.red(`\n  ✗ ${msg}`));
}

/**
 * Print a warning message
 */
export function printWarning(msg) {
  console.log(chalk.yellow(`\n  ⚠ ${msg}`));
}

/**
 * Print an info message
 */
export function printInfo(msg) {
  console.log(chalk.dim(`  ℹ ${msg}`));
}

/**
 * Format address for display (truncated)
 */
export function fmtAddress(address) {
  if (!address || address.length < 10) return address || "N/A";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Format a large number with commas
 */
export function fmtNumber(n) {
  return Number(n).toLocaleString();
}

/**
 * Format a timestamp to readable date
 */
export function fmtTimestamp(ts) {
  if (!ts || ts === 0n) return "N/A";
  return new Date(Number(ts) * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

/**
 * Format BNB value from wei
 */
export function fmtBNB(wei) {
  const bnb = Number(wei) / 1e18;
  return `${bnb.toFixed(6)} BNB`;
}

/**
 * Format a hash (truncated)
 */
export function fmtHash(hash) {
  if (!hash) return "N/A";
  const s = hash.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 10)}…${s.slice(-8)}`;
}

/**
 * Print JSON output (for --json flag / AI agent consumption)
 */
export function printJSON(data) {
  console.log(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
}
