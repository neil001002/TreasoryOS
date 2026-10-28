/**
 * CCTP source chain configuration for TreasuryOS.
 * These are the chains users can bridge USDC *from* into Arc.
 * Arc (mainnet) and Arc_Testnet are always the destination — never the source here.
 *
 * Chain identifiers must match Circle's SDK string keys exactly.
 */

import {
  mainnet,
  base,
  arbitrum,
  polygon,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  polygonAmoy,
} from 'viem/chains'
import type { Chain } from 'viem'

export interface CctpSourceChain {
  /** Circle SDK chain identifier string */
  circleId: string
  /** Human-readable label */
  label: string
  /** Numeric chain ID for wagmi switchChain */
  chainId: number
  /** viem Chain object for withAddChainFallback */
  viemChain: Chain
  /** Is this a testnet chain? */
  testnet: boolean
}

export const CCTP_SOURCE_CHAINS: CctpSourceChain[] = [
  // ── Mainnets ──────────────────────────────────────────────────────────────
  {
    circleId: 'Ethereum',
    label: 'Ethereum',
    chainId: mainnet.id,
    viemChain: mainnet,
    testnet: false,
  },
  {
    circleId: 'Base',
    label: 'Base',
    chainId: base.id,
    viemChain: base,
    testnet: false,
  },
  {
    circleId: 'Arbitrum',
    label: 'Arbitrum',
    chainId: arbitrum.id,
    viemChain: arbitrum,
    testnet: false,
  },
  {
    circleId: 'Polygon',
    label: 'Polygon',
    chainId: polygon.id,
    viemChain: polygon,
    testnet: false,
  },
  // ── Testnets ──────────────────────────────────────────────────────────────
  {
    circleId: 'Ethereum_Sepolia',
    label: 'Ethereum Sepolia',
    chainId: sepolia.id,
    viemChain: sepolia,
    testnet: true,
  },
  {
    circleId: 'Base_Sepolia',
    label: 'Base Sepolia',
    chainId: baseSepolia.id,
    viemChain: baseSepolia,
    testnet: true,
  },
  {
    circleId: 'Arbitrum_Sepolia',
    label: 'Arbitrum Sepolia',
    chainId: arbitrumSepolia.id,
    viemChain: arbitrumSepolia,
    testnet: true,
  },
  {
    circleId: 'Polygon_Amoy',
    label: 'Polygon Amoy',
    chainId: polygonAmoy.id,
    viemChain: polygonAmoy,
    testnet: true,
  },
]

/** Filter to mainnet or testnet based on current network */
export function getSourceChains(isMainnet: boolean): CctpSourceChain[] {
  return CCTP_SOURCE_CHAINS.filter((c) => c.testnet !== isMainnet)
}

/** The Circle destination chain identifier for Arc */
export const ARC_CIRCLE_ID_MAINNET = 'Arc'
export const ARC_CIRCLE_ID_TESTNET = 'Arc_Testnet'

export function getArcCircleId(isMainnet: boolean): string {
  return isMainnet ? ARC_CIRCLE_ID_MAINNET : ARC_CIRCLE_ID_TESTNET
}
