/**
 * SetupTreasury — onboarding screen shown when a connected wallet has no treasury yet.
 *
 * User fills in up to 5 bucket rows (name, address, %) then clicks "Deploy my treasury".
 * Calls factory.createTreasury(buckets, percentages) — deploys a TreasurySplitter owned
 * by msg.sender. After success, calls onCreated() so the parent can refetch the treasury.
 */

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { isAddress } from 'viem'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { TREASURY_FACTORY_ABI } from '@/lib/factoryAbi'
import { useArcNetwork } from '@/context/NetworkContext'

interface BucketRow {
  name: string
  address: string
  percentage: string
}

const DEFAULT_ROWS: BucketRow[] = [
  { name: 'Operating', address: '', percentage: '50' },
  { name: 'Tax',       address: '', percentage: '30' },
  { name: 'Savings',   address: '', percentage: '20' },
]

interface Props {
  onCreated: () => void
}

export function SetupTreasury({ onCreated }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { factoryAddress, arcChainId } = useArcNetwork()

  const [rows, setRows] = useState<BucketRow[]>(DEFAULT_ROWS)

  const isWrongChain = chainId !== arcChainId

  const {
    writeContract,
    data: hash,
    isPending,
    isError,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Validation
  const totalPct = rows.reduce((sum, r) => sum + (parseInt(r.percentage) || 0), 0)
  const allAddressesValid = rows.every((r) => isAddress(r.address))
  const canDeploy =
    allAddressesValid &&
    totalPct === 100 &&
    rows.length >= 2 &&
    rows.length <= 5 &&
    !!address &&
    !!factoryAddress

  function updateRow(idx: number, field: keyof BucketRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    if (rows.length >= 5) return
    setRows((prev) => [...prev, { name: `Bucket ${prev.length + 1}`, address: '', percentage: '0' }])
  }

  function removeRow(idx: number) {
    if (rows.length <= 2) return
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleDeploy() {
    if (isWrongChain) { switchChain({ chainId: arcChainId }); return }
    if (!canDeploy) return
    reset()
    writeContract({
      address: factoryAddress,
      abi: TREASURY_FACTORY_ABI,
      functionName: 'createTreasury',
      args: [
        rows.map((r) => r.address as `0x${string}`),
        rows.map((r) => BigInt(Math.round((parseInt(r.percentage) || 0) * 100))),
      ],
    })
  }

  // Fire onCreated after the tx is confirmed
  if (isSuccess) {
    toast.success('Treasury deployed! Welcome to TreasuryOS.')
    onCreated()
  }

  const pctColor = totalPct === 100 ? 'text-emerald-600' : totalPct > 100 ? 'text-red-500' : 'text-amber-500'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold mb-4">
          New Treasury
        </div>
        <h1 className="display text-3xl font-bold text-[var(--ink)] mb-2">
          Set up your treasury
        </h1>
        <p className="text-[var(--muted)] text-sm leading-relaxed">
          Configure your USDC buckets — each bucket is a wallet address that receives a slice of
          every distribution. You can update these later at any time from the Buckets page.
        </p>
      </div>

      {/* Bucket rows */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-[1fr_2fr_80px_32px] gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-1">
          <span>Name</span>
          <span>Wallet address</span>
          <span className="text-center">%</span>
          <span />
        </div>

        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_2fr_80px_32px] gap-2 items-start">
            {/* Name */}
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(idx, 'name', e.target.value)}
              placeholder="Name"
              className="w-full rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            />
            {/* Address */}
            <div>
              <input
                type="text"
                value={row.address}
                onChange={(e) => updateRow(idx, 'address', e.target.value)}
                placeholder="0x..."
                className={`w-full rounded-xl border px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 ${
                  row.address && !isAddress(row.address)
                    ? 'border-red-400 bg-red-50'
                    : 'border-[var(--border)] bg-white/80 text-[var(--ink)]'
                }`}
              />
              {row.address && !isAddress(row.address) && (
                <p className="text-xs text-red-500 mt-0.5 pl-1">Invalid address</p>
              )}
            </div>
            {/* Percentage */}
            <input
              type="number"
              min="0"
              max="100"
              value={row.percentage}
              onChange={(e) => updateRow(idx, 'percentage', e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-center text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            />
            {/* Remove */}
            <button
              onClick={() => removeRow(idx)}
              disabled={rows.length <= 2}
              className="mt-1 p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add bucket + percentage total */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={addRow}
          disabled={rows.length >= 5}
          className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add bucket
        </button>
        <div className={`text-sm font-semibold mono ${pctColor}`}>
          Total: {totalPct}% {totalPct !== 100 && `(need ${100 - totalPct > 0 ? '+' : ''}${100 - totalPct}%)`}
        </div>
      </div>

      {/* Validation summary */}
      {!canDeploy && (address || true) && (
        <ul className="mb-6 space-y-1">
          {rows.length < 2 && (
            <li className="flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Need at least 2 buckets
            </li>
          )}
          {!allAddressesValid && (
            <li className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Fix invalid wallet addresses
            </li>
          )}
          {totalPct !== 100 && (
            <li className="flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Percentages must sum to exactly 100%
            </li>
          )}
          {!factoryAddress && (
            <li className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Factory contract not configured on this network
            </li>
          )}
        </ul>
      )}

      {/* Error */}
      {isError && error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {(error as Error).message?.slice(0, 120) ?? 'Transaction failed'}
        </div>
      )}

      {/* Success */}
      {isSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Treasury deployed! Loading your dashboard...
        </div>
      )}

      {/* Deploy button */}
      <button
        onClick={handleDeploy}
        disabled={!canDeploy || isPending || isConfirming || isSuccess}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-white font-semibold py-3.5 text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isWrongChain ? (
          'Switch network'
        ) : isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet...</>
        ) : isConfirming ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Deploying treasury...</>
        ) : isSuccess ? (
          <><CheckCircle2 className="w-4 h-4" /> Deployed!</>
        ) : (
          'Deploy my treasury'
        )}
      </button>

      <p className="text-xs text-[var(--muted)] text-center mt-4 leading-relaxed">
        This deploys a personal smart contract on Arc. Gas is paid in USDC — typically less than $0.01.
        You can update your bucket config any time from the Buckets page.
      </p>
    </div>
  )
}
