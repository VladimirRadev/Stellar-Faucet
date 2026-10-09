# Stellar Faucet — $VLAD token + faucet (Sepolia)

Stellar Faucet is the entry point of **Stellar**, a personal Web3 portfolio suite on Ethereum Sepolia.
It ships the **Vladimir ($VLAD)** ERC-20 token, a rate-limited faucet that mints 100 VLAD per address
every 6 hours, and a React + wagmi dApp to claim it. The other four Stellar apps all run on this same
token, and they reuse the frontend scaffold in [`web/`](web/) (see [`web/SCAFFOLD.md`](web/SCAFFOLD.md)).

**Live app:** https://vladimirradev.github.io/Stellar-Faucet/

> Stellar is a personal portfolio brand, unrelated to the Stellar (XLM) network.
> Everything here runs on the Sepolia testnet; the tokens have no monetary value.

## Architecture

### Contracts (`src/`)

| Contract | What it does |
|---|---|
| [`VladToken`](src/VladToken.sol) | OpenZeppelin `ERC20("Vladimir", "VLAD")` with 18 decimals + `AccessControl`. The deployer gets `DEFAULT_ADMIN_ROLE` and the initial supply of 1,000,000 VLAD. Any account holding `MINTER_ROLE` can call `mint(to, amount)`. |
| [`StellarFaucet`](src/StellarFaucet.sol) | `Ownable`. `claim()` mints `dripAmount` (100 VLAD) to the caller, at most once per `cooldown` (6 hours) per address. Custom errors `CooldownActive(nextClaimAt)` and `FaucetPaused()`. The owner can change both values with `setConfig(drip, cooldown)`; a drip of 0 pauses the faucet. |
| [`IVladToken`](src/interfaces/IVladToken.sol) | The shared interface (`IERC20` + `mint`, `MINTER_ROLE`, `grantRole`, `hasRole`) that the other Stellar repos copy. |

### Roles

| Role | Holder | Power |
|---|---|---|
| `VladToken.DEFAULT_ADMIN_ROLE` | deployer | grants and revokes `MINTER_ROLE` |
| `VladToken.MINTER_ROLE` | `StellarFaucet` (granted in the deploy script) | mints new VLAD |
| `StellarFaucet.owner` | deployer | changes drip amount and cooldown, pauses the faucet |

### Token flow across the suite

1. **[Faucet](https://vladimirradev.github.io/Stellar-Faucet/)**: claim free VLAD.
2. **[Swap & LP Staking](https://vladimirradev.github.io/Stellar-LP-Staking/)**: swap VLAD, provide liquidity, stake LP tokens for rewards.
3. **[Bank](https://vladimirradev.github.io/Stellar-Bank/)**: deposit VLAD and earn interest.
4. **[Store](https://vladimirradev.github.io/Stellar-Store/)**: spend VLAD on on-chain items.
5. **[Arena](https://vladimirradev.github.io/Stellar-Arena/)**: use VLAD in on-chain games.

### Frontend (`web/`)

Vite + React 19 + TypeScript + Tailwind CSS 4 + wagmi 3 + viem. Wallet connection through the injected
connector only (MetaMask). Reads go through public, key-less RPCs (publicnode primary, Tenderly gateway
fallback) with Multicall3 batching. `web/src/shell/` is the shared scaffold (navigation, wallet, network
gate, transaction button with custom-error decoding, design tokens); `web/src/app/` is the faucet page.

## Deployed addresses (Sepolia, chain id 11155111)

| Contract | Address | Deploy tx |
|---|---|---|
| VladToken ($VLAD) | [`0x49ba857d553ef219B144b200F41acaf8CB6768E9`](https://eth-sepolia.blockscout.com/address/0x49ba857d553ef219B144b200F41acaf8CB6768E9) | [`0x3b24505f…f9f5d3`](https://eth-sepolia.blockscout.com/tx/0x3b24505f6310f9ee43a43465e923814519b6e66197674b612910591aa0f9f5d3) |
| StellarFaucet | [`0x20f7b01E1c017B629a9448A05F8B7D726917C3AB`](https://eth-sepolia.blockscout.com/address/0x20f7b01E1c017B629a9448A05F8B7D726917C3AB) | [`0x4ba3dc49…fff789`](https://eth-sepolia.blockscout.com/tx/0x4ba3dc4998558a51d52c665d92c09bf4380eb27f05c749f78195f979c1fff789) |

`MINTER_ROLE` was granted to the faucet in tx [`0xabd349a3…c955f`](https://eth-sepolia.blockscout.com/tx/0xabd349a32b1e444f06f9084135bf04d741ae0ff1d7222cf82fd3a843f43c955f).
Both contracts are verified on Sourcify and Blockscout. Full details (blocks, gas, verification) are in
[`deployments/sepolia.json`](deployments/sepolia.json).

## Run locally

Requirements: [Foundry](https://book.getfoundry.sh/) (1.7.1) and Node.js 22.12 or newer.

```sh
git clone --recurse-submodules https://github.com/VladimirRadev/Stellar-Faucet.git
cd Stellar-Faucet

# Contracts
forge build
forge test -vv          # 8 tests

# Web app
cd web
npm ci
npm run dev             # http://localhost:5173/Stellar-Faucet/
npm run build           # type-check + production build into web/dist
npm run sync-abi        # refresh src/abi/*.ts from ../out after `forge build`
```

## Deploy

The deploy script sends exactly three transactions: deploy `VladToken(1_000_000e18)`, deploy
`StellarFaucet(token, 100e18, 6 hours)`, and `grantRole(MINTER_ROLE, faucet)`.
The key is read from the `PRIVATE_KEY` environment variable; no key is ever stored in this repo.

```sh
# PRIVATE_KEY lives in an env file outside the repo (.env* is git-ignored anyway)
set -a; source /path/to/deployer.env; set +a
forge script script/Deploy.s.sol \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --broadcast --slow --skip-simulation -vvv
```

Always deploy with `--skip-simulation`. Sepolia's current fork prices contract creation far above what
forge's local simulation charges: forge simulates with the Cancun gas rules from `foundry.toml`, which
estimated 798,410 gas for the `VladToken` creation, while Sepolia actually charged 5,153,554 gas. Without
the flag, forge sets each gas limit to the local estimate × 1.3, so the first deployment attempt ran out of
gas and failed (tx `0xe750aa1c…76ec89`). With `--skip-simulation` (together with `--slow`), forge asks the
Sepolia node for a gas estimate right before it sends each transaction. If the deployer account has an
EIP-7702 delegation, the node accepts only one unconfirmed transaction at a time; if a send is rejected
with "in-flight transaction limit reached", wait for the previous transaction to confirm and rerun the same
command with `--resume`, which sends only the transactions that are still missing.

Verify without an Etherscan key, through Sourcify or Blockscout:

```sh
forge verify-contract <token> src/VladToken.sol:VladToken --chain 11155111 --verifier sourcify \
  --constructor-args $(cast abi-encode "constructor(uint256)" 1000000000000000000000000)
forge verify-contract <token> src/VladToken.sol:VladToken --chain 11155111 \
  --verifier blockscout --verifier-url https://eth-sepolia.blockscout.com/api/ \
  --constructor-args $(cast abi-encode "constructor(uint256)" 1000000000000000000000000)
```

Then put the addresses in `web/src/config/addresses.ts` and push: GitHub Actions rebuilds the site.

## Security notes

- Testnet only. VLAD has no supply cap: whoever holds `MINTER_ROLE` can mint without limit. Today that is only the faucet.
- The faucet limits each address, not each person: anyone can claim again from a fresh address. That is acceptable for a testnet token.
- `claim()` follows checks-effects-interactions: it records `lastClaimAt` and emits `Claimed` before it calls the token.
- The cooldown compares against `block.timestamp`. A validator can shift that by a few seconds, which does not matter against a 6-hour window.
- The admin and the owner are a single externally owned account (EOA). A production setup would use a multisig and a timelock instead.
- The frontend has no backend and no API keys. It only talks to public RPC endpoints and the user's wallet.

## Smoke tests (2026-10-09)

End-to-end run on Ethereum Sepolia on 2026-10-09 from the deployer `0xEb0243ea72CB24eFb7128Ee7aca314C080b600c4` (an EIP-7702 delegated EOA), with `smoke.sh` (19 steps across the whole suite, one transaction at a time, each waiting for its receipt). After every transaction the script compared balances, reserves and events at the transaction's block with the block before it; "ok" means every such assertion passed. Step numbers are the suite-wide order. Rows for this repo:

| Step | Function | Result | Tx (Blockscout) | Gas used |
|---|---|---|---|---|
| 1 | `faucet.claim()` | ok | [`0x57d9c446…4fca37`](https://eth-sepolia.blockscout.com/tx/0x57d9c446277913ca11ed71394fffe2e1a11d78551358830fd2f8828fbe4fca37) | 164472 |
| 19 | `faucet.claim() eth_call` | reverted CooldownActive (expected) | no tx | — |

- Step 1 faucet: +100 VLAD (balance 997000 -> 997100); next claim allowed at 2026-10-09 14:03:12 UTC
- Step 19 cooldown: eth_call faucet.claim() reverts CooldownActive(1791554592) = next claim at 2026-10-09 14:03:12 UTC; no tx sent

## Part of the Stellar suite

| App | Live site | Repository |
|---|---|---|
| Faucet ($VLAD token) | https://vladimirradev.github.io/Stellar-Faucet/ | https://github.com/VladimirRadev/Stellar-Faucet |
| Swap & LP Staking | https://vladimirradev.github.io/Stellar-LP-Staking/ | https://github.com/VladimirRadev/Stellar-LP-Staking |
| Bank | https://vladimirradev.github.io/Stellar-Bank/ | https://github.com/VladimirRadev/Stellar-Bank |
| Store | https://vladimirradev.github.io/Stellar-Store/ | https://github.com/VladimirRadev/Stellar-Store |
| Arena | https://vladimirradev.github.io/Stellar-Arena/ | https://github.com/VladimirRadev/Stellar-Arena |

Stellar is a personal portfolio brand, unrelated to the Stellar (XLM) network.

Built by [Vladimir Radev](https://github.com/VladimirRadev).
