import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { isAddress } from 'viem'
import { toast } from 'sonner'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { useArcNetwork } from '@/context/NetworkContext'
import { useTreasury } from '@/hooks/useTreasury'
import { BucketList } from '@/components/BucketList'
import { DistributeForm } from '@/components/DistributeForm'
import { TxStatus } from '@/components/TxStatus'
import { Settings } from 'lucide-react'

interface BucketRow {
  name: string
  address: string
  percentage: string
}

const DEFAULT_ROWS: BucketRow[] = [
  { name: 'Operating', address: '', percentage: '50' },
  { name: 'Tax', address: '', percentage: '30' },
  { name: 'Savings', address: '', percentage: '20' },
]

export function Buckets() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { arcChainId } = useArcNetwork()
  const { treasuryAddress } = useTreasury()
  const [rows, setRows] = useState<BucketRow[]>(DEFAULT_ROWS)
  const [configOpen, setConfigOpen] = useState(false)

  // Use user's personal treasury address (from factory) if available,
  // else fall back to the static address from env (legacy single-user)
  const contractAddress = treasuryAddress
  const isDeployed = !!contractAddress
  const isWrongChain = chainId !== arcChainId

  const {
    writeContract: updateConfig,
    data: hash,
    isPending,
    isError,
    error,
    reset,
  } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const totalPct = rows.reduce((sum, r) => sum + (parseInt(r.percentage) || 0), 0)
  const allValid = rows.every((r) => isAddress(r.address)) && totalPct === 100

  function handleUpdate() {
    if (isWrongChain) { switchChain({ chainId: arcChainId }); return }
    if (!allValid || !address || !contractAddress) return
    const buckets = rows.map((r) => r.address as `0x${string}`)
    const percentages = rows.map((r) => BigInt(Math.round((parseInt(r.percentage) || 0) * 100)))
    updateConfig({
      address: contractAddress,
      abi: TREASURY_SPLITTER_ABI,
      functionName: 'updateBucketConfig',
      args: [buckets, percentages],
      chainId: arcChainId,
    })
  }

  if (isSuccess) {
    toast.success('Bucket config updated!')
    reset()
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="display text-2xl md:text-3xl font-bold text-[var(--ink)]">Buckets</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            View allocations and distribute incoming USDC.
          </p>
        </div>
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--ink-2)] hover:border-[var(--border-strong)] transition-colors"
        >
          <Settings size={15} />
          Edit config
        </button>
      </div>

      {/* Bucket list */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
          Bucket Balances
        </h2>
        <BucketList />
      </div>

      {/* Edit config panel */}
      {configOpen && (
        <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--ink)]">Update Bucket Configuration</h2>
          <p className="text-xs text-[var(--muted)]">
            Percentages must sum to 100%. Requires owner wallet. Basis points are used on-chain (50% = 5000 bps).
          </p>

          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_80px] gap-2 items-center">
                <span className="text-sm font-medium text-[var(--ink)] w-20">{row.name}</span>
                <input
                  type="text"
                  placeholder="0x..."
                  value={row.address}
                  onChange={(e) => {
                    const next = [...rows]
                    next[i] = { ...next[i], address: e.target.value }
                    setRows(next)
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--focus)] placeholder:text-[var(--subtle)]"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={row.percentage}
                    onChange={(e) => {
                      const next = [...rows]
                      next[i] = { ...next[i], percentage: e.target.value }
                      setRows(next)
                    }}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                  />
                  <span className="text-xs text-[var(--muted)]">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${totalPct === 100 ? 'text-green-600' : 'text-[var(--danger)]'}`}>
              Total: {totalPct}% {totalPct !== 100 && '(must be 100%)'}
            </span>
            <button
              onClick={handleUpdate}
              disabled={!allValid || !address || !isDeployed || isPending || isConfirming}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirm...' : isConfirming ? 'Updating...' : 'Update config'}
            </button>
          </div>

          <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} isError={isError} errorMessage={error?.message?.slice(0, 120)} hash={hash} />
        </div>
      )}

      {/* Distribute form */}
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6">
        <h2 className="text-base font-bold text-[var(--ink)] mb-1">Distribute USDC</h2>
        <p className="text-xs text-[var(--muted)] mb-4">
          Pull USDC from your wallet and split it to buckets per the configured percentages.
        </p>
        <DistributeForm />
      </div>
    </div>
  )
}
