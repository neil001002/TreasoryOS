import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { WalletButton } from '@/components/WalletButton'
import { CircleWalletButton } from '@/components/CircleWalletButton'
import { NetworkBadge } from '@/components/NetworkBadge'
import { ArrowRight, PieChart, CreditCard, Zap } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'

const FEATURES = [
  {
    icon: TokenUSDC,
    title: 'Receive USDC on Arc',
    description: 'Get a shareable payment link. Anyone pays you USDC directly on Arc — sub-second, near-zero fees.',
    isTokenIcon: true,
  },
  {
    icon: PieChart,
    title: 'Auto-split to buckets',
    description: 'Every incoming payment is split instantly to Operating, Tax, and Savings — fully configurable percentages.',
    isTokenIcon: false,
  },
  {
    icon: CreditCard,
    title: 'Pay contractors',
    description: 'Send USDC to contractors or subscriptions directly from your Operating bucket with a single click.',
    isTokenIcon: false,
  },
  {
    icon: Zap,
    title: 'Built on Arc',
    description: 'USDC is the native gas token on Arc. No ETH needed — everything runs on stablecoins.',
    isTokenIcon: false,
  },
]

export function Landing() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-arc">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="display text-xl font-bold text-[var(--ink)]">TreasuryOS</span>
          <NetworkBadge />
        </div>
        <div className="flex items-center gap-2">
          <CircleWalletButton />
          <WalletButton />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
            <Zap size={12} />
            Arc Microgrants MVP — Hackathon Demo
          </div>

          <h1 className="display text-4xl md:text-6xl font-bold text-[var(--ink)] mb-6 text-balance leading-tight">
            TreasuryOS for Creators{' '}
            <span className="text-[var(--accent-hover)]">&amp; Small SaaS</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--muted)] mb-10 text-pretty max-w-xl mx-auto leading-relaxed">
            Run your entire treasury on Arc: receive USDC, auto-split to Operating, Tax &amp;
            Savings buckets, and pay contractors — all in one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isConnected ? (
              <button
                onClick={() => { void navigate('/dashboard') }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-white font-semibold text-base hover:bg-[var(--accent-hover)] transition-colors shadow-lg shadow-[var(--accent)]/20"
              >
                Go to Dashboard
                <ArrowRight size={18} />
              </button>
            ) : (
              <WalletButton className="px-8 py-4 rounded-2xl text-base shadow-lg" />
            )}
            <a
              href="/pay"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-[var(--border)] text-[var(--ink)] font-semibold text-base hover:bg-white transition-colors"
            >
              <TokenUSDC variant="branded" size={18} />
              Try Payment Link
            </a>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="px-4 pb-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, isTokenIcon }) => (
            <div
              key={title}
              className="p-5 rounded-2xl bg-white/80 border border-[var(--border)] backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center mb-3">
                {isTokenIcon ? (
                  <Icon variant="branded" size={22} />
                ) : (
                  <Icon size={18} className="text-[var(--accent)]" />
                )}
              </div>
              <h3 className="text-sm font-bold text-[var(--ink)] mb-1.5">{title}</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
