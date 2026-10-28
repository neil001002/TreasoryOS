/**
 * Arc chain configuration for TreasuryOS.
 *
 * Runtime network switching is handled by NetworkContext (src/context/NetworkContext.tsx).
 * These exports are static constants used by non-React code (wagmi config, scripts).
 *
 * In React components, always use `useArcNetwork()` from NetworkContext — never read
 * ARC_CHAIN_ID or TREASURY_SPLITTER_ADDRESS directly, as they won't update on switch.
 */

import { requireChain, getUsdc } from '@/onchain-facts'

export const ARC_TESTNET_ID = 5042002
export const ARC_MAINNET_ID  = 5042

export type ArcNetwork = 'testnet' | 'mainnet'

// Build-time default — used as wagmi initialChain and script fallback only.
const raw = (import.meta.env.VITE_ARC_NETWORK as string | undefined) ?? 'testnet'
export const ARC_NETWORK: ArcNetwork = raw === 'mainnet' ? 'mainnet' : 'testnet'
export const IS_MAINNET = ARC_NETWORK === 'mainnet'
export const ARC_CHAIN_ID: number = IS_MAINNET ? ARC_MAINNET_ID : ARC_TESTNET_ID

export const arcChainFact = requireChain(ARC_CHAIN_ID)

const usdcFact = getUsdc(ARC_CHAIN_ID)
if (!usdcFact) throw new Error(`No USDC configured for chain ${ARC_CHAIN_ID}`)

export const USDC_ADDRESS   = usdcFact.address as `0x${string}`
export const USDC_DECIMALS  = usdcFact.decimals
export const EXPLORER_BASE  = arcChainFact.explorerBase

// Both contract addresses — NetworkContext picks the right one at runtime.
export const TREASURY_SPLITTER_TESTNET = (
  import.meta.env.VITE_TREASURY_SPLITTER_TESTNET as string | undefined ?? ''
) as `0x${string}`

export const TREASURY_SPLITTER_MAINNET = (
  import.meta.env.VITE_TREASURY_SPLITTER_MAINNET as string | undefined ?? ''
) as `0x${string}`

/** Build-time active address — use `useArcNetwork().contractAddress` in components. */
export const TREASURY_SPLITTER_ADDRESS = (
  IS_MAINNET ? TREASURY_SPLITTER_MAINNET : TREASURY_SPLITTER_TESTNET
)
