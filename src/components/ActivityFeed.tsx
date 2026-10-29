import { useAccount, usePublicClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { parseAbiItem } from 'viem'
import { useArcNetwork } from '@/context/NetworkContext'
import { useTreasury } from '@/hooks/useTreasury'
import { formatAddress, buildTxUrl } from '@/lib/utils'
import { ArrowDown, ArrowRight, ArrowLeftRight, Repeat2, ExternalLink, Filter } from 'lucide-react'

// Token decimals
const USDC_DEC  = 6
const EURC_DEC  = 6
const CIRBTC_DEC = 8

const EURC_TESTNET   = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`
const EURC_MAINNET   = '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1' as `0x${string}`
const CIRBTC_MAINNET = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9' as `0x${string}`

type ActivityType = 'distribute' | 'pay' | 'transfer_in' | 'transfer_out' | 'swap' | 'bridge'

interface ActivityItem {
  type: ActivityType
  hash: string
  from: string
  to?: string
  amount: bigint
  decimals: number
  symbol: string
  blockNumber: bigint
  label?: string
}

interface FetchResult {
  key: string
  items: ActivityItem[]
}

function formatAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const frac = (amount % divisor).toString().padStart(decimals, '0').slice(0, 2)
  return `${whole.toLocaleString()}.${frac}`
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; label: (item: ActivityItem) => string; dotColor: string; bgColor: string }> = {
  distribute:    { icon: <ArrowDown size={13} />,        dotColor: 'text-blue-600',   bgColor: 'bg-blue-50',   label: (i) => `Distributed from ${formatAddress(i.from)}` },
  pay:           { icon: <ArrowRight size={13} />,       dotColor: 'text-orange-600', bgColor: 'bg-orange-50', label: (i) => `Paid ${i.to ? formatAddress(i.to) : ''}` },
  transfer_in:   { icon: <ArrowDown size={13} />,        dotColor: 'text-green-600',  bgColor: 'bg-green-50',  label: (i) => `Received ${i.symbol} from ${formatAddress(i.from)}` },
  transfer_out:  { icon: <ArrowRight size={13} />,       dotColor: 'text-rose-600',   bgColor: 'bg-rose-50',   label: (i) => `Sent ${i.symbol} to ${i.to ? formatAddress(i.to) : ''}` },
  swap:          { icon: <Repeat2 size={13} />,          dotColor: 'text-violet-600', bgColor: 'bg-violet-50', label: (i) => i.label ?? `Swapped ${i.symbol}` },
  bridge:        { icon: <ArrowLeftRight size={13} />,   dotColor: 'text-teal-600',   bgColor: 'bg-teal-50',   label: (i) => i.label ?? `Bridged ${i.symbol}` },
}

const ALL_FILTERS: { id: ActivityType | 'all'; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'distribute',   label: 'Distribute' },
  { id: 'pay',          label: 'Pay' },
  { id: 'transfer_in',  label: 'Received' },
  { id: 'transfer_out', label: 'Sent' },
  { id: 'swap',         label: 'Swap' },
  { id: 'bridge',       label: 'Bridge' },
]

export function ActivityFeed() {
  const { address } = useAccount()
  const { arcChainId, explorerBase, usdcAddress } = useArcNetwork()
  const { treasuryAddress } = useTreasury()
  const contractAddress = treasuryAddress
  const publicClient = usePublicClient({ chainId: arcChainId })

  const [result, setResult] = useState<FetchResult | null>(null)
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all')

  const isMainnet = arcChainId === 5042
  const eurcAddress = isMainnet ? EURC_MAINNET : EURC_TESTNET

  const isDeployed = !!contractAddress
  const fetchKey = `${address}-${contractAddress}-${arcChainId}`
  const loading = !!address && (result === null || result.key !== fetchKey)

  useEffect(() => {
    if (!publicClient || !address) return
    let cancelled = false

    async function fetchLogs() {
      try {
        const head = await publicClient!.getBlockNumber()
        const fromBlock = head > 5000n ? head - 5000n : 0n
        const addr = address!

        // Parallelise all log fetches
        const fetches: Promise<ActivityItem[]>[] = []

        // 1. Treasury: FundsDistributed
        if (contractAddress) {
          const cAddr = contractAddress
          fetches.push(
            publicClient!.getLogs({
              address: cAddr,
              event: parseAbiItem('event FundsDistributed(address indexed from, uint256 totalAmount, address[] buckets, uint256[] amounts)'),
              fromBlock, toBlock: head,
            }).then((logs) =>
              logs.map((log) => ({
                type: 'distribute' as const,
                hash: log.transactionHash ?? '',
                from: log.args.from ?? '',
                amount: (log.args.totalAmount as bigint) ?? 0n,
                decimals: USDC_DEC,
                symbol: 'USDC',
                blockNumber: log.blockNumber ?? 0n,
              }))
            )
          )

          // 2. Treasury: ContractorPaid
          fetches.push(
            publicClient!.getLogs({
              address: cAddr,
              event: parseAbiItem('event ContractorPaid(address indexed from, address indexed to, uint256 amount)'),
              fromBlock, toBlock: head,
            }).then((logs) =>
              logs.map((log) => ({
                type: 'pay' as const,
                hash: log.transactionHash ?? '',
                from: log.args.from ?? '',
                to: log.args.to ?? '',
                amount: (log.args.amount as bigint) ?? 0n,
                decimals: USDC_DEC,
                symbol: 'USDC',
                blockNumber: log.blockNumber ?? 0n,
              }))
            )
          )
        }

        // 3. USDC transfers TO wallet
        fetches.push(
          publicClient!.getLogs({
            address: usdcAddress,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { to: addr },
            fromBlock, toBlock: head,
          }).then((logs) =>
            logs
              .filter((log) => log.args.from?.toLowerCase() !== contractAddress?.toLowerCase())
              .map((log) => ({
                type: 'transfer_in' as const,
                hash: log.transactionHash ?? '',
                from: log.args.from ?? '',
                to: addr,
                amount: (log.args.value as bigint) ?? 0n,
                decimals: USDC_DEC,
                symbol: 'USDC',
                blockNumber: log.blockNumber ?? 0n,
              }))
          )
        )

        // 4. USDC transfers FROM wallet
        fetches.push(
          publicClient!.getLogs({
            address: usdcAddress,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { from: addr },
            fromBlock, toBlock: head,
          }).then((logs) =>
            logs
              .filter((log) => log.args.to?.toLowerCase() !== contractAddress?.toLowerCase())
              .map((log) => ({
                type: 'transfer_out' as const,
                hash: log.transactionHash ?? '',
                from: addr,
                to: log.args.to ?? '',
                amount: (log.args.value as bigint) ?? 0n,
                decimals: USDC_DEC,
                symbol: 'USDC',
                blockNumber: log.blockNumber ?? 0n,
              }))
          )
        )

        // 5. EURC transfers TO wallet
        fetches.push(
          publicClient!.getLogs({
            address: eurcAddress,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { to: addr },
            fromBlock, toBlock: head,
          }).then((logs) =>
            logs.map((log) => ({
              type: 'transfer_in' as const,
              hash: log.transactionHash ?? '',
              from: log.args.from ?? '',
              to: addr,
              amount: (log.args.value as bigint) ?? 0n,
              decimals: EURC_DEC,
              symbol: 'EURC',
              blockNumber: log.blockNumber ?? 0n,
            }))
          )
        )

        // 6. EURC transfers FROM wallet
        fetches.push(
          publicClient!.getLogs({
            address: eurcAddress,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { from: addr },
            fromBlock, toBlock: head,
          }).then((logs) =>
            logs.map((log) => ({
              type: 'transfer_out' as const,
              hash: log.transactionHash ?? '',
              from: addr,
              to: log.args.to ?? '',
              amount: (log.args.value as bigint) ?? 0n,
              decimals: EURC_DEC,
              symbol: 'EURC',
              blockNumber: log.blockNumber ?? 0n,
            }))
          )
        )

        // 7. cirBTC transfers (mainnet only)
        if (isMainnet) {
          fetches.push(
            publicClient!.getLogs({
              address: CIRBTC_MAINNET,
              event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
              args: { to: addr },
              fromBlock, toBlock: head,
            }).then((logs) =>
              logs.map((log) => ({
                type: 'transfer_in' as const,
                hash: log.transactionHash ?? '',
                from: log.args.from ?? '',
                to: addr,
                amount: (log.args.value as bigint) ?? 0n,
                decimals: CIRBTC_DEC,
                symbol: 'cirBTC',
                blockNumber: log.blockNumber ?? 0n,
              }))
            )
          )
          fetches.push(
            publicClient!.getLogs({
              address: CIRBTC_MAINNET,
              event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
              args: { from: addr },
              fromBlock, toBlock: head,
            }).then((logs) =>
              logs.map((log) => ({
                type: 'transfer_out' as const,
                hash: log.transactionHash ?? '',
                from: addr,
                to: log.args.to ?? '',
                amount: (log.args.value as bigint) ?? 0n,
                decimals: CIRBTC_DEC,
                symbol: 'cirBTC',
                blockNumber: log.blockNumber ?? 0n,
              }))
            )
          )
        }

        const results = await Promise.allSettled(fetches)
        if (cancelled) return

        const all: ActivityItem[] = results.flatMap((r) => r.status === 'fulfilled' ? r.value : [])

        // Deduplicate by hash+type (USDC transfer_in could overlap with treasury pay)
        const seen = new Set<string>()
        const deduped = all.filter((item) => {
          const key = `${item.hash}-${item.type}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        deduped.sort((a, b) => Number(b.blockNumber - a.blockNumber))
        setResult({ key: fetchKey, items: deduped.slice(0, 50) })
      } catch {
        setResult({ key: fetchKey, items: [] })
      }
    }

    void fetchLogs()
    return () => { cancelled = true }
  }, [publicClient, address, contractAddress, arcChainId, usdcAddress, eurcAddress, isMainnet, fetchKey, isDeployed])

  const allItems = result?.key === fetchKey ? result.items : []
  const filtered = activeFilter === 'all' ? allItems : allItems.filter((i) => i.type === activeFilter)

  // Only show filters that have results (or 'all')
  const usedTypes = new Set(allItems.map((i) => i.type))
  const visibleFilters = ALL_FILTERS.filter((f) => f.id === 'all' || usedTypes.has(f.id))

  if (!address) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
        Connect your wallet to see activity.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-[var(--surface-muted)] rounded w-40" />
              <div className="h-3 bg-[var(--surface-muted)] rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
        No recent activity in the last 5,000 blocks.
        <br />
        <span className="text-xs opacity-70">Transactions appear here as you use TreasuryOS.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      {visibleFilters.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-[var(--muted)]" />
          {visibleFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                activeFilter === f.id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-white/80 text-[var(--ink-2)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              {f.label}
              {f.id !== 'all' && (
                <span className="ml-1 opacity-60">
                  {allItems.filter((i) => i.type === f.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="rounded-2xl bg-white/80 border border-[var(--border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">
            No {activeFilter === 'all' ? '' : ALL_FILTERS.find((f) => f.id === activeFilter)?.label.toLowerCase() + ' '}activity.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type]
              return (
                <li key={`${item.hash}-${item.type}-${i}`} className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bgColor} ${cfg.dotColor}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">
                      {cfg.label(item)}
                    </p>
                    <p className={`text-xs mono font-medium ${
                      item.type === 'transfer_in' || item.type === 'distribute'
                        ? 'text-green-600'
                        : item.type === 'transfer_out' || item.type === 'pay'
                        ? 'text-rose-600'
                        : 'text-[var(--muted)]'
                    }`}>
                      {item.type === 'transfer_in' || item.type === 'distribute' ? '+' : item.type === 'transfer_out' || item.type === 'pay' ? '-' : ''}
                      {formatAmount(item.amount, item.decimals)} {item.symbol}
                    </p>
                  </div>
                  {item.hash && (
                    <a
                      href={buildTxUrl(item.hash, explorerBase)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
