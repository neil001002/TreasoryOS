/**
 * Runtime network switcher — persisted to localStorage so it survives page reloads.
 *
 * Both contract addresses are baked into the build (from VITE_TREASURY_SPLITTER_TESTNET
 * and VITE_TREASURY_SPLITTER_MAINNET). Switching networks here just tells the app
 * which address to use — no rebuild needed.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { requireChain, getUsdc } from '@/onchain-facts'

export type ArcNetwork = 'testnet' | 'mainnet'

const ARC_TESTNET_ID = 5042002
const ARC_MAINNET_ID  = 5042

const TESTNET_CONTRACT = (import.meta.env.VITE_TREASURY_SPLITTER_TESTNET as string | undefined) ?? ''
const MAINNET_CONTRACT = (import.meta.env.VITE_TREASURY_SPLITTER_MAINNET as string | undefined) ?? ''
const TESTNET_FACTORY  = (import.meta.env.VITE_TREASURY_FACTORY_TESTNET  as string | undefined) ?? ''
const MAINNET_FACTORY  = (import.meta.env.VITE_TREASURY_FACTORY_MAINNET  as string | undefined) ?? ''

const LS_KEY = 'treasuryos_network'

function readStoredNetwork(): ArcNetwork {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (v === 'mainnet' || v === 'testnet') return v
  } catch { /* ignore */ }
  // Fall back to the build-time default
  const envDefault = (import.meta.env.VITE_ARC_NETWORK as string | undefined) ?? 'testnet'
  return envDefault === 'mainnet' ? 'mainnet' : 'testnet'
}

interface NetworkContextValue {
  arcNetwork: ArcNetwork
  isMainnet: boolean
  arcChainId: number
  contractAddress: `0x${string}`
  factoryAddress: `0x${string}`
  usdcAddress: `0x${string}`
  usdcDecimals: number
  explorerBase: string
  setNetwork: (n: ArcNetwork) => void
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [arcNetwork, setArcNetworkState] = useState<ArcNetwork>(readStoredNetwork)

  const setNetwork = useCallback((n: ArcNetwork) => {
    try { localStorage.setItem(LS_KEY, n) } catch { /* ignore */ }
    setArcNetworkState(n)
  }, [])

  const isMainnet = arcNetwork === 'mainnet'
  const arcChainId = isMainnet ? ARC_MAINNET_ID : ARC_TESTNET_ID
  const chain = requireChain(arcChainId)
  const usdcFact = getUsdc(arcChainId)

  const value: NetworkContextValue = {
    arcNetwork,
    isMainnet,
    arcChainId,
    contractAddress: (isMainnet ? MAINNET_CONTRACT : TESTNET_CONTRACT) as `0x${string}`,
    factoryAddress:  (isMainnet ? MAINNET_FACTORY  : TESTNET_FACTORY)  as `0x${string}`,
    usdcAddress: (usdcFact?.address ?? '') as `0x${string}`,
    usdcDecimals: usdcFact?.decimals ?? 6,
    explorerBase: chain.explorerBase,
    setNetwork,
  }

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useArcNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useArcNetwork must be used inside <NetworkProvider>')
  return ctx
}
