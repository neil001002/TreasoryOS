import { ConnectKitButton } from 'connectkit'
import { useAccount, useSwitchChain } from 'wagmi'
import { ARC_CHAIN_ID, arcChainFact } from '@/lib/arc'
import { cn } from '@/lib/utils'
import { Wallet, AlertTriangle, ChevronDown } from 'lucide-react'

export function WalletButton({ className }: { className?: string }) {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID

  return (
    <div className="flex items-center gap-2">
      {/* Wrong-chain badge — shown alongside the wallet button, not replacing it */}
      {isWrongChain && (
        <button
          onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
          disabled={isSwitching}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-60',
          )}
        >
          <AlertTriangle size={12} />
          {isSwitching ? 'Switching…' : `Switch to ${arcChainFact.name}`}
        </button>
      )}

      {/* ConnectKit handles connect, connected display, AND disconnect in its modal */}
      <ConnectKitButton.Custom>
        {({ isConnected: connected, show, address, truncatedAddress, ensName }) => (
          <button
            onClick={show}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              connected
                ? 'bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] hover:border-[var(--border-strong)]'
                : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
              className,
            )}
          >
            <Wallet size={15} />
            {connected
              ? (ensName ?? truncatedAddress ?? `${address?.slice(0, 6)}…${address?.slice(-4)}`)
              : 'Connect Wallet'}
            {connected && <ChevronDown size={13} className="text-[var(--muted)]" />}
          </button>
        )}
      </ConnectKitButton.Custom>
    </div>
  )
}
