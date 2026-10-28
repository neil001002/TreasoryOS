/**
 * StableFX supported swap pairs on Arc.
 *
 * On Arc, only USDC, EURC, and cirBTC are supported swap tokens.
 * USDC ↔ NATIVE is a no-op (same asset on Arc) and must never be offered.
 *
 * Source token is always USDC (the treasury asset).
 * Target tokens are EURC and cirBTC.
 */

export interface SwapTargetToken {
  /** Circle SDK token alias — must match exactly */
  symbol: string
  /** Human-readable label */
  label: string
  /** Emoji or short icon hint for UI */
  flag: string
  /** Description shown in the UI */
  description: string
}

export const STABLEFX_TARGET_TOKENS: SwapTargetToken[] = [
  {
    symbol: 'EURC',
    label: 'EURC',
    flag: '🇪🇺',
    description: 'Euro stablecoin by Circle',
  },
  {
    symbol: 'CIRBTC',
    label: 'cirBTC',
    flag: '₿',
    description: 'Bridged BTC on Arc via Circle',
  },
]

export const STABLEFX_SOURCE_TOKEN = 'USDC'

/** Circle SDK chain identifier for Arc */
export const ARC_SWAP_CHAIN_MAINNET = 'Arc'
export const ARC_SWAP_CHAIN_TESTNET = 'Arc_Testnet'

export function getArcSwapChain(isMainnet: boolean): string {
  return isMainnet ? ARC_SWAP_CHAIN_MAINNET : ARC_SWAP_CHAIN_TESTNET
}
