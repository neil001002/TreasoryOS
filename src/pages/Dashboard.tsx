import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ContractBalanceCard } from '@/components/BalanceCard'
import { StablecoinBalances } from '@/components/StablecoinBalances'
import { ActivityFeed } from '@/components/ActivityFeed'
import { WalletButton } from '@/components/WalletButton'
import { SetupTreasury } from '@/components/SetupTreasury'
import { Link2, TrendingUp, CreditCard, Loader2 } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { CCTPBridgeCard } from '@/features/cctp/components/CCTPBridgeCard'
import { StableFXCard } from '@/features/stablefx/components/StableFXCard'
import { useTreasury } from '@/hooks/useTreasury'
import { useArcNetwork } from '@/context/NetworkContext'

const FEATURE_CCTP = (import.meta.env.VITE_FEATURE_CCTP as string | undefined) !== 'false'
const FEATURE_STABLEFX = (import.meta.env.VITE_FEATURE_STABLEFX as string | undefined) !== 'false'

export function Dashboard() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const { factoryAddress } = useArcNetwork()
  const { treasuryAddress, isLoading, refetch } = useTreasury()

  const appBase = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin
  const payLink = address ? `${appBase}/pay?to=${address}&amount=` : ''

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-[var(--muted)] text-sm">Connect your wallet to view your dashboard.</p>
        <WalletButton />
      </div>
    )
  }

  // Loading treasury lookup
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        <p className="text-[var(--muted)] text-sm">Checking your treasury...</p>
      </div>
    )
  }

  // No treasury yet — show setup (only when factory is configured)
  if (!treasuryAddress && factoryAddress) {
    return <SetupTreasury onCreated={() => { void refetch() }} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="display text-2xl md:text-3xl font-bold text-[var(--ink)]">Overview</h1>
          {address && (
            <p className="text-sm text-[var(--muted)] mono mt-0.5">{formatAddress(address)}</p>
          )}
        </div>
      </div>

      {/* Stablecoin wallet balances */}
      <div>
        <h2 className="text-base font-bold text-[var(--ink)] mb-3">Wallet Balances</h2>
        <StablecoinBalances />
      </div>

      {/* Contract pool + payment link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ContractBalanceCard />
        <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-5 backdrop-blur-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
            Payment link
          </p>
          <div>
            <p className="text-xs text-[var(--muted)] mono truncate mb-3">
              {payLink ? payLink + '10.00' : 'Loading...'}
            </p>
            <button
              onClick={() => {
                if (!payLink) return
                void navigator.clipboard.writeText(payLink + '10.00')
                toast.success('Payment link copied!')
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              <Link2 size={13} />
              Copy link
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => { void navigate(address ? `/pay?to=${address}&amount=` : '/pay') }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Link2 size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Create Payment Link</p>
            <p className="text-xs text-[var(--muted)]">Share to receive USDC</p>
          </div>
        </button>

        <button
          onClick={() => { void navigate('/dashboard/buckets') }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Distribute USDC</p>
            <p className="text-xs text-[var(--muted)]">Split to buckets</p>
          </div>
        </button>

        <button
          onClick={() => { void navigate('/dashboard/payments') }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <CreditCard size={16} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Pay Contractor</p>
            <p className="text-xs text-[var(--muted)]">Send USDC from contract</p>
          </div>
        </button>
      </div>

      {/* Treasury tools */}
      {(FEATURE_CCTP || FEATURE_STABLEFX) && (
        <div>
          <h2 className="text-base font-bold text-[var(--ink)] mb-3">Treasury Tools</h2>
          <div className="space-y-3">
            {FEATURE_CCTP && <CCTPBridgeCard />}
            {FEATURE_STABLEFX && <StableFXCard />}
          </div>
        </div>
      )}

      {/* Activity */}
      <div>
        <h2 className="text-base font-bold text-[var(--ink)] mb-3">Recent Activity</h2>
        <ActivityFeed />
      </div>
    </div>
  )
}
