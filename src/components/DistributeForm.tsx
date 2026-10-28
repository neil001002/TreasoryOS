import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { toast } from 'sonner'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { useArcNetwork } from '@/context/NetworkContext'
import { parseUSDCInput } from '@/lib/utils'
import { TxStatus } from './TxStatus'
import { Send } from 'lucide-react'

export function DistributeForm() {
  const [amount, setAmount] = useState('')
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { contractAddress, usdcAddress, arcChainId } = useArcNetwork()

  const isDeployed = !!contractAddress
  const isWrongChain = chainId !== arcChainId

  const { writeContract: approve, data: approveHash, isPending: approving } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const { writeContract: distribute, data: distributeHash, isPending: distributing, isError: distributeError, error: distributeErr } = useWriteContract()
  const { isLoading: distributeConfirming, isSuccess: distributeSuccess } = useWaitForTransactionReceipt({ hash: distributeHash })

  const parsedAmount = parseUSDCInput(amount)

  function handleApprove() {
    if (isWrongChain) { switchChain({ chainId: arcChainId }); return }
    if (!parsedAmount || parsedAmount === 0n) return
    approve({ address: usdcAddress, abi: erc20Abi, functionName: 'approve', args: [contractAddress, parsedAmount], chainId: arcChainId })
  }

  function handleDistribute() {
    if (!parsedAmount || parsedAmount === 0n) return
    distribute({ address: contractAddress, abi: TREASURY_SPLITTER_ABI, functionName: 'distribute', args: [parsedAmount], chainId: arcChainId })
  }

  if (distributeSuccess) toast.success(`Distributed ${amount} USDC to buckets!`)

  const isPending = approving || approveConfirming || distributing || distributeConfirming

  return (
    <div className="space-y-4">
      {!isDeployed && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          TreasurySplitter not yet deployed on this network.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--ink-2)] mb-1.5">Amount (USDC)</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          disabled={isPending || !address}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white/80 text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] display text-lg tabular-nums disabled:opacity-50"
        />
      </div>

      {!approveSuccess ? (
        <button
          onClick={handleApprove}
          disabled={isPending || !address || !parsedAmount || !isDeployed}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          {approving ? 'Confirm approval...' : approveConfirming ? 'Approving...' : 'Approve USDC'}
        </button>
      ) : (
        <button
          onClick={handleDistribute}
          disabled={isPending || !parsedAmount}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--success)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          {distributing ? 'Confirm in wallet...' : distributeConfirming ? 'Distributing...' : 'Distribute to Buckets'}
        </button>
      )}

      <TxStatus
        isPending={approving || distributing}
        isConfirming={approveConfirming || distributeConfirming}
        isSuccess={distributeSuccess}
        isError={distributeError}
        errorMessage={distributeErr?.message?.slice(0, 120)}
        hash={distributeHash ?? approveHash}
      />
    </div>
  )
}
