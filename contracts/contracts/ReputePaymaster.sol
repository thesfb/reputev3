// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "./Groth16Verifier.sol";

/// @title ReputePaymaster
/// @notice ERC-4337 Paymaster that sponsors gas for wallets that prove legitimate reputation
///         via a Groth16 ZK proof. Nullifiers prevent double-spend.
/// @dev Flow:
///   1. User generates a ZK proof off-chain (proves wallet reputation without revealing address)
///   2. User submits a UserOperation with proof data in paymasterAndData
///   3. This Paymaster verifies the proof on-chain via Groth16Verifier
///   4. If valid and nullifier unused, Paymaster sponsors gas for up to MAX_SPONSORED_OPS operations
contract ReputePaymaster is BasePaymaster {

    // ============ State ============

    /// @notice The Groth16 verifier contract
    Groth16Verifier public immutable verifier;

    /// @notice Maximum number of sponsored operations per nullifier
    uint256 public maxSponsoredOps;

    /// @notice Reputation criteria thresholds
    uint256 public minBalance;     // Minimum BNB balance in wei
    uint256 public minTxCount;     // Minimum transaction count
    uint256 public minWalletAge;   // Minimum wallet age in days

    /// @notice Tracks used nullifiers and their remaining sponsored ops
    mapping(uint256 => NullifierState) public nullifiers;

    /// @notice Maps activated wallets to their nullifier (for lookup)
    mapping(address => uint256) public walletNullifier;

    struct NullifierState {
        bool used;
        address activatedWallet;
        uint256 opsRemaining;
        uint256 activatedAt;
    }

    // ============ Events ============

    event WalletActivated(
        address indexed wallet,
        uint256 indexed nullifierHash,
        uint256 sponsoredOps,
        uint256 timestamp
    );

    event GasSponsored(
        address indexed wallet,
        uint256 indexed nullifierHash,
        uint256 opsRemaining,
        uint256 actualGasCost
    );

    event CriteriaUpdated(
        uint256 minBalance,
        uint256 minTxCount,
        uint256 minWalletAge,
        uint256 maxSponsoredOps
    );

    // ============ Errors ============

    error NullifierAlreadyUsed(uint256 nullifierHash);
    error InvalidProof();
    error NoSponsoredOpsRemaining();
    error WalletNotActivated(address wallet);
    error InvalidPaymasterData();

    // ============ Constructor ============

    /// @param _entryPoint The ERC-4337 EntryPoint contract
    /// @param _verifier The Groth16 verifier contract
    /// @param _owner The owner of this paymaster
    constructor(
        IEntryPoint _entryPoint,
        Groth16Verifier _verifier,
        address _owner
    ) BasePaymaster(_entryPoint) {
        verifier = _verifier;
        maxSponsoredOps = 10;
        minBalance = 0.01 ether;     // 0.01 BNB
        minTxCount = 5;              // At least 5 transactions
        minWalletAge = 30;           // At least 30 days old
        if (_owner != msg.sender) {
            transferOwnership(_owner);
        }
    }

    // ============ Admin ============

    /// @notice Update reputation criteria
    function setCriteria(
        uint256 _minBalance,
        uint256 _minTxCount,
        uint256 _minWalletAge,
        uint256 _maxSponsoredOps
    ) external onlyOwner {
        minBalance = _minBalance;
        minTxCount = _minTxCount;
        minWalletAge = _minWalletAge;
        maxSponsoredOps = _maxSponsoredOps;
        emit CriteriaUpdated(_minBalance, _minTxCount, _minWalletAge, _maxSponsoredOps);
    }

    // ============ ERC-4337 Paymaster Logic ============

    /// @notice Validates a UserOperation and decides whether to sponsor gas
    /// @dev Called by EntryPoint during validation phase
    /// @param userOp The user operation to validate
    /// @param userOpHash Hash of the user operation
    /// @param maxCost Maximum cost the paymaster would have to pay
    /// @return context Data passed to postOp (nullifierHash + wallet)
    /// @return validationData 0 for success, 1 for failure
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        (userOpHash); // silence unused warning

        // Decode paymasterAndData:
        // [0:20]   = paymaster address (stripped by EntryPoint)
        // [20:52]  = nullifierHash (uint256)
        // [52:84]  = commitmentHash (uint256)
        // [84:148] = proof.a (uint256[2])
        // [148:276] = proof.b (uint256[2][2])
        // [276:340] = proof.c (uint256[2])
        bytes calldata pmData = userOp.paymasterAndData[20:];

        if (pmData.length < 320) {
            revert InvalidPaymasterData();
        }

        uint256 nullifierHash = uint256(bytes32(pmData[0:32]));
        uint256 commitmentHash = uint256(bytes32(pmData[32:64]));

        // Check if this is an activation (first use of nullifier) or a subsequent sponsored op
        NullifierState storage state = nullifiers[nullifierHash];

        if (state.used) {
            // Subsequent operation — check wallet matches and ops remaining
            if (state.activatedWallet != userOp.sender) {
                revert WalletNotActivated(userOp.sender);
            }
            if (state.opsRemaining == 0) {
                revert NoSponsoredOpsRemaining();
            }

            // Decrement remaining ops
            state.opsRemaining--;

            context = abi.encode(nullifierHash, userOp.sender, false);
            return (context, 0); // valid
        }

        // First activation — verify the ZK proof
        uint256[2] memory proofA;
        uint256[2][2] memory proofB;
        uint256[2] memory proofC;

        proofA[0] = uint256(bytes32(pmData[64:96]));
        proofA[1] = uint256(bytes32(pmData[96:128]));

        proofB[0][0] = uint256(bytes32(pmData[128:160]));
        proofB[0][1] = uint256(bytes32(pmData[160:192]));
        proofB[1][0] = uint256(bytes32(pmData[192:224]));
        proofB[1][1] = uint256(bytes32(pmData[224:256]));

        proofC[0] = uint256(bytes32(pmData[256:288]));
        proofC[1] = uint256(bytes32(pmData[288:320]));

        // Construct public signals: [nullifierHash, minBalance, minTxCount, minWalletAge, commitmentHash]
        uint256[5] memory pubSignals;
        pubSignals[0] = nullifierHash;
        pubSignals[1] = minBalance;
        pubSignals[2] = minTxCount;
        pubSignals[3] = minWalletAge;
        pubSignals[4] = commitmentHash;

        // Verify the Groth16 proof
        bool proofValid = verifier.verifyProof(proofA, proofB, proofC, pubSignals);
        if (!proofValid) {
            revert InvalidProof();
        }

        // Mark nullifier as used and activate wallet
        state.used = true;
        state.activatedWallet = userOp.sender;
        state.opsRemaining = maxSponsoredOps - 1; // -1 for this operation
        state.activatedAt = block.timestamp;

        walletNullifier[userOp.sender] = nullifierHash;

        emit WalletActivated(
            userOp.sender,
            nullifierHash,
            maxSponsoredOps,
            block.timestamp
        );

        context = abi.encode(nullifierHash, userOp.sender, true);
        return (context, 0); // valid
    }

    /// @notice Post-operation handler — called after UserOp execution
    /// @dev Used to emit gas tracking events
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        (mode, actualUserOpFeePerGas); // silence unused warnings

        (uint256 nullifierHash, address wallet, bool isActivation) =
            abi.decode(context, (uint256, address, bool));

        NullifierState storage state = nullifiers[nullifierHash];

        emit GasSponsored(
            wallet,
            nullifierHash,
            state.opsRemaining,
            actualGasCost
        );
    }

    // ============ View Functions ============

    /// @notice Check if a wallet has been activated and how many ops remain
    function getWalletStatus(address wallet) external view returns (
        bool activated,
        uint256 opsRemaining,
        uint256 activatedAt
    ) {
        uint256 nh = walletNullifier[wallet];
        if (nh == 0) {
            return (false, 0, 0);
        }
        NullifierState storage state = nullifiers[nh];
        return (state.used, state.opsRemaining, state.activatedAt);
    }

    /// @notice Check if a nullifier has already been used
    function isNullifierUsed(uint256 nullifierHash) external view returns (bool) {
        return nullifiers[nullifierHash].used;
    }
}
