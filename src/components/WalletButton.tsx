import { useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { arc, arcTestnet } from 'viem/chains'
import { useArcNetwork, type ArcNetwork } from '@/context/NetworkContext'
import { arcChainFact } from '@/lib/arc'
import { cn } from '@/lib/utils'
import { Wallet, AlertTriangle, LogOut, ChevronDown, RefreshCw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { ConnectKitButton } from 'connectkit'

/** Switches both the app network (context) and the wallet chain simultaneously. */
function NetworkSwitcher() {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const { arcNetwork, isMainnet, setNetwork } = useArcNetwork()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const networks: { chain: typeof arc | typeof arcTestnet; label: string; network: ArcNetwork }[] = [
    { chain: arcTestnet, label: 'Arc Testnet', network: 'testnet' },
    { chain: arc,        label: 'Arc Mainnet', network: 'mainnet' },
  ]

  function handleSwitch(network: ArcNetwork, chainId: number) {
    setNetwork(network)
    if (isConnected) switchChain({ chainId })
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-60"
      >
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          isMainnet ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse',
        )} />
        <span className="text-[var(--ink)]">{isMainnet ? 'Arc Mainnet' : 'Arc Testnet'}</span>
        {isPending
          ? <RefreshCw size={11} className="animate-spin" />
          : <ChevronDown size={11} className="text-[var(--muted)]" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden z-50">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">
            Switch network
          </p>
          {networks.map(n => {
            const isActive = arcNetwork === n.network
            const isWalletOn = chainId === n.chain.id
            return (
              <button
                key={n.network}
                onClick={() => handleSwitch(n.network, n.chain.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors text-left',
                  isActive ? 'bg-[var(--surface-muted)] font-semibold' : 'hover:bg-[var(--surface-muted)]',
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  n.network === 'mainnet' ? 'bg-emerald-500' : 'bg-amber-400',
                )} />
                <span className="text-[var(--ink)]">{n.label}</span>
                <span className="ml-auto flex items-center gap-1">
                  {isActive && <span className="text-[10px] text-[var(--accent)] font-semibold">app</span>}
                  {isWalletOn && <span className="text-[10px] text-[var(--muted)]">wallet</span>}
                </span>
              </button>
            )
          })}
          <p className="px-3 py-2 text-[10px] text-[var(--muted)] border-t border-[var(--border)]">
            Switches both app and wallet network
          </p>
        </div>
      )}
    </div>
  )
}

export function WalletButton({ className }: { className?: string }) {
  const { chainId, isConnected, address } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { disconnect } = useDisconnect()
  const { arcChainId } = useArcNetwork()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isWrongChain = isConnected && chainId !== arcChainId

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!isConnected) {
    return (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button
            onClick={show}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
              className,
            )}
          >
            <Wallet size={15} />
            Connect Wallet
          </button>
        )}
      </ConnectKitButton.Custom>
    )
  }

  const truncated = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  return (
    <div className="flex items-center gap-2">
      {/* Wrong-chain prompt */}
      {isWrongChain && (
        <button
          onClick={() => switchChain({ chainId: arcChainId })}
          disabled={isSwitching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-60 transition-colors"
        >
          <AlertTriangle size={12} />
          {isSwitching ? 'Switching…' : `Switch to ${arcChainFact.name}`}
        </button>
      )}

      {/* Network switcher */}
      <NetworkSwitcher />

      {/* Connected wallet + disconnect dropdown */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            'bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] hover:border-[var(--border-strong)]',
            className,
          )}
        >
          <Wallet size={15} />
          {truncated}
          <ChevronDown size={13} className="text-[var(--muted)]" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-[var(--border)]">
              <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Connected as</p>
              <p className="text-xs font-mono text-[var(--ink)] truncate mt-0.5">{address}</p>
            </div>
            <button
              onClick={() => { disconnect(); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
