/**
 * CircleWalletContext — holds the Circle Modular Wallet (passkey) session.
 * Separate from wagmi — Circle smart accounts are not injected providers.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type P256Credential } from 'viem/account-abstraction'

export interface CircleWalletState {
  address: `0x${string}` | null
  credential: P256Credential | null
  isConnected: boolean
  connect: (address: `0x${string}`, credential: P256Credential) => void
  disconnect: () => void
}

const CircleWalletContext = createContext<CircleWalletState | null>(null)

// Persist credential in sessionStorage so it survives hot-reloads (not localStorage for security)
const STORAGE_KEY = 'circle_wallet_session'

function loadSession(): { address: `0x${string}`; credential: P256Credential } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { address: `0x${string}`; credential: P256Credential }
  } catch {
    return null
  }
}

export function CircleWalletProvider({ children }: { children: ReactNode }) {
  const saved = loadSession()
  const [address, setAddress] = useState<`0x${string}` | null>(saved?.address ?? null)
  const [credential, setCredential] = useState<P256Credential | null>(saved?.credential ?? null)

  const connect = useCallback((addr: `0x${string}`, cred: P256Credential) => {
    setAddress(addr)
    setCredential(cred)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ address: addr, credential: cred }))
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setCredential(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <CircleWalletContext.Provider value={{ address, credential, isConnected: !!address, connect, disconnect }}>
      {children}
    </CircleWalletContext.Provider>
  )
}

export function useCircleWallet(): CircleWalletState {
  const ctx = useContext(CircleWalletContext)
  if (!ctx) throw new Error('useCircleWallet must be used inside CircleWalletProvider')
  return ctx
}
