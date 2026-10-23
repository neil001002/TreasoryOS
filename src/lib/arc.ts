/**
 * Arc chain configuration for TreasuryOS.
 * All values are imported from Arc Studio's onchain-facts registry or env vars.
 * Never hardcode addresses here — read them from onchain-facts or .env.
 */

import { requireChain, getUsdc } from '@/onchain-facts'

// Arc Testnet chain ID: 5042002 | Arc Mainnet: 5042
// Set VITE_ARC_CHAIN_ID in .env to override (defaults to testnet).
const rawChainId: string | undefined = import.meta.env.VITE_ARC_CHAIN_ID as string | undefined
export const ARC_CHAIN_ID: number = rawChainId ? parseInt(rawChainId, 10) : 5042002

export const arcChainFact = requireChain(ARC_CHAIN_ID)

const usdcFact = getUsdc(ARC_CHAIN_ID)
if (!usdcFact) {
  throw new Error(`No USDC configured for chain ${ARC_CHAIN_ID}`)
}

export const USDC_ADDRESS = usdcFact.address as `0x${string}`
export const USDC_DECIMALS = usdcFact.decimals

// TreasurySplitter contract address — set after deployment via VITE_TREASURY_SPLITTER_ADDRESS
export const TREASURY_SPLITTER_ADDRESS = (
  import.meta.env.VITE_TREASURY_SPLITTER_ADDRESS ?? ''
) as `0x${string}`

export const EXPLORER_BASE = arcChainFact.explorerBase
