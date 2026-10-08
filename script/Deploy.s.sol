// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {VladToken} from "../src/VladToken.sol";
import {StellarFaucet} from "../src/StellarFaucet.sol";
import {IVladToken} from "../src/interfaces/IVladToken.sol";

/// @notice Deploys VladToken + StellarFaucet and grants the faucet MINTER_ROLE (exactly 3 transactions).
/// @dev Reads the deployer key from the PRIVATE_KEY environment variable. Never hard-code keys.
///      Run with --slow --skip-simulation: the local Cancun simulation underestimates Sepolia creation gas.
contract Deploy is Script {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant DRIP_AMOUNT = 100e18;
    uint256 internal constant COOLDOWN = 6 hours;

    function run() external returns (VladToken token, StellarFaucet faucet) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        token = new VladToken(INITIAL_SUPPLY); // tx 1
        faucet = new StellarFaucet(IVladToken(address(token)), DRIP_AMOUNT, COOLDOWN); // tx 2
        token.grantRole(token.MINTER_ROLE(), address(faucet)); // tx 3
        vm.stopBroadcast();

        console.log("Deployer      :", vm.addr(deployerKey));
        console.log("VladToken     :", address(token));
        console.log("StellarFaucet :", address(faucet));
    }
}
