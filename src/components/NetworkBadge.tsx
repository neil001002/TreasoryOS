import { arcChainFact } from '@/lib/arc'

export function NetworkBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      {arcChainFact.name}
    </span>
  )
}
