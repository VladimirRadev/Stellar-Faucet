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

| Contract | Address |
|---|---|
| VladToken ($VLAD) | not deployed yet |
| StellarFaucet | not deployed yet |

Deployment details (transaction hashes, blocks, verification) go to `deployments/sepolia.json` after deployment.

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
  --broadcast --slow -vvv
```

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
