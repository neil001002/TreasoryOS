import { ARC_NETWORK, IS_MAINNET } from '@/lib/arc'

export function NetworkBadge() {
  return IS_MAINNET ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Arc Mainnet
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Arc {ARC_NETWORK === 'testnet' ? 'Testnet' : ARC_NETWORK}
    </span>
  )
}
