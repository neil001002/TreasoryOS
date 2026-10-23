/**
 * CircleWalletButton
 * Lets users connect with a Circle Smart Account (passkey / WebAuthn).
 * Shows a small modal with Register / Login tabs.
 */
import { useState, useRef, useEffect } from 'react'
import { Fingerprint, X, LogOut, ChevronDown, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { circleWalletConfigured, registerCircleWallet, loginCircleWallet } from '@/lib/circleWallet'
import { useCircleWallet } from '@/context/CircleWalletContext'
import { cn } from '@/lib/utils'
import { formatAddress } from '@/lib/utils'

type Tab = 'register' | 'login'

export function CircleWalletButton({ className }: { className?: string }) {
  const { address, isConnected, connect, disconnect } = useCircleWallet()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  if (!circleWalletConfigured) return null

  async function handleSubmit() {
    setLoading(true)
    try {
      const result =
        tab === 'register'
          ? await registerCircleWallet(username.trim() || 'user')
          : await loginCircleWallet()
      connect(result.address, result.credential)
      setOpen(false)
      toast.success(`Circle Wallet connected: ${formatAddress(result.address)}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (isConnected && address) {
    return (
      <div className="relative" ref={modalRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-400',
            className,
          )}
        >
          <Fingerprint size={15} />
          {formatAddress(address)}
          <ChevronDown size={13} className="text-indigo-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl bg-white border border-[var(--border)] shadow-xl p-3">
            <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              Circle Smart Account
            </p>
            <p className="mono text-xs text-[var(--ink)] truncate mb-3">{address}</p>
            <button
              onClick={() => { disconnect(); setOpen(false); toast.success('Circle Wallet disconnected') }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={modalRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
          'bg-indigo-600 text-white hover:bg-indigo-700',
          className,
        )}
      >
        <Fingerprint size={15} />
        Circle Wallet
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white border border-[var(--border)] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Fingerprint size={16} className="text-indigo-600" />
              <p className="text-sm font-bold text-[var(--ink)]">Circle Smart Account</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-muted)] transition-colors">
              <X size={14} className="text-[var(--muted)]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
                  tab === t
                    ? 'text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]',
                )}
              >
                {t === 'login' ? 'Sign In' : 'Create New'}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {tab === 'login'
                ? 'Use your passkey (Face ID, Touch ID, or security key) to sign in to your existing Circle Smart Account.'
                : 'Create a new Circle Smart Account secured by your passkey — no seed phrase, no private key.'}
            </p>

            {tab === 'register' && (
              <input
                type="text"
                placeholder="Username (optional)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm bg-white text-[var(--ink)] placeholder-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            )}

            <button
              onClick={() => void handleSubmit()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <Loader size={15} className="animate-spin" />
              ) : (
                <Fingerprint size={15} />
              )}
              {loading
                ? 'Waiting for passkey…'
                : tab === 'login'
                ? 'Sign in with Passkey'
                : 'Create with Passkey'}
            </button>

            <p className="text-[10px] text-[var(--subtle)] text-center">
              Powered by{' '}
              <a href="https://developers.circle.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--muted)]">
                Circle Modular Wallets
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
