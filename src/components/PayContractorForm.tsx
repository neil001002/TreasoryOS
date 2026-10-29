import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { isAddress } from 'viem'
import { toast } from 'sonner'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { useArcNetwork } from '@/context/NetworkContext'
import { useTreasury } from '@/hooks/useTreasury'
import { parseUSDCInput } from '@/lib/utils'
import { TxStatus } from './TxStatus'
import { UserCheck } from 'lucide-react'

export function PayContractorForm() {
  const [label, setLabel] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [history, setHistory] = useState<{ label: string; to: string; amount: string; hash: string }[]>([])

  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { arcChainId } = useArcNetwork()
  const { treasuryAddress } = useTreasury()
  const contractAddress = treasuryAddress

  const isDeployed = !!contractAddress
  const isWrongChain = chainId !== arcChainId

  const { writeContract: payContractor, data: hash, isPending, isError, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const parsedAmount = parseUSDCInput(amount)
  const validAddress = isAddress(toAddress)
  const canSubmit = !!address && validAddress && !!parsedAmount && isDeployed && !isPending && !isConfirming

  function handlePay() {
    if (isWrongChain) { switchChain({ chainId: arcChainId }); return }
    if (!canSubmit) return
    if (!contractAddress) return
    payContractor({ address: contractAddress, abi: TREASURY_SPLITTER_ABI, functionName: 'payContractor', args: [toAddress, parsedAmount], chainId: arcChainId })
  }

  if (isSuccess && hash) {
    toast.success(`Paid ${amount} USDC to ${label || toAddress.slice(0, 8)}!`)
    setHistory((prev) => [{ label, to: toAddress, amount, hash }, ...prev.slice(0, 9)])
    setLabel('')
    setToAddress('')
    setAmount('')
    reset()
  }

  return (
    <div className="space-y-4">
      {!isDeployed && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          TreasurySplitter not yet deployed on this network.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--ink-2)] mb-1.5">Label (optional)</label>
        <input type="text" placeholder="e.g. Design work June" value={label} onChange={(e) => setLabel(e.target.value)} disabled={isPending || isConfirming}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white/80 text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-50" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink-2)] mb-1.5">Contractor address</label>
        <input type="text" placeholder="0x..." value={toAddress} onChange={(e) => setToAddress(e.target.value)} disabled={isPending || isConfirming}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white/80 text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] mono text-sm disabled:opacity-50" />
        {toAddress && !validAddress && <p className="mt-1 text-xs text-[var(--danger)]">Not a valid address</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink-2)] mb-1.5">Amount (USDC)</label>
        <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" disabled={isPending || isConfirming}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white/80 text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] display text-lg tabular-nums disabled:opacity-50" />
      </div>

      <button onClick={handlePay} disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        <UserCheck size={15} />
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Sending...' : 'Pay now'}
      </button>

      <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} isError={isError} errorMessage={error?.message?.slice(0, 120)} hash={hash} />

      {history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Payment history</h4>
          <ul className="space-y-2">
            {history.map((item, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-[var(--border)] text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--ink)] truncate">{item.label || 'Payment'}</p>
                  <p className="text-xs text-[var(--muted)] mono truncate">{item.to}</p>
                </div>
                <p className="font-bold tabular-nums text-[var(--ink)]">{item.amount} USDC</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
