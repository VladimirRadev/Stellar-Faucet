// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {VladToken} from "../src/VladToken.sol";

contract VladTokenTest is Test {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;

    VladToken internal token;
    address internal admin = makeAddr("admin");
    address internal minter = makeAddr("minter");
    address internal alice = makeAddr("alice");

    function setUp() public {
        vm.prank(admin);
        token = new VladToken(INITIAL_SUPPLY);
    }

    function test_InitialSupplyAndAdminRole() public view {
        assertEq(token.name(), "Vladimir");
        assertEq(token.symbol(), "VLAD");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(admin), INITIAL_SUPPLY);
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertFalse(token.hasRole(token.MINTER_ROLE(), admin));
    }

    function test_MintByMinterSucceeds() public {
        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(admin);
        token.grantRole(minterRole, minter);

        vm.prank(minter);
        token.mint(alice, 42e18);

        assertEq(token.balanceOf(alice), 42e18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + 42e18);
    }

    function test_RevertWhen_MintByNonMinter() public {
        bytes32 minterRole = token.MINTER_ROLE();
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, minterRole)
        );
        vm.prank(alice);
        token.mint(alice, 1e18);
    }
}
