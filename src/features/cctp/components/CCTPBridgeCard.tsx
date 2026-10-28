/**
 * CCTPBridgeCard — "Add funds from another chain" UI.
 *
 * Source chain dropdown → amount input → Bridge to Arc button.
 * Shows a step-by-step progress display: approve → burn → attest → mint.
 * Each step shows its tx hash + explorer link when available.
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ArrowRight, ChevronDown, ExternalLink, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { useCCTPBridge, type BridgeStep } from '../hooks/useCCTPBridge'
import { getSourceChains } from '../lib/chains'
import { useArcNetwork } from '@/context/NetworkContext'
import { toast } from 'sonner'

const STEP_LABELS: Record<string, string> = {
  approve: 'Approve USDC spend',
  burn: 'Burn on source chain',
  fetchAttestation: 'Circle attestation',
  mint: 'Mint on Arc',
}

function StepRow({ step }: { step: BridgeStep }) {
  const label = STEP_LABELS[step.name] ?? step.name
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 flex-shrink-0">
        {step.state === 'idle' && <Circle className="w-4 h-4 text-[var(--muted)]" />}
        {step.state === 'pending' && <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />}
        {step.state === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {step.state === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
      </span>
      <span className={`text-sm flex-1 ${step.state === 'idle' ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}>
        {label}
      </span>
      {step.txHash && step.explorerUrl && (
        <a
          href={step.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
        >
          {step.txHash.slice(0, 8)}…
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}

export function CCTPBridgeCard() {
  const { address } = useAccount()
  const { isMainnet, explorerBase } = useArcNetwork()
  const { state, handleBridge, reset } = useCCTPBridge()

  const sourceChains = getSourceChains(isMainnet)
  const [selectedChainIdx, setSelectedChainIdx] = useState(0)
  const [amount, setAmount] = useState('')
  const [expanded, setExpanded] = useState(false)

  const selectedChain = sourceChains[selectedChainIdx]

  const onBridge = async () => {
    if (!address) {
      toast.error('Connect your wallet first')
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      await handleBridge(selectedChain, amount, address)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bridge failed')
    }
  }


  return (
    <div className="rounded-2xl bg-white/80 border border-[var(--border)] overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌉</span>
          <div>
            <p className="font-semibold text-[var(--ink)]">Add funds from another chain</p>
            <p className="text-xs text-[var(--muted)]">Bridge USDC to Arc via Circle CCTP</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-[var(--border)]">
          {/* Success state */}
          {state.status === 'success' && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                USDC bridged to Arc successfully
              </div>
              {state.finalTxHash && (
                <a
                  href={`${explorerBase}/tx/${state.finalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                >
                  View mint tx on Arc explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => { reset(); setAmount('') }}
                className="text-sm text-[var(--muted)] underline"
              >
                Bridge more
              </button>
            </div>
          )}

          {/* Idle / error form */}
          {(state.status === 'idle' || state.status === 'error') && (
            <div className="mt-4 space-y-4">
              {state.errorMessage && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {state.errorMessage}
                </div>
              )}

              {/* Source chain selector */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Source chain
                </label>
                <div className="relative">
                  <select
                    value={selectedChainIdx}
                    onChange={(e) => setSelectedChainIdx(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 pr-10 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {sourceChains.map((chain, i) => (
                      <option key={chain.circleId} value={i}>
                        {chain.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 pr-16 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--muted)]">
                    USDC
                  </span>
                </div>
              </div>

              {/* Destination hint */}
              <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                Destination: Arc {isMainnet ? 'Mainnet' : 'Testnet'} · your wallet
              </div>

              {/* Mainnet warning */}
              {isMainnet && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                  You are on Arc Mainnet. This bridge moves real USDC. Verify the amount before proceeding.
                </div>
              )}

              <button
                type="button"
                onClick={() => void onBridge()}
                disabled={!address || !amount || Number(amount) <= 0}
                className="w-full rounded-xl bg-[var(--accent)] text-white py-3 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition"
              >
                Bridge to Arc
              </button>
            </div>
          )}

          {/* In-progress steps */}
          {state.status === 'bridging' && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-[var(--muted)] mb-3">Bridge progress</p>
              <div className="divide-y divide-[var(--border)]">
                {state.steps.map((step) => (
                  <StepRow key={step.name} step={step} />
                ))}
              </div>
              <p className="text-xs text-[var(--muted)] pt-2">
                Fast mode — typically completes in 20–60 seconds.
              </p>
            </div>
          )}

          {/* Also show steps when bridging is done (error or success) */}
          {(state.status === 'error' && state.steps.some((s) => s.state !== 'idle')) && (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {state.steps.map((step) => (
                <StepRow key={step.name} step={step} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
