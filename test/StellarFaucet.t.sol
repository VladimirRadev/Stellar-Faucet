// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {VladToken} from "../src/VladToken.sol";
import {StellarFaucet} from "../src/StellarFaucet.sol";
import {IVladToken} from "../src/interfaces/IVladToken.sol";

contract StellarFaucetTest is Test {
    uint256 internal constant DRIP = 100e18;
    uint256 internal constant COOLDOWN = 6 hours;

    VladToken internal token;
    StellarFaucet internal faucet;
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");

    event Claimed(address indexed to, uint256 amount, uint256 nextClaimAt);

    function setUp() public {
        vm.warp(1_760_000_000); // realistic timestamp, not 1
        vm.startPrank(owner);
        token = new VladToken(1_000_000e18);
        faucet = new StellarFaucet(IVladToken(address(token)), DRIP, COOLDOWN);
        token.grantRole(token.MINTER_ROLE(), address(faucet));
        vm.stopPrank();
    }

    function test_ClaimMintsDripSetsNextClaimAtAndEmits() public {
        assertEq(faucet.nextClaimAt(alice), 0);
        uint256 expectedNext = block.timestamp + COOLDOWN;

        vm.expectEmit(true, false, false, true, address(faucet));
        emit Claimed(alice, DRIP, expectedNext);
        vm.prank(alice);
        faucet.claim();

        assertEq(token.balanceOf(alice), DRIP);
        assertEq(faucet.lastClaimAt(alice), block.timestamp);
        assertEq(faucet.nextClaimAt(alice), expectedNext);
    }

    function test_RevertWhen_SecondClaimDuringCooldown() public {
        vm.startPrank(alice);
        faucet.claim();
        uint256 next = faucet.nextClaimAt(alice);
        vm.warp(next - 1);
        vm.expectRevert(abi.encodeWithSelector(StellarFaucet.CooldownActive.selector, next));
        faucet.claim();
        vm.stopPrank();
    }

    function test_ClaimAfterCooldownSucceeds() public {
        vm.startPrank(alice);
        faucet.claim();
        vm.warp(block.timestamp + COOLDOWN);
        faucet.claim();
        vm.stopPrank();

        assertEq(token.balanceOf(alice), 2 * DRIP);
        assertEq(faucet.nextClaimAt(alice), block.timestamp + COOLDOWN);
    }

    function test_SetConfigOnlyOwnerAndZeroDripPauses() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        faucet.setConfig(0, 1 hours);

        vm.prank(owner);
        faucet.setConfig(0, 1 hours);
        assertEq(faucet.dripAmount(), 0);
        assertEq(faucet.cooldown(), 1 hours);

        vm.expectRevert(StellarFaucet.FaucetPaused.selector);
        vm.prank(alice);
        faucet.claim();
    }

    function test_RevertWhen_FaucetLacksMinterRole() public {
        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(owner);
        token.revokeRole(minterRole, address(faucet));

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, address(faucet), minterRole
            )
        );
        vm.prank(alice);
        faucet.claim();
        assertEq(faucet.lastClaimAt(alice), 0);
    }
}
