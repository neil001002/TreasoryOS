/**
 * StableFXCard — "Convert to local stablecoin" UI.
 *
 * Amount input → token selector → "Get quote" → show estimate → "Swap" button.
 * swap() only fires from the explicit user click after reviewing the estimate.
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ChevronDown, ExternalLink, Loader2, CheckCircle2, RefreshCw, ArrowDown } from 'lucide-react'
import { useStableFXSwap } from '../hooks/useStableFXSwap'
import { STABLEFX_TARGET_TOKENS } from '../lib/tokens'
import { useArcNetwork } from '@/context/NetworkContext'
import { toast } from 'sonner'

export function StableFXCard() {
  const { address } = useAccount()
  const { isMainnet } = useArcNetwork()
  const { state, estimateSwap, executeSwap, reset } = useStableFXSwap()

  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState(STABLEFX_TARGET_TOKENS[0].symbol)
  const [expanded, setExpanded] = useState(false)

  const selectedTokenMeta = STABLEFX_TARGET_TOKENS.find((t) => t.symbol === selectedToken)

  const onGetQuote = async () => {
    if (!address) { toast.error('Connect your wallet first'); return }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    try {
      await estimateSwap(amount, selectedToken)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Estimation failed')
    }
  }

  const onSwap = async () => {
    try {
      await executeSwap()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Swap failed')
    }
  }

  const isEstimating = state.status === 'estimating'
  const hasReview = state.status === 'reviewed' && state.reviewed !== null

  return (
    <div className="rounded-2xl bg-white/80 border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💱</span>
          <div>
            <p className="font-semibold text-[var(--ink)]">Convert to local stablecoin</p>
            <p className="text-xs text-[var(--muted)]">Swap USDC → EURC or cirBTC on Arc</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-[var(--border)]">

          {/* Success */}
          {state.status === 'success' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Swap complete
              </div>
              {state.amountOut && (
                <p className="text-sm text-[var(--ink)]">
                  You received <strong>{state.amountOut} {selectedToken}</strong>
                </p>
              )}
              {state.txHash && state.explorerUrl && (
                <a
                  href={state.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => { reset(); setAmount('') }}
                className="flex items-center gap-1 text-sm text-[var(--muted)] underline"
              >
                <RefreshCw className="w-3 h-3" /> Swap again
              </button>
            </div>
          )}

          {/* Form: idle / estimating / reviewed / error */}
          {state.status !== 'success' && state.status !== 'swapping' && (
            <div className="mt-4 space-y-4">
              {state.errorMessage && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {state.errorMessage}
                </div>
              )}

              {/* Amount in */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  You pay
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); reset() }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 pr-16 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">
                    USDC
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-[var(--muted)]" />
              </div>

              {/* Token out selector */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  You receive
                </label>
                <div className="relative">
                  <select
                    value={selectedToken}
                    onChange={(e) => { setSelectedToken(e.target.value); reset() }}
                    className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 pr-10 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {STABLEFX_TARGET_TOKENS.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.flag} {t.label} — {t.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                </div>
              </div>

              {/* Quote result */}
              {hasReview && state.reviewed && (
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 space-y-1.5">
                  <p className="text-xs font-medium text-[var(--muted)]">Quote</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[var(--ink)]">
                      {state.reviewed.amountIn} USDC
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      ≈ {state.reviewed.estimate.estimatedOutput?.amount ?? '—'}{' '}
                      {state.reviewed.estimate.estimatedOutput?.token ?? selectedToken}
                    </span>
                  </div>
                  {state.reviewed.estimate.fees?.map((fee, i) => (
                    <p key={i} className="text-xs text-[var(--muted)]">
                      Fee: {fee.amount} {fee.token} ({fee.type})
                    </p>
                  ))}
                  <p className="text-xs text-[var(--muted)]">
                    Swap routed through Circle's swap service. Rate is indicative — 1% slippage tolerance applied.
                  </p>
                </div>
              )}

              {/* Mainnet warning */}
              {isMainnet && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                  You are on Arc Mainnet. This swap moves real USDC. Review the quote carefully before confirming.
                </div>
              )}

              {/* Buttons */}
              {!hasReview ? (
                <button
                  type="button"
                  onClick={() => void onGetQuote()}
                  disabled={!address || !amount || Number(amount) <= 0 || isEstimating}
                  className="w-full rounded-xl bg-[var(--accent)] text-white py-3 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {isEstimating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEstimating ? 'Getting quote…' : 'Get quote'}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { reset(); }}
                    className="flex-1 rounded-xl border border-[var(--border)] text-[var(--ink)] py-3 text-sm font-medium hover:bg-[var(--surface)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSwap()}
                    className="flex-1 rounded-xl bg-[var(--accent)] text-white py-3 text-sm font-semibold hover:opacity-90 transition"
                  >
                    Swap {amount} USDC → {selectedTokenMeta?.label ?? selectedToken}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Swapping spinner */}
          {state.status === 'swapping' && (
            <div className="mt-4 flex flex-col items-center gap-3 py-6 text-[var(--muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
              <p className="text-sm">Swap in progress…</p>
              <p className="text-xs">Please confirm in your wallet and wait for the transaction.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
