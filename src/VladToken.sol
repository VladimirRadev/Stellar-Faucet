// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title VladToken
/// @author Vladimir Radev
/// @notice "Vladimir" ($VLAD), the ERC-20 token that powers the Stellar personal Web3 suite on Ethereum Sepolia.
/// @dev 18 decimals. The deployer receives DEFAULT_ADMIN_ROLE and the initial supply. Any account that holds
///      MINTER_ROLE (for example the StellarFaucet) can mint new supply. There is no supply cap: this is a
///      testnet token for a portfolio project.
contract VladToken is ERC20, AccessControl {
    /// @notice Role identifier for accounts that are allowed to mint new VLAD.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Deploys the token, makes the deployer the admin and mints `initialSupply` to the deployer.
    /// @param initialSupply Amount in wei units (18 decimals) minted to `msg.sender`.
    constructor(uint256 initialSupply) ERC20("Vladimir", "VLAD") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mints `amount` VLAD to `to`.
    /// @dev Reverts with AccessControlUnauthorizedAccount if the caller does not hold MINTER_ROLE.
    /// @param to Recipient of the newly minted tokens.
    /// @param amount Amount in wei units (18 decimals).
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
