import { useSearchParams } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { useState } from 'react'
import { WalletButton } from '@/components/WalletButton'
import { TxStatus } from '@/components/TxStatus'
import { NetworkBadge } from '@/components/NetworkBadge'
import { USDC_ADDRESS, ARC_CHAIN_ID, EXPLORER_BASE } from '@/lib/arc'
import { parseUSDCInput, formatAddress, buildTxUrl } from '@/lib/utils'
import { TokenUSDC } from '@web3icons/react'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PayLink() {
  const [searchParams] = useSearchParams()
  const to = searchParams.get('to') ?? ''
  const amountParam = searchParams.get('amount') ?? ''
  const [customAmount, setCustomAmount] = useState(amountParam)

  const { chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID
  const validTo = isAddress(to)
  const parsedAmount = parseUSDCInput(customAmount)

  const { writeContract, data: hash, isPending, isError, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function handlePay() {
    if (isWrongChain) { switchChain({ chainId: ARC_CHAIN_ID }); return }
    if (!parsedAmount || !validTo) return
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, parsedAmount],
      chainId: ARC_CHAIN_ID,
    })
  }

  if (!validTo) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-arc">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-[var(--muted)]">This payment link is missing a valid recipient address.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline">
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-arc">
      <div className="w-full max-w-sm space-y-5">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
          <ArrowLeft size={14} />
          Back
        </Link>

        {/* Card */}
        <div className="rounded-3xl bg-white/90 border border-[var(--border)] p-6 shadow-xl shadow-black/5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="display text-xl font-bold text-[var(--ink)]">Pay via Arc</h1>
            <NetworkBadge />
          </div>

          {/* Recipient */}
          <div className="p-4 rounded-xl bg-[var(--surface-muted)] space-y-1">
            <p className="text-xs text-[var(--muted)] font-medium">Paying to</p>
            <a
              href={`${EXPLORER_BASE}/address/${to}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] mono hover:text-[var(--accent)] transition-colors"
            >
              {formatAddress(to)}
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink-2)] mb-1.5">Amount (USDC)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <TokenUSDC variant="branded" size={20} />
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="0"
                step="0.01"
                disabled={isPending || isConfirming || isSuccess}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-white text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] display text-xl tabular-nums disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {['10', '25', '50', '100'].map((v) => (
              <button
                key={v}
                onClick={() => setCustomAmount(v)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                ${v}
              </button>
            ))}
          </div>

          {/* CTA */}
          {!isConnected ? (
            <WalletButton className="w-full justify-center py-3 rounded-xl text-base" />
          ) : isSuccess ? (
            <div className="space-y-2">
              <TxStatus isSuccess hash={hash} />
              {hash && (
                <a
                  href={buildTxUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
                >
                  View on explorer
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={!parsedAmount || isPending || isConfirming || !!isError}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-base hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <TokenUSDC variant="mono" size={18} />
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Sending...' : `Pay ${customAmount || '0'} USDC`}
            </button>
          )}

          <TxStatus
            isPending={isPending}
            isConfirming={isConfirming}
            isError={isError}
            errorMessage={error?.message?.slice(0, 120)}
          />
        </div>

        <p className="text-center text-xs text-[var(--subtle)]">
          Powered by <a href="https://studio.arc.io" className="underline" target="_blank" rel="noopener noreferrer">Arc Studio</a>
        </p>
      </div>
    </div>
  )
}
