import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { BalanceCard, ContractBalanceCard } from '@/components/BalanceCard'
import { ActivityFeed } from '@/components/ActivityFeed'
import { WalletButton } from '@/components/WalletButton'
import { Link2, TrendingUp, CreditCard } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { buildShareLink } from '@/lib/share'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function Dashboard() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [payLink, setPayLink] = useState('')

  useEffect(() => {
    if (!address) return
    void buildShareLink(`/pay?to=${address}&amount=`).then((base) => setPayLink(base))
  }, [address])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-[var(--muted)] text-sm">Connect your wallet to view your dashboard.</p>
        <WalletButton />
      </div>
    )
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

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <BalanceCard label="Your USDC Balance" />
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
          onClick={() => { void navigate('/pay') }}
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

      {/* Activity */}
      <div>
        <h2 className="text-base font-bold text-[var(--ink)] mb-3">Recent Activity</h2>
        <ActivityFeed />
      </div>
    </div>
  )
}
