import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { useArcNetwork } from '@/context/NetworkContext'
import { formatUSDC } from '@/lib/utils'
import { TokenUSDC } from '@web3icons/react'

interface BalanceCardProps {
  label: string
  address?: `0x${string}`
  className?: string
}

export function BalanceCard({ label, address, className = '' }: BalanceCardProps) {
  const { address: connectedAddress } = useAccount()
  const { usdcAddress, arcChainId } = useArcNetwork()
  const target = address ?? connectedAddress

  const { data: balance, isLoading } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: target ? [target] : undefined,
    chainId: arcChainId,
    query: { enabled: !!target },
  })

  const formatted = balance !== undefined ? formatUSDC(balance) : '—'

  return (
    <div className={`rounded-2xl bg-white/80 border border-[var(--border)] p-5 backdrop-blur-sm ${className}`}>
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <TokenUSDC variant="branded" size={28} />
        <span className="display text-3xl font-bold text-[var(--ink)] tabular-nums leading-none">
          {isLoading ? (
            <span className="inline-block w-24 h-7 bg-[var(--surface-muted)] rounded animate-pulse" />
          ) : (
            formatted
          )}
        </span>
        <span className="text-sm text-[var(--muted)] font-medium mb-0.5">USDC</span>
      </div>
    </div>
  )
}

export function ContractBalanceCard() {
  const { usdcAddress, arcChainId, contractAddress } = useArcNetwork()
  const isDeployed = !!contractAddress

  const { data: balance, isLoading } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: contractAddress ? [contractAddress] : undefined,
    chainId: arcChainId,
    query: { enabled: isDeployed },
  })

  const formatted = balance !== undefined ? formatUSDC(balance) : '—'

  return (
    <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-5 backdrop-blur-sm">
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Contract (Contractor Pool)</p>
      <div className="flex items-end gap-2">
        <TokenUSDC variant="branded" size={28} />
        <span className="display text-3xl font-bold text-[var(--ink)] tabular-nums leading-none">
          {!isDeployed ? (
            <span className="text-base text-[var(--muted)] font-normal">Not deployed</span>
          ) : isLoading ? (
            <span className="inline-block w-24 h-7 bg-[var(--surface-muted)] rounded animate-pulse" />
          ) : (
            formatted
          )}
        </span>
        {isDeployed && <span className="text-sm text-[var(--muted)] font-medium mb-0.5">USDC</span>}
      </div>
    </div>
  )
}
