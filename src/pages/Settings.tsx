import { useAccount, useReadContract } from 'wagmi'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { TREASURY_SPLITTER_ADDRESS, ARC_CHAIN_ID, EXPLORER_BASE, USDC_ADDRESS } from '@/lib/arc'
import { formatAddress, buildAddressUrl } from '@/lib/utils'
import { WalletButton } from '@/components/WalletButton'
import { ExternalLink } from 'lucide-react'

export function Settings() {
  const { address } = useAccount()
  const isDeployed = !!TREASURY_SPLITTER_ADDRESS

  const { data: owner } = useReadContract({
    address: TREASURY_SPLITTER_ADDRESS,
    abi: TREASURY_SPLITTER_ABI,
    functionName: 'owner',
    chainId: ARC_CHAIN_ID,
    query: { enabled: isDeployed },
  })

  const rows = [
    { label: 'Connected Wallet', value: address ? formatAddress(address) : '—', mono: true, link: address ? buildAddressUrl(address) : undefined },
    { label: 'Contract Owner', value: owner ? formatAddress(owner) : (isDeployed ? 'Loading...' : '—'), mono: true, link: owner ? buildAddressUrl(owner) : undefined },
    { label: 'TreasurySplitter Address', value: TREASURY_SPLITTER_ADDRESS ? formatAddress(TREASURY_SPLITTER_ADDRESS) : 'Not deployed', mono: true, link: TREASURY_SPLITTER_ADDRESS ? buildAddressUrl(TREASURY_SPLITTER_ADDRESS) : undefined },
    { label: 'USDC Address', value: formatAddress(USDC_ADDRESS), mono: true, link: buildAddressUrl(USDC_ADDRESS) },
    { label: 'Chain ID', value: String(ARC_CHAIN_ID), mono: false },
    { label: 'Explorer', value: EXPLORER_BASE, mono: true, link: EXPLORER_BASE },
  ]

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="display text-2xl md:text-3xl font-bold text-[var(--ink)]">Settings</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Contract and network configuration.</p>
      </div>

      <div className="rounded-2xl bg-white/80 border border-[var(--border)] overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {rows.map(({ label, value, mono, link }) => (
            <li key={label} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="text-sm text-[var(--muted)]">{label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium text-[var(--ink)] ${mono ? 'mono' : ''}`}>{value}</span>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {!address && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
          <WalletButton />
          <span>Connect your wallet to see owner info.</span>
        </div>
      )}

      {!isDeployed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 space-y-1">
          <p className="font-semibold">TreasurySplitter not deployed yet</p>
          <p>Deploy the contract and set <code className="mono bg-amber-100 px-1 rounded">VITE_TREASURY_SPLITTER_ADDRESS</code> in your .env file.</p>
        </div>
      )}
    </div>
  )
}
