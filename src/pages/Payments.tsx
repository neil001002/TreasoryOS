import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { toast } from 'sonner'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { useArcNetwork } from '@/context/NetworkContext'
import { ContractBalanceCard } from '@/components/BalanceCard'
import { PayContractorForm } from '@/components/PayContractorForm'
import { TxStatus } from '@/components/TxStatus'
import { parseUSDCInput } from '@/lib/utils'
import { Plus } from 'lucide-react'

export function Payments() {
  const [depositAmount, setDepositAmount] = useState('')
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { contractAddress, usdcAddress, arcChainId } = useArcNetwork()

  const isDeployed = !!contractAddress
  const isWrongChain = chainId !== arcChainId

  const { writeContract: approve, data: approveHash, isPending: approving } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const {
    writeContract: deposit,
    data: depositHash,
    isPending: depositing,
    isError: depositError,
    error: depositErr,
    reset,
  } = useWriteContract()
  const { isLoading: depositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash })

  const parsedDeposit = parseUSDCInput(depositAmount)

  function handleApprove() {
    if (isWrongChain) { switchChain({ chainId: arcChainId }); return }
    if (!parsedDeposit) return
    approve({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [contractAddress, parsedDeposit],
      chainId: arcChainId,
    })
  }

  function handleDeposit() {
    if (!parsedDeposit) return
    deposit({
      address: contractAddress,
      abi: TREASURY_SPLITTER_ABI,
      functionName: 'depositForContractors',
      args: [parsedDeposit],
      chainId: arcChainId,
    })
  }

  if (depositSuccess) {
    toast.success(`Deposited ${depositAmount} USDC for contractors!`)
    setDepositAmount('')
    reset()
  }

  const isPending = approving || approveConfirming || depositing || depositConfirming

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="display text-2xl md:text-3xl font-bold text-[var(--ink)]">Payments</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Fund the contractor pool and pay out USDC.
        </p>
      </div>

      {/* Contract balance */}
      <ContractBalanceCard />

      {/* Deposit for contractors */}
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Plus size={15} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">Fund Contractor Pool</h2>
            <p className="text-xs text-[var(--muted)]">Deposit USDC into the contract to fund future contractor payments.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink-2)] mb-1.5">Amount (USDC)</label>
          <input
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min="0"
            step="0.01"
            disabled={isPending || !address}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white/80 text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] display text-lg tabular-nums disabled:opacity-50"
          />
        </div>

        {!approveSuccess ? (
          <button
            onClick={handleApprove}
            disabled={isPending || !address || !parsedDeposit || !isDeployed}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {approving ? 'Confirm approval...' : approveConfirming ? 'Approving...' : 'Approve USDC'}
          </button>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isPending || !parsedDeposit}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--success)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {depositing ? 'Confirm in wallet...' : depositConfirming ? 'Depositing...' : 'Deposit to contract'}
          </button>
        )}

        <TxStatus
          isPending={approving || depositing}
          isConfirming={approveConfirming || depositConfirming}
          isSuccess={depositSuccess}
          isError={depositError}
          errorMessage={depositErr?.message?.slice(0, 120)}
          hash={depositHash ?? approveHash}
        />
      </div>

      {/* Pay contractor */}
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6">
        <h2 className="text-base font-bold text-[var(--ink)] mb-1">Pay Contractor</h2>
        <p className="text-xs text-[var(--muted)] mb-4">
          Sends USDC from the contract balance to a contractor address. Only the contract owner can do this.
        </p>
        <PayContractorForm />
      </div>
    </div>
  )
}
