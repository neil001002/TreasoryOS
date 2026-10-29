/**
 * StableFXCard — bidirectional stablecoin conversion UI.
 *
 * Any token → any other token (USDC ↔ EURC, USDC ↔ cirBTC, EURC ↔ cirBTC).
 * Arrow button flips the pair. Quote → review → Swap.
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ChevronDown, ExternalLink, Loader2, CheckCircle2, RefreshCw, ArrowUpDown } from 'lucide-react'
import { useStableFXSwap } from '../hooks/useStableFXSwap'
import { SWAP_TOKENS, isSameToken, isNoOpSwap } from '../lib/tokens'
import { useArcNetwork } from '@/context/NetworkContext'
import { toast } from 'sonner'

export function StableFXCard() {
  const { address } = useAccount()
  const { isMainnet } = useArcNetwork()
  const { state, estimateSwap, executeSwap, reset } = useStableFXSwap()

  const [amount, setAmount] = useState('')
  const [tokenIn, setTokenIn] = useState('USDC')
  const [tokenOut, setTokenOut] = useState('EURC')
  const [expanded, setExpanded] = useState(false)

  const tokenInMeta = SWAP_TOKENS.find((t) => t.symbol === tokenIn)
  const tokenOutMeta = SWAP_TOKENS.find((t) => t.symbol === tokenOut)

  // Available targets exclude the current source (and NATIVE which is USDC on Arc)
  const tokensForOut = SWAP_TOKENS.filter((t) => t.symbol !== tokenIn && !isNoOpSwap(tokenIn, t.symbol))
  const tokensForIn  = SWAP_TOKENS.filter((t) => t.symbol !== tokenOut && !isNoOpSwap(t.symbol, tokenOut))

  function handleFlip() {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    reset()
  }

  function handleSetTokenIn(sym: string) {
    setTokenIn(sym)
    // If out would become the same or a no-op, pick the first valid alternative
    if (isSameToken(sym, tokenOut) || isNoOpSwap(sym, tokenOut)) {
      const alt = SWAP_TOKENS.find((t) => t.symbol !== sym && !isNoOpSwap(sym, t.symbol))
      if (alt) setTokenOut(alt.symbol)
    }
    reset()
  }

  function handleSetTokenOut(sym: string) {
    setTokenOut(sym)
    if (isSameToken(tokenIn, sym) || isNoOpSwap(tokenIn, sym)) {
      const alt = SWAP_TOKENS.find((t) => t.symbol !== sym && !isNoOpSwap(t.symbol, sym))
      if (alt) setTokenIn(alt.symbol)
    }
    reset()
  }

  const onGetQuote = async () => {
    if (!address) { toast.error('Connect your wallet first'); return }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    try {
      await estimateSwap(amount, tokenIn, tokenOut)
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
            <p className="font-semibold text-[var(--ink)]">Convert stablecoins</p>
            <p className="text-xs text-[var(--muted)]">Swap USDC, EURC, or cirBTC in any direction</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-[var(--border)]">

          {/* ── Success ── */}
          {state.status === 'success' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Swap complete
              </div>
              {state.amountOut && (
                <p className="text-sm text-[var(--ink)]">
                  You received <strong>{state.amountOut} {tokenOut}</strong>
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

          {/* ── Form: idle / estimating / reviewed / error ── */}
          {state.status !== 'success' && state.status !== 'swapping' && (
            <div className="mt-4 space-y-3">
              {state.errorMessage && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {state.errorMessage}
                </div>
              )}

              {/* ── You pay ── */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">You pay</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); reset() }}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <div className="relative">
                    <select
                      value={tokenIn}
                      onChange={(e) => handleSetTokenIn(e.target.value)}
                      className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-3 pr-8 py-2.5 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
                    >
                      {tokensForIn.concat(tokenInMeta ? [tokenInMeta] : [])
                        .filter((t, i, arr) => arr.findIndex(x => x.symbol === t.symbol) === i)
                        .map((t) => (
                          <option key={t.symbol} value={t.symbol}>
                            {t.flag} {t.label}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
                  </div>
                </div>
              </div>

              {/* ── Flip button ── */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleFlip}
                  title="Flip direction"
                  className="w-8 h-8 rounded-full border border-[var(--border)] bg-white flex items-center justify-center hover:bg-[var(--surface)] transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-[var(--muted)]" />
                </button>
              </div>

              {/* ── You receive ── */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">You receive</label>
                <div className="relative">
                  <select
                    value={tokenOut}
                    onChange={(e) => handleSetTokenOut(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {tokensForOut.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.flag} {t.label} — {t.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                </div>
              </div>

              {/* ── Quote result ── */}
              {hasReview && state.reviewed && (
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 space-y-1.5">
                  <p className="text-xs font-medium text-[var(--muted)]">Quote</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[var(--ink)]">
                      {state.reviewed.amountIn} {state.reviewed.tokenIn}
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      ≈ {state.reviewed.estimate.estimatedOutput?.amount ?? '—'}{' '}
                      {state.reviewed.estimate.estimatedOutput?.token ?? tokenOut}
                    </span>
                  </div>
                  {state.reviewed.estimate.fees?.map((fee, i) => (
                    <p key={i} className="text-xs text-[var(--muted)]">
                      Fee: {fee.amount} {fee.token} ({fee.type})
                    </p>
                  ))}
                  <p className="text-xs text-[var(--muted)]">
                    Routed via Circle's swap service. 1% slippage tolerance applied.
                  </p>
                </div>
              )}

              {/* ── Mainnet warning ── */}
              {isMainnet && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                  You are on Arc Mainnet. This swap moves real funds. Review the quote carefully before confirming.
                </div>
              )}

              {/* ── Action buttons ── */}
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
                    onClick={() => reset()}
                    className="flex-1 rounded-xl border border-[var(--border)] text-[var(--ink)] py-3 text-sm font-medium hover:bg-[var(--surface)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSwap()}
                    className="flex-1 rounded-xl bg-[var(--accent)] text-white py-3 text-sm font-semibold hover:opacity-90 transition"
                  >
                    Swap {amount} {tokenInMeta?.label} → {tokenOutMeta?.label}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Swapping spinner ── */}
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
