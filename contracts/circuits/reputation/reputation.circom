// Repute Reputation Circuit
// Proves: "A wallet meets reputation criteria" without revealing which wallet.
//
// Private inputs:
//   - walletAddress: the user's old wallet address (kept secret)
//   - secret: a random secret used to derive the nullifier
//   - bnbBalance: wallet's BNB balance in wei (fetched off-chain, committed)
//   - txCount: number of transactions from this wallet
//   - walletAge: age of wallet in days (from first tx)
//
// Public inputs:
//   - nullifierHash: Poseidon(secret, walletAddress) — prevents double-spend
//   - minBalance: minimum BNB balance required (in wei)
//   - minTxCount: minimum transaction count required
//   - minWalletAge: minimum wallet age in days
//   - commitmentHash: Poseidon(walletAddress, bnbBalance, txCount, walletAge) — commitment to reputation data
//
// The circuit verifies:
//   1. nullifierHash == Poseidon(secret, walletAddress)
//   2. commitmentHash == Poseidon(walletAddress, bnbBalance, txCount, walletAge)
//   3. bnbBalance >= minBalance
//   4. txCount >= minTxCount
//   5. walletAge >= minWalletAge

pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template ReputationProof() {
    // Private inputs
    signal input walletAddress;
    signal input secret;
    signal input bnbBalance;
    signal input txCount;
    signal input walletAge;

    // Public inputs
    signal input nullifierHash;
    signal input minBalance;
    signal input minTxCount;
    signal input minWalletAge;
    signal input commitmentHash;

    // Public output — 1 if valid, constrained to be 1
    signal output valid;

    // --- 1. Verify nullifier ---
    // nullifierHash must equal Poseidon(secret, walletAddress)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== walletAddress;
    nullifierHash === nullifierHasher.out;

    // --- 2. Verify commitment ---
    // commitmentHash must equal Poseidon(walletAddress, bnbBalance, txCount, walletAge)
    component commitmentHasher = Poseidon(4);
    commitmentHasher.inputs[0] <== walletAddress;
    commitmentHasher.inputs[1] <== bnbBalance;
    commitmentHasher.inputs[2] <== txCount;
    commitmentHasher.inputs[3] <== walletAge;
    commitmentHash === commitmentHasher.out;

    // --- 3. Balance check: bnbBalance >= minBalance ---
    component balanceCheck = GreaterEqThan(252);
    balanceCheck.in[0] <== bnbBalance;
    balanceCheck.in[1] <== minBalance;
    balanceCheck.out === 1;

    // --- 4. Transaction count check: txCount >= minTxCount ---
    component txCheck = GreaterEqThan(64);
    txCheck.in[0] <== txCount;
    txCheck.in[1] <== minTxCount;
    txCheck.out === 1;

    // --- 5. Wallet age check: walletAge >= minWalletAge ---
    component ageCheck = GreaterEqThan(64);
    ageCheck.in[0] <== walletAge;
    ageCheck.in[1] <== minWalletAge;
    ageCheck.out === 1;

    // All checks passed
    valid <== 1;
}

component main {public [nullifierHash, minBalance, minTxCount, minWalletAge, commitmentHash]} = ReputationProof();
