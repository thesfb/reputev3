// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title MockEntryPoint
/// @notice Minimal mock of ERC-4337 EntryPoint for local testing
contract MockEntryPoint is IEntryPoint, IERC165 {

    mapping(address => uint256) internal _deposits;
    mapping(address => uint112) internal _stakes;
    mapping(address => uint32) internal _unstakeDelay;
    mapping(address => bool) internal _staked;

    // ---- IStakeManager ----

    function depositTo(address account) external payable override {
        _deposits[account] += msg.value;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _deposits[account];
    }

    function addStake(uint32 unstakeDelaySec) external payable override {
        _stakes[msg.sender] = uint112(msg.value);
        _unstakeDelay[msg.sender] = unstakeDelaySec;
        _staked[msg.sender] = true;
    }

    function unlockStake() external override {}

    function withdrawStake(address payable withdrawAddress) external override {
        uint256 amount = _stakes[msg.sender];
        _stakes[msg.sender] = 0;
        _staked[msg.sender] = false;
        withdrawAddress.transfer(amount);
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external override {
        require(_deposits[msg.sender] >= withdrawAmount, "Insufficient deposit");
        _deposits[msg.sender] -= withdrawAmount;
        withdrawAddress.transfer(withdrawAmount);
    }

    function getDepositInfo(address account) external view override returns (DepositInfo memory info) {
        info.deposit = _deposits[account];
        info.staked = _staked[account];
        info.stake = _stakes[account];
        info.unstakeDelaySec = _unstakeDelay[account];
        info.withdrawTime = 0;
    }

    // ---- IEntryPoint (stubs) ----

    function handleOps(PackedUserOperation[] calldata, address payable) external override {}

    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata,
        address payable
    ) external override {}

    function getUserOpHash(PackedUserOperation calldata userOp) external view override returns (bytes32) {
        return keccak256(abi.encode(userOp.sender, userOp.nonce));
    }

    function getSenderAddress(bytes memory) external pure override {
        revert SenderAddressResult(address(0));
    }

    function delegateAndRevert(address, bytes calldata) external pure override {
        revert DelegateAndRevert(false, "");
    }

    function getNonce(address, uint192) external pure override returns (uint256) {
        return 0;
    }

    function incrementNonce(uint192) external override {}

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IEntryPoint).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }

    receive() external payable {}
}
