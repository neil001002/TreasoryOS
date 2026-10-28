import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { useArcNetwork } from '@/context/NetworkContext'
import { formatUSDC, formatAddress, buildAddressUrl, BUCKET_NAMES, BUCKET_BG } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

export function BucketList() {
  const { contractAddress, usdcAddress, arcChainId, explorerBase } = useArcNetwork()
  const isDeployed = !!contractAddress

  const { data: bucketsData, isLoading } = useReadContract({
    address: contractAddress,
    abi: TREASURY_SPLITTER_ABI,
    functionName: 'getBuckets',
    chainId: arcChainId,
    query: { enabled: isDeployed },
  })

  const bucketAddresses = (bucketsData?.[0] ?? []) as `0x${string}`[]
  const bucketPercentages = (bucketsData?.[1] ?? []) as bigint[]

  const b0 = useReadContract({ address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: bucketAddresses[0] ? [bucketAddresses[0]] : undefined, chainId: arcChainId, query: { enabled: !!bucketAddresses[0] } })
  const b1 = useReadContract({ address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: bucketAddresses[1] ? [bucketAddresses[1]] : undefined, chainId: arcChainId, query: { enabled: !!bucketAddresses[1] } })
  const b2 = useReadContract({ address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: bucketAddresses[2] ? [bucketAddresses[2]] : undefined, chainId: arcChainId, query: { enabled: !!bucketAddresses[2] } })
  const b3 = useReadContract({ address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: bucketAddresses[3] ? [bucketAddresses[3]] : undefined, chainId: arcChainId, query: { enabled: !!bucketAddresses[3] } })
  const b4 = useReadContract({ address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: bucketAddresses[4] ? [bucketAddresses[4]] : undefined, chainId: arcChainId, query: { enabled: !!bucketAddresses[4] } })
  const balances = [b0.data, b1.data, b2.data, b3.data, b4.data]

  if (!isDeployed) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
        Deploy TreasurySplitter first, then configure your buckets here.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/60 border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (bucketAddresses.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
        No buckets configured yet. Update bucket config to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bucketAddresses.map((addr, i) => {
        const name = BUCKET_NAMES[i] ?? `Bucket ${i + 1}`
        const pct = bucketPercentages[i] ? Number(bucketPercentages[i]) / 100 : 0
        const bal = balances[i]
        const colorClass = BUCKET_BG[name] ?? 'bg-gray-50 text-gray-700'

        return (
          <div key={addr} className="flex items-center gap-4 p-5 rounded-2xl bg-white/80 border border-[var(--border)]">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
              {pct.toFixed(0)}%
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">{name}</p>
              <a
                href={buildAddressUrl(addr, explorerBase)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--muted)] mono hover:text-[var(--accent)] transition-colors"
              >
                {formatAddress(addr)}
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums text-[var(--ink)]">
                {bal !== undefined ? formatUSDC(bal) : '—'} USDC
              </p>
              <p className="text-xs text-[var(--muted)]">balance</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
