/**
 * StableFX supported swap tokens on Arc.
 *
 * On Arc, USDC, EURC, and cirBTC are the three supported swap tokens.
 * USDC ↔ NATIVE is a no-op (same asset on Arc) and is never offered.
 * Any combination of the three tokens can be swapped in either direction.
 */

export interface SwapToken {
  /** Circle SDK token alias — must match exactly */
  symbol: string
  /** Human-readable label */
  label: string
  /** Short flag/icon hint */
  flag: string
  /** Description shown in UI */
  description: string
}

export const SWAP_TOKENS: SwapToken[] = [
  {
    symbol: 'USDC',
    label: 'USDC',
    flag: '💵',
    description: 'USD stablecoin by Circle',
  },
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

/** Guard: USDC ↔ NATIVE is always a no-op on Arc. */
export function isNoOpSwap(tokenIn: string, tokenOut: string): boolean {
  const noOps = new Set(['USDC', 'NATIVE'])
  return noOps.has(tokenIn) && noOps.has(tokenOut)
}

/** Guard: same token → same token is also a no-op. */
export function isSameToken(tokenIn: string, tokenOut: string): boolean {
  return tokenIn === tokenOut
}

/** Circle SDK chain identifier for Arc */
export const ARC_SWAP_CHAIN_MAINNET = 'Arc'
export const ARC_SWAP_CHAIN_TESTNET = 'Arc_Testnet'

export function getArcSwapChain(isMainnet: boolean): string {
  return isMainnet ? ARC_SWAP_CHAIN_MAINNET : ARC_SWAP_CHAIN_TESTNET
}

// Legacy exports kept for back-compat with ActivityFeed / any other consumer
export const STABLEFX_SOURCE_TOKEN = 'USDC'
export const STABLEFX_TARGET_TOKENS = SWAP_TOKENS.filter((t) => t.symbol !== 'USDC')
