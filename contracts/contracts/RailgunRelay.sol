// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title RailgunRelay
/// @notice Adapter between Railgun's shielded pool and the ReputePaymaster.
///
///  Architecture:
///    User (Wallet A) → Railgun Shield → Private Transfer → Unshield → RailgunRelay → Paymaster
///
///  The relay receives funds from Railgun's Relay Adapt contract (unshield destination).
///  On-chain, the Paymaster receives funds from this relay — NOT from Wallet A.
///  No analyst can trace the payment back to Wallet A because Railgun's
///  encrypted UTXO pool breaks the link completely.
///
/// @dev Supports both native BNB and ERC-20 tokens (USDT, USDC, etc.).
///      A convenience fee (default 5%) is taken for protocol revenue.
contract RailgunRelay is Ownable {
    using SafeERC20 for IERC20;

    // ============ State ============

    /// @notice The Paymaster that receives forwarded funds
    address public paymaster;

    /// @notice Railgun's Relay Adapt contract address on this chain
    address public railgunRelayAdapt;

    /// @notice Tokens accepted for shielded payment
    mapping(address => bool) public acceptedTokens;

    /// @notice Minimum deposit amounts per token (prevents dust attacks)
    mapping(address => uint256) public minDeposit;

    /// @notice Track total received per token for accounting
    mapping(address => uint256) public totalReceived;

    /// @notice Total native BNB received
    uint256 public totalNativeReceived;

    /// @notice Convenience fee in basis points (e.g., 500 = 5%)
    uint256 public feeBps;

    /// @notice Maximum fee cap (10%)
    uint256 public constant MAX_FEE_BPS = 1000;

    /// @notice Protocol treasury that receives fees
    address public feeRecipient;

    /// @notice Minimum native BNB forward amount
    uint256 public minNativeDeposit;

    // ============ Events ============

    event ShieldedPaymentReceived(
        address indexed token,
        uint256 amount,
        uint256 fee,
        uint256 netToPaymaster
    );

    event NativePaymentReceived(
        uint256 amount,
        uint256 fee,
        uint256 netToPaymaster
    );

    event PaymasterUpdated(address indexed oldPaymaster, address indexed newPaymaster);
    event RailgunRelayAdaptUpdated(address indexed oldAdapt, address indexed newAdapt);
    event TokenConfigured(address indexed token, uint256 minDeposit, bool accepted);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event NativeReceived(address indexed sender, uint256 amount);

    // ============ Errors ============

    error TokenNotAccepted();
    error BelowMinimumDeposit();
    error ZeroAddress();
    error FeeTooHigh();
    error TransferFailed();
    error NothingToForward();

    // ============ Constructor ============

    /// @param _paymaster The ReputePaymaster contract address
    /// @param _railgunRelayAdapt Railgun's Relay Adapt contract on BSC
    /// @param _feeRecipient Protocol treasury address for fee collection
    constructor(
        address _paymaster,
        address _railgunRelayAdapt,
        address _feeRecipient
    ) Ownable(msg.sender) {
        if (_paymaster == address(0) || _feeRecipient == address(0)) revert ZeroAddress();
        paymaster = _paymaster;
        railgunRelayAdapt = _railgunRelayAdapt;
        feeRecipient = _feeRecipient;
        feeBps = 500; // 5% default
        minNativeDeposit = 0.001 ether; // 0.001 BNB minimum
    }

    // ============================================================
    //                   CORE: FORWARD SHIELDED FUNDS
    // ============================================================

    /// @notice Forward ERC-20 tokens received from Railgun unshield to the Paymaster.
    ///
    ///  After Railgun's Relay Adapt unshields tokens to this contract,
    ///  anyone can call this function to flush the balance to the Paymaster.
    ///  The on-chain trace shows: RelayAdapt → RailgunRelay → Paymaster.
    ///  Wallet A is nowhere in this chain.
    ///
    /// @param token The ERC-20 token address to forward
    function forwardToPaymaster(address token) external {
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < minDeposit[token]) revert BelowMinimumDeposit();

        // Calculate fee
        uint256 fee = (balance * feeBps) / 10000;
        uint256 net = balance - fee;

        // Send fee to protocol treasury
        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        // Forward remainder to Paymaster
        IERC20(token).safeTransfer(paymaster, net);

        totalReceived[token] += balance;

        emit ShieldedPaymentReceived(token, balance, fee, net);
    }

    /// @notice Forward native BNB received via Railgun unshield to the Paymaster.
    ///
    ///  The Paymaster needs native BNB for gas sponsorship deposits
    ///  in the EntryPoint. This function forwards accumulated BNB
    ///  minus the convenience fee.
    function forwardNativeToPaymaster() external {
        uint256 balance = address(this).balance;
        if (balance < minNativeDeposit) revert BelowMinimumDeposit();

        uint256 fee = (balance * feeBps) / 10000;
        uint256 net = balance - fee;

        if (fee > 0) {
            (bool feeOk, ) = feeRecipient.call{value: fee}("");
            if (!feeOk) revert TransferFailed();
        }

        (bool ok, ) = paymaster.call{value: net}("");
        if (!ok) revert TransferFailed();

        totalNativeReceived += balance;

        emit NativePaymentReceived(balance, fee, net);
    }

    // ============================================================
    //                   VIEW FUNCTIONS
    // ============================================================

    /// @notice Get the current ERC-20 balance available to forward
    function pendingTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Get the current native BNB balance available to forward
    function pendingNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Calculate the net amount (after fee) for a given deposit
    function calculateNet(uint256 amount) external view returns (uint256 net, uint256 fee) {
        fee = (amount * feeBps) / 10000;
        net = amount - fee;
    }

    // ============================================================
    //                   ADMIN FUNCTIONS
    // ============================================================

    /// @notice Configure an accepted token and its minimum deposit
    function configureToken(
        address token,
        uint256 _minDeposit,
        bool accepted
    ) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        acceptedTokens[token] = accepted;
        minDeposit[token] = _minDeposit;
        emit TokenConfigured(token, _minDeposit, accepted);
    }

    /// @notice Update the Paymaster address
    function setPaymaster(address _paymaster) external onlyOwner {
        if (_paymaster == address(0)) revert ZeroAddress();
        address old = paymaster;
        paymaster = _paymaster;
        emit PaymasterUpdated(old, _paymaster);
    }

    /// @notice Update the Railgun Relay Adapt address
    function setRailgunRelayAdapt(address _adapt) external onlyOwner {
        address old = railgunRelayAdapt;
        railgunRelayAdapt = _adapt;
        emit RailgunRelayAdaptUpdated(old, _adapt);
    }

    /// @notice Update the convenience fee (capped at MAX_FEE_BPS)
    function setFee(uint256 _feeBps) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        uint256 old = feeBps;
        feeBps = _feeBps;
        emit FeeUpdated(old, _feeBps);
    }

    /// @notice Update the fee recipient address
    function setFeeRecipient(address _recipient) external onlyOwner {
        if (_recipient == address(0)) revert ZeroAddress();
        address old = feeRecipient;
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(old, _recipient);
    }

    /// @notice Update the minimum native BNB deposit
    function setMinNativeDeposit(uint256 _min) external onlyOwner {
        minNativeDeposit = _min;
    }

    /// @notice Emergency: withdraw stuck ERC-20 tokens
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Emergency: withdraw stuck native BNB
    function rescueNative(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // Accept native BNB (from Railgun unshield or direct deposit)
    receive() external payable {
        emit NativeReceived(msg.sender, msg.value);
    }
}
