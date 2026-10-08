import type { Address } from 'viem'

/** Ethereum Sepolia. */
export const CHAIN_ID = 11155111 as const

/**
 * Deployed contract addresses on Sepolia (source of truth: deployments/sepolia.json).
 * A zero address is a placeholder: the UI shows a "not deployed yet" state for it.
 */
export const addresses = {
  vladToken: '0x49ba857d553ef219B144b200F41acaf8CB6768E9',
  faucet: '0x20f7b01E1c017B629a9448A05F8B7D726917C3AB',
} as const satisfies Record<string, Address>

/** Contracts listed in the footer, with Blockscout links. */
export const footerContracts: readonly { label: string; address: Address }[] = [
  { label: 'VladToken ($VLAD)', address: addresses.vladToken },
  { label: 'StellarFaucet', address: addresses.faucet },
]
