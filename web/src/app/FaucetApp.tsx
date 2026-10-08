import { useConnection, useReadContracts, useWatchAsset } from 'wagmi'
import { stellarFaucetAbi, vladTokenAbi } from '../abi'
import { CHAIN_ID, addresses } from '../config/addresses'
import { CopyButton } from '../shell/CopyButton'
import { describeError, type ErrorMessages } from '../shell/errors'
import {
  explorerAddressUrl,
  formatCompact,
  formatCountdown,
  formatDuration,
  formatTimestamp,
  formatToken,
  isConfiguredAddress,
} from '../shell/format'
import { ArrowIcon, CheckIcon, ExternalIcon, StarGlyph } from '../shell/icons'
import { NetworkGate } from '../shell/NetworkGate'
import { SITES, type SiteKey } from '../shell/sites'
import { StatTile } from '../shell/StatTile'
import { TxButton } from '../shell/TxButton'
import { useNow } from '../shell/useNow'
import { useVladBalance } from '../shell/useVladBalance'

const DEPLOYED = isConfiguredAddress(addresses.vladToken) && isConfiguredAddress(addresses.faucet)
const faucet = { address: addresses.faucet, abi: stellarFaucetAbi, chainId: CHAIN_ID } as const
const token = { address: addresses.vladToken, abi: vladTokenAbi, chainId: CHAIN_ID } as const

const FAUCET_ERRORS: ErrorMessages = {
  CooldownActive: ([next]) => `Cooldown active: your next claim opens ${formatTimestamp(next as bigint)}.`,
  FaucetPaused: () => 'The faucet is paused by its owner (drip amount is 0).',
  AccessControlUnauthorizedAccount: () => 'The faucet is missing MINTER_ROLE on the VLAD token, so it cannot mint.',
}

/** How VLAD flows through the rest of the suite, one line per app. */
const TOKEN_FLOW: Partial<Record<SiteKey, string>> = {
  'lp-staking': 'Swap VLAD, provide liquidity and stake the LP tokens to earn rewards.',
  bank: 'Deposit VLAD into the bank and watch it earn interest on-chain.',
  store: 'Spend VLAD on items in an on-chain store.',
  arena: 'Bring VLAD into the arena and play on-chain games with it.',
}

export function FaucetApp() {
  const globals = useReadContracts({
    contracts: [
      { ...faucet, functionName: 'dripAmount' },
      { ...faucet, functionName: 'cooldown' },
      { ...token, functionName: 'totalSupply' },
    ],
    query: { enabled: DEPLOYED },
  })
  const drip = globals.data?.[0]?.result
  const cooldown = globals.data?.[1]?.result
  const totalSupply = globals.data?.[2]?.result
  const loading = DEPLOYED && globals.isLoading

  const { isConnected } = useConnection()
  const { balance, isLoading: balanceLoading } = useVladBalance()

  return (
    <div className="space-y-12 sm:space-y-16">
      {!DEPLOYED ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm text-warning">
          Contracts are not deployed yet. The addresses in <code className="font-mono">config/addresses.ts</code> are
          placeholders, so on-chain reads are switched off.
        </div>
      ) : null}

      {/* Hero + claim card */}
      <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="min-w-0 pt-2">
          <p className="eyebrow inline-flex items-center gap-2">
            <StarGlyph size={12} /> Stellar suite · token hub
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Vladimir{' '}
            <span className="bg-gradient-to-r from-lime via-accent-2 to-accent bg-clip-text text-transparent">($VLAD)</span>
          </h1>
          <p className="mt-3 font-display text-lg text-text/90 sm:text-xl">the token that powers the Stellar suite</p>
          <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-muted">
            Claim {drip !== undefined ? formatToken(drip) : '100'} VLAD every{' '}
            {cooldown !== undefined ? formatDuration(cooldown) : '6h'} for free, then use it across the suite: swap and
            stake it, deposit it in the bank, spend it in the store and play with it in the arena. Everything runs on the
            Ethereum Sepolia testnet.
          </p>

          <TokenAddress />
        </div>

        <ClaimCard drip={drip} cooldown={cooldown} />
      </section>

      {/* Stats */}
      <section aria-label="Token statistics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Your balance"
          value={isConnected ? formatToken(balance) : '—'}
          unit="VLAD"
          loading={balanceLoading}
          hint={isConnected ? 'connected wallet' : 'connect a wallet'}
          highlight
        />
        <StatTile label="Drip amount" value={formatToken(drip)} unit="VLAD" loading={loading} hint="per claim" />
        <StatTile label="Cooldown" value={formatDuration(cooldown)} loading={loading} hint="between claims" />
        <StatTile
          label="Total supply"
          value={formatCompact(totalSupply)}
          unit="VLAD"
          loading={loading}
          hint={totalSupply !== undefined ? `${formatToken(totalSupply, 18, 0)} VLAD` : 'minted so far'}
        />
      </section>

      <WhatsNext />
    </div>
  )
}

function ClaimCard({ drip, cooldown }: { drip: bigint | undefined; cooldown: bigint | undefined }) {
  return (
    <div id="claim" className="card scroll-mt-28 overflow-hidden p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/20 blur-3xl"
      />
      <p className="eyebrow">Faucet</p>
      <h2 className="mt-2 text-2xl font-semibold">Claim your VLAD</h2>
      <p className="mt-1 text-sm text-muted">
        {drip !== undefined ? formatToken(drip) : '100'} VLAD per claim · one claim every{' '}
        {cooldown !== undefined ? formatDuration(cooldown) : '6h'} per address.
      </p>
      <div className="mt-6">
        <NetworkGate connectMessage="Connect MetaMask to claim free VLAD.">
          <ClaimPanel drip={drip} cooldown={cooldown} />
        </NetworkGate>
      </div>
    </div>
  )
}

function ClaimPanel({ drip, cooldown }: { drip: bigint | undefined; cooldown: bigint | undefined }) {
  const { address } = useConnection()
  const now = useNow()
  const user = useReadContracts({
    contracts: address
      ? [
          { ...faucet, functionName: 'nextClaimAt', args: [address] },
          { ...faucet, functionName: 'lastClaimAt', args: [address] },
        ]
      : [],
    query: { enabled: DEPLOYED && !!address },
  })
  const nextClaimAt = user.data?.[0]?.result as bigint | undefined
  const lastClaimAt = user.data?.[1]?.result as bigint | undefined

  const remaining = nextClaimAt ? Math.max(0, Number(nextClaimAt) - now) : 0
  const canClaim = DEPLOYED && !user.isLoading && remaining === 0
  const paused = drip === 0n
  const progress = cooldown && remaining > 0 ? Math.min(1, 1 - remaining / Number(cooldown)) : 1

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">{remaining > 0 ? 'Next claim in' : 'Status'}</span>
          <span className={`font-mono text-2xl font-semibold tabular-nums ${remaining > 0 ? 'text-text' : 'text-accent-2'}`}>
            {!DEPLOYED ? '—' : paused ? 'Paused' : remaining > 0 ? formatCountdown(remaining) : 'Ready'}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent via-accent-2 to-lime transition-[width] duration-1000"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {lastClaimAt && lastClaimAt > 0n ? (
          <p className="mt-2 text-xs text-muted">Last claim: {formatTimestamp(lastClaimAt)}</p>
        ) : null}
      </div>

      <TxButton
        request={{ address: addresses.faucet, abi: stellarFaucetAbi, functionName: 'claim' }}
        disabled={!canClaim || paused}
        errorMessages={FAUCET_ERRORS}
        className="h-13 w-full text-base"
      >
        {remaining > 0 ? `Next claim in ${formatCountdown(remaining)}` : `Claim ${drip !== undefined ? formatToken(drip) : ''} VLAD`}
      </TxButton>
    </div>
  )
}

function TokenAddress() {
  const { isConnected } = useConnection()
  const watch = useWatchAsset()
  const image = `${window.location.origin}${import.meta.env.BASE_URL}favicon.svg`

  return (
    <div className="mt-8 space-y-3">
      <p className="eyebrow">Token contract</p>
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-surface/60 p-2 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-text/90">
          {DEPLOYED ? addresses.vladToken : 'not deployed yet'}
        </span>
        {DEPLOYED ? (
          <>
            <CopyButton value={addresses.vladToken} label="Copy token address" />
            <a
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2/60 text-muted transition hover:border-accent-2/50 hover:text-text"
              href={explorerAddressUrl(addresses.vladToken)}
              target="_blank"
              rel="noreferrer"
              aria-label="View token on Blockscout"
              title="View on Blockscout"
            >
              <ExternalIcon />
            </a>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!DEPLOYED || !isConnected || watch.isPending}
          title={!isConnected ? 'Connect your wallet first' : undefined}
          onClick={() =>
            watch.mutate({
              type: 'ERC20',
              options: { address: addresses.vladToken, symbol: 'VLAD', decimals: 18, image },
            })
          }
        >
          <StarGlyph size={16} />
          {watch.isPending ? 'Check your wallet…' : 'Add VLAD to MetaMask'}
        </button>
        {watch.isSuccess && watch.data ? (
          <span className="inline-flex items-center gap-1 text-sm text-accent-2">
            <CheckIcon size={15} /> Added to your wallet
          </span>
        ) : null}
        {watch.error ? <span className="text-sm text-danger">{describeError(watch.error)}</span> : null}
      </div>
    </div>
  )
}

function WhatsNext() {
  const next = SITES.filter((s) => s.key !== 'faucet')
  return (
    <section aria-labelledby="whats-next">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">What&apos;s next</p>
          <h2 id="whats-next" className="mt-2 text-2xl font-semibold sm:text-3xl">
            Put your VLAD to work
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted">Every Stellar app uses the same $VLAD token on Sepolia.</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {next.map((site, i) => (
          <a
            key={site.key}
            href={site.url}
            className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-accent-2/40"
          >
            <span className="font-mono text-xs text-accent-2">0{i + 1}</span>
            <span className="mt-3 font-display text-lg font-semibold">{site.name}</span>
            <span className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{TOKEN_FLOW[site.key] ?? site.tagline}</span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-2">
              Open {site.navLabel}
              <ArrowIcon size={15} className="transition group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
