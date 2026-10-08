// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IVladToken
/// @author Vladimir Radev
/// @notice Interface of the "Vladimir" ($VLAD) ERC-20 token used across the Stellar suite.
/// @dev Shared file: the other Stellar repos copy it unchanged to talk to the deployed VladToken.
interface IVladToken is IERC20 {
    /// @notice Role identifier that allows an account to mint new VLAD.
    function MINTER_ROLE() external view returns (bytes32);

    /// @notice Mints `amount` VLAD (18 decimals) to `to`. Caller must hold MINTER_ROLE.
    function mint(address to, uint256 amount) external;

    /// @notice Grants `role` to `account`. Caller must hold the role's admin role.
    function grantRole(bytes32 role, address account) external;

    /// @notice Returns true if `account` holds `role`.
    function hasRole(bytes32 role, address account) external view returns (bool);
}
