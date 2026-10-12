# Stellar web scaffold: copy checklist

`Stellar-Faucet/web/` is the source of truth for the frontend of all six Stellar apps.
The other five repos (Stellar-LP-Staking, Stellar-Bank, Stellar-Store, Stellar-Arena, Stellargon)
copy it and change only the items below. The goal: `src/shell/` stays byte-identical in every repo,
so a fix made here can be copied over without merging.

Stack: Vite 8, React 19, TypeScript 6, Tailwind CSS 4 (`@tailwindcss/vite`, no tailwind config file),
wagmi 3, viem 2, TanStack Query 5. Node 22.12 or newer.

## 1. What is shared and what changes

| Path | Rule |
|---|---|
| `src/shell/**` | Copy unchanged. Only exception: the `CURRENT_SITE` line in `src/shell/sites.ts`. |
| `src/main.tsx`, `src/App.tsx` | Copy unchanged. |
| `scripts/sync-abi.mjs`, `public/favicon.svg`, `tsconfig*.json`, `.oxlintrc.json`, `.gitignore` | Copy unchanged. |
| `vite.config.ts` | Change `base`, and delete the `input` line (it adds the Faucet's CV page). |
| `index.html` | Change `<title>` and the `description` meta only. |
| `package.json` | Change `name` and the contract names in the `sync-abi` script. |
| `src/config/addresses.ts` | Rewrite for the repo (keep the same export names). |
| `src/abi/**` | Generated per repo by `npm run sync-abi`. Never edit by hand. |
| `src/app/**` | Replace with the repo's own page. `src/app/index.ts` must export it as `Main`. |

Site keys (`SiteKey` in `src/shell/sites.ts`):

| Repo | `CURRENT_SITE` | `base` in vite.config.ts |
|---|---|---|
| Stellar-Faucet | `'faucet'` | `'/Stellar-Faucet/'` |
| Stellar-LP-Staking | `'lp-staking'` | `'/Stellar-LP-Staking/'` |
| Stellar-Bank | `'bank'` | `'/Stellar-Bank/'` |
| Stellar-Store | `'store'` | `'/Stellar-Store/'` |
| Stellar-Arena | `'arena'` | `'/Stellar-Arena/'` |
| Stellargon | `'stellargon'` | `'/Stellargon/'` |

The order of `SITES` is the order of the tabs in the top navigation. `cv` is the last entry,
so the "CV" tab sits at the far right.

### The CV page (Stellar-Faucet only)

Only Stellar-Faucet builds a second page: the CV, served at `/Stellar-Faucet/cv/`. Its files are
`web/cv/index.html` (second Vite entry, listed in `build.rolldownOptions.input`), `web/src/cv.tsx`
(entry script), `web/src/cv/` (page code and text) and `web/public/cv/` (the PDF). `cv.tsx` renders
`<Shell site="cv">`: the optional `site` prop (default `CURRENT_SITE`) makes the nav mark the CV tab
active and points the faucet hint and the footer's source link at the `cv` entry. The other repos
copy `shell/` unchanged and do not copy these files; their `cv` entry in `SITES` already points at
the Faucet-hosted page.

## 2. Steps (example: Stellar-Bank)

Run from the root of the target repo, with Stellar-Faucet checked out next to it.

1. Copy the scaffold without dependencies, build output, ABIs and the faucet page:
   ```sh
   rsync -a --exclude node_modules --exclude dist --exclude src/abi --exclude src/app \
     --exclude /cv --exclude /src/cv --exclude /src/cv.tsx --exclude /public/cv \
     ../Stellar-Faucet/web/ ./web/
   ```
2. `web/vite.config.ts`: set `base: '/Stellar-Bank/'` and delete the `input` line.
3. `web/src/shell/sites.ts`: set `export const CURRENT_SITE: SiteKey = 'bank'`. Change nothing else in `shell/`.
4. `web/index.html`: set the `<title>` (for example `Stellar Bank · $VLAD on Sepolia`) and the description.
5. `web/package.json`: set `"name": "stellar-bank-web"` and the contract list in
   `"sync-abi": "node scripts/sync-abi.mjs StellarBank IVladToken"`.
   The script turns `Name` into `src/abi/<name>.ts` exporting `<name>Abi`
   (lower-case first letter: `StellarBank` -> `stellarBankAbi`, `IVladToken` -> `iVladTokenAbi`).
   It keeps `error` entries so viem can decode custom errors.
6. `web/src/config/addresses.ts`: keep `CHAIN_ID`, keep `addresses.vladToken`
   (the shell reads it for the VLAD balance chip and the faucet hint), add the repo's own contracts,
   and list them in `footerContracts`. The VladToken address is in
   `Stellar-Faucet/deployments/sepolia.json`. A zero address means "not deployed yet":
   `isConfiguredAddress()` returns false for it, so the page can switch reads off.
7. In the repo root run `forge build`, then in `web/` run `npm run sync-abi`.
8. Replace `web/src/app/` with the repo's page and point `web/src/app/index.ts` at it:
   `export { BankApp as Main } from './BankApp'`.
9. In `web/`: `npm install` (commit `package-lock.json`), then `npm run build`. It must finish with zero TypeScript errors.
10. Copy `.github/workflows/pages.yml` unchanged, push to `main`, then enable Pages once:
    `gh api -X POST repos/VladimirRadev/Stellar-Bank/pages -f build_type=workflow`
    (HTTP 409 means it is already enabled).

## 3. Shell API (what app code can import)

| Module | Exports |
|---|---|
| `shell/wagmi.ts` | `wagmiConfig`, `sepolia` (Sepolia with our RPCs + Blockscout), `RPC_PRIMARY`, `RPC_FALLBACK`, `EXPLORER_URL` |
| `shell/Shell.tsx` | `Shell({ children, site? })`: top nav, VLAD balance chip, Sepolia badge, wallet button, 0-VLAD faucet hint, footer |
| `shell/NetworkGate.tsx` | `NetworkGate({ children, connectMessage? })`: renders children only when connected on Sepolia, otherwise a connect or "Switch to Sepolia" call-to-action |
| `shell/TxButton.tsx` | `TxButton({ request, children, disabled?, className?, errorMessages?, onConfirmed?, successMessage? })`, `type TxRequest = { address, abi, functionName, args?, value? }`. Simulates first (decodes custom errors before the wallet opens), sends, waits for the receipt, calls `onConfirmed(hash)` and toasts "Transaction confirmed" (body = `successMessage`, a node or `(hash) => node`) or "Transaction reverted". Then it polls the head block every 1.5 s until it reaches the receipt's block (max 20 s), runs `queryClient.invalidateQueries()`, and again 3 s and 8 s later, so lagging RPC nodes cannot leave stale balances. Wallet rejections and simulation errors stay inline |
| `shell/Toast.tsx` | `toast({ kind: 'success' \| 'error' \| 'info', title, body?, href?, hrefLabel?, detail?, durationMs? })` returns an id, `dismissToast(id)`, `ToastHost` (mounted once by `Shell`; max 3 toasts, auto-dismiss after 12 s, paused on hover/focus) |
| `shell/ApproveThen.tsx` | `ApproveThen({ spender, spenderName, amount, children, token?, tokenSymbol?, tokenAbi?, stepLabels?, disabled? })`: the shared approve-then-act flow. Reads the allowance, shows a 2-step track, renders an "Approve N VLAD" TxButton until the allowance covers `amount`, then `children` (step 2) |
| `shell/errors.ts` | `describeError(error, messages?)`, `DEFAULT_ERROR_MESSAGES`, `COMMON_ERRORS_ABI` (OpenZeppelin errors merged into every simulation), `type ErrorMessages` |
| `shell/format.ts` | `formatToken`, `formatCompact`, `truncateAddress`, `formatDuration`, `formatCountdown`, `formatTimestamp`, `explorerAddressUrl`, `explorerTxUrl`, `isConfiguredAddress` |
| `shell/StatTile.tsx` | `StatTile({ label, value, unit?, hint?, loading?, highlight? })` |
| `shell/Tabs.tsx` | `Tabs({ tabs, value, onChange, label })`: in-page tab state (there is no router) |
| `shell/CopyButton.tsx` | `CopyButton({ value, label? })` |
| `shell/WalletButton.tsx` | `WalletButton`, `ConnectButton({ className?, compact? })` |
| `shell/useConnectWallet.ts`, `shell/useVladBalance.ts`, `shell/useNow.ts` | hooks: connect via the injected connector, the wallet's VLAD balance, current unix time ticking every second |
| `shell/icons.tsx` | `StarGlyph`, `CopyIcon`, `CheckIcon`, `AlertIcon`, `InfoIcon`, `ExternalIcon`, `ArrowIcon`, `CloseIcon`, `GithubIcon`, `Spinner`, ... |
| `shell/sites.ts` | `SITES`, `CURRENT_SITE`, `currentSite`, `getSite(key)`, `GITHUB_PROFILE` |
| `shell/theme.css` | Design tokens as Tailwind `@theme` variables (`bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `text-accent`, `text-accent-2`, `text-lime`, `text-text`, `text-muted`, `text-danger`, `font-display`, `font-mono`) and component classes `.card`, `.btn` + `.btn-primary` / `.btn-ghost`, `.chip`, `.eyebrow`, `.link`, `.skeleton`, animation `animate-toast-in` |

Every `TxButton` that moves funds must pass a `successMessage` with concrete amounts
("Bought 3 × Plasma Blade for 150 VLAD.", not "Success"). Approve-then-act flows use `ApproveThen`:

```tsx
<ApproveThen spender={addresses.store} spenderName="the Store" amount={total}>
  <TxButton request={{ address: addresses.store, abi: stellarStoreAbi, functionName: 'buy', args: [id, qty] }}
    successMessage={`Bought ${qty} × ${name} for ${formatToken(total)} VLAD.`} className="w-full">
    Buy {qty} × {name}
  </TxButton>
</ApproveThen>
```

## 4. wagmi 3 notes (differences from wagmi 2)

- `useConnection()` replaces `useAccount()` (the old name is a deprecated alias).
- Mutation hooks expose TanStack names: `useConnect().mutate({ connector })`, `useSwitchChain().mutate({ chainId })`,
  `useWriteContract().mutateAsync({...})`, `useWatchAsset().mutate({...})`. `writeContract`, `connect`, ... are deprecated aliases.
- `useConnectors()` replaces `useConnect().connectors`.
- Pass `chainId: CHAIN_ID` on every read so reads hit Sepolia even while the wallet sits on another chain.

## 5. Rules

- Wallet: the `injected()` connector only (MetaMask). No WalletConnect, no backend, no router.
- RPC: only `https://ethereum-sepolia-rpc.publicnode.com` (primary) and `https://sepolia.gateway.tenderly.co` (fallback). No API keys anywhere.
- Explorer links: Blockscout (`https://eth-sepolia.blockscout.com`).
- Transactions: every `TxButton` that moves funds passes a `successMessage` with concrete amounts. Approvals go through `ApproveThen`, never a hand-made approve button.
- Branding: "Stellar — personal Web3 suite on Ethereum Sepolia". It is a personal portfolio brand, unrelated to the Stellar (XLM) network.
