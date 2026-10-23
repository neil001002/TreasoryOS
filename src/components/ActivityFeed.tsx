import { useAccount, usePublicClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { parseAbiItem } from 'viem'
import { TREASURY_SPLITTER_ADDRESS, ARC_CHAIN_ID } from '@/lib/arc'
import { formatUSDC, formatAddress, buildTxUrl } from '@/lib/utils'
import { ArrowDown, ArrowRight, ExternalLink } from 'lucide-react'
import { requireChain } from '@/onchain-facts'

interface ActivityItem {
  type: 'distributed' | 'paid'
  hash: string
  from: string
  to?: string
  amount: bigint
  blockNumber: bigint
}

export function ActivityFeed() {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID })
  // null = not yet fetched; undefined = fetch complete (empty)
  const [items, setItems] = useState<ActivityItem[] | null>(null)

  const isDeployed = !!TREASURY_SPLITTER_ADDRESS
  // Derive loading: deployed + connected but fetch not done
  const loading = isDeployed && !!address && items === null

  useEffect(() => {
    if (!isDeployed || !publicClient || !address) return

    let cancelled = false

    async function fetchLogs() {
      try {
        void requireChain(ARC_CHAIN_ID)
        const head = await publicClient!.getBlockNumber()
        // Use a bounded recent lookback — no genesis scan
        const fromBlock = head > 5000n ? head - 5000n : 0n

        const [distributed, paid] = await Promise.all([
          publicClient!.getLogs({
            address: TREASURY_SPLITTER_ADDRESS,
            event: parseAbiItem(
              'event FundsDistributed(address indexed from, uint256 totalAmount, address[] buckets, uint256[] amounts)',
            ),
            fromBlock,
            toBlock: head,
          }),
          publicClient!.getLogs({
            address: TREASURY_SPLITTER_ADDRESS,
            event: parseAbiItem(
              'event ContractorPaid(address indexed from, address indexed to, uint256 amount)',
            ),
            fromBlock,
            toBlock: head,
          }),
        ])

        if (cancelled) return

        const all: ActivityItem[] = [
          ...distributed.map((log) => ({
            type: 'distributed' as const,
            hash: log.transactionHash ?? '',
            from: log.args.from ?? '',
            amount: (log.args.totalAmount as bigint) ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
          })),
          ...paid.map((log) => ({
            type: 'paid' as const,
            hash: log.transactionHash ?? '',
            from: log.args.from ?? '',
            to: log.args.to ?? '',
            amount: (log.args.amount as bigint) ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
          })),
        ]
        all.sort((a, b) => Number(b.blockNumber - a.blockNumber))
        setItems(all.slice(0, 20))
      } catch {
        // On error, set empty so loading ends
        setItems([])
      }
    }

    void fetchLogs()
    return () => {
      cancelled = true
    }
  }, [isDeployed, publicClient, address])

  if (!isDeployed) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
        Deploy TreasurySplitter to see activity here.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-[var(--surface-muted)] rounded w-32" />
              <div className="h-3 bg-[var(--surface-muted)] rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
        No recent activity yet. Distribute USDC or pay a contractor to see events here.
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/80 border border-[var(--border)] overflow-hidden">
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item, i) => (
          <li key={`${item.hash}-${i}`} className="flex items-center gap-3 px-5 py-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                item.type === 'distributed'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-orange-50 text-orange-600'
              }`}
            >
              {item.type === 'distributed' ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] truncate">
                {item.type === 'distributed'
                  ? `Distributed from ${formatAddress(item.from)}`
                  : `Paid ${item.to ? formatAddress(item.to) : ''}`}
              </p>
              <p className="text-xs text-[var(--muted)] mono">{formatUSDC(item.amount)} USDC</p>
            </div>
            {item.hash && (
              <a
                href={buildTxUrl(item.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
