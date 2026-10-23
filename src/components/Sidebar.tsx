import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PieChart, CreditCard, Settings, X } from 'lucide-react'
import { NetworkBadge } from './NetworkBadge'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/buckets', label: 'Buckets', icon: PieChart, end: false },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="flex flex-col h-dvh bg-white/90 backdrop-blur-sm border-r border-[var(--border)] w-60 px-4 py-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="display text-lg font-bold text-[var(--ink)] leading-none">TreasuryOS</p>
          <NetworkBadge />
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-muted)] transition-colors">
            <X size={16} className="text-[var(--muted)]" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--ink-2)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--subtle)] text-center">
          Built with{' '}
          <a href="https://studio.arc.io" target="_blank" rel="noopener noreferrer" className="underline">
            Arc Studio
          </a>
        </p>
      </div>
    </aside>
  )
}
