// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IVladToken} from "./interfaces/IVladToken.sol";

/// @title StellarFaucet
/// @author Vladimir Radev
/// @notice Mints a fixed amount of VLAD to any caller, at most once per cooldown period.
/// @dev The faucet must hold VladToken.MINTER_ROLE. Setting dripAmount to 0 pauses the faucet.
contract StellarFaucet is Ownable {
    /// @notice The VLAD token this faucet mints.
    IVladToken public immutable vlad;
    /// @notice Amount of VLAD (18 decimals) minted per claim. Zero means the faucet is paused.
    uint256 public dripAmount;
    /// @notice Minimum number of seconds between two claims by the same address.
    uint256 public cooldown;
    /// @notice Timestamp of the last successful claim per address (0 = never claimed).
    mapping(address => uint256) public lastClaimAt;

    /// @notice Emitted on every successful claim.
    event Claimed(address indexed to, uint256 amount, uint256 nextClaimAt);
    /// @notice Emitted when the owner changes the drip amount or the cooldown (and once at deployment).
    event ConfigUpdated(uint256 dripAmount, uint256 cooldown);

    /// @notice The caller claimed less than `cooldown` seconds ago; retry at `nextClaimAt`.
    error CooldownActive(uint256 nextClaimAt);
    /// @notice The drip amount is zero, so claims are disabled.
    error FaucetPaused();

    /// @param vlad_ The VLAD token. The faucet must be granted its MINTER_ROLE after deployment.
    /// @param dripAmount_ Amount minted per claim (18 decimals).
    /// @param cooldown_ Seconds between two claims by the same address.
    constructor(IVladToken vlad_, uint256 dripAmount_, uint256 cooldown_) Ownable(msg.sender) {
        vlad = vlad_;
        dripAmount = dripAmount_;
        cooldown = cooldown_;
        emit ConfigUpdated(dripAmount_, cooldown_);
    }

    /// @notice Mints `dripAmount` VLAD to the caller if the caller's cooldown has passed.
    function claim() external {
        uint256 amount = dripAmount;
        if (amount == 0) revert FaucetPaused();
        uint256 next = nextClaimAt(msg.sender);
        // A 6-hour cooldown is not sensitive to a few seconds of validator timestamp drift.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < next) revert CooldownActive(next);

        lastClaimAt[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, amount, block.timestamp + cooldown);

        vlad.mint(msg.sender, amount);
    }

    /// @notice Earliest timestamp at which `account` can claim again (0 = can claim now, never claimed).
    function nextClaimAt(address account) public view returns (uint256) {
        uint256 last = lastClaimAt[account];
        return last == 0 ? 0 : last + cooldown;
    }

    /// @notice Updates the drip amount and the cooldown. A drip amount of 0 pauses the faucet.
    function setConfig(uint256 dripAmount_, uint256 cooldown_) external onlyOwner {
        dripAmount = dripAmount_;
        cooldown = cooldown_;
        emit ConfigUpdated(dripAmount_, cooldown_);
    }
}
