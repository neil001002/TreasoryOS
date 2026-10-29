import { useAccount, useReadContract } from 'wagmi'
import { TREASURY_SPLITTER_ABI } from '@/lib/abi'
import { useArcNetwork } from '@/context/NetworkContext'
import { useTreasury } from '@/hooks/useTreasury'
import { formatAddress, buildAddressUrl } from '@/lib/utils'
import { WalletButton } from '@/components/WalletButton'
import { ExternalLink } from 'lucide-react'

export function Settings() {
  const { address } = useAccount()
  const { arcChainId, usdcAddress, explorerBase, arcNetwork, factoryAddress } = useArcNetwork()
  const { treasuryAddress } = useTreasury()

  const contractAddress = treasuryAddress
  const isDeployed = !!contractAddress

  const { data: owner } = useReadContract({
    address: contractAddress ?? '0x0000000000000000000000000000000000000000',
    abi: TREASURY_SPLITTER_ABI,
    functionName: 'owner',
    chainId: arcChainId,
    query: { enabled: isDeployed },
  })

  const rows = [
    { label: 'Network',               value: arcNetwork === 'mainnet' ? 'Arc Mainnet' : 'Arc Testnet', mono: false },
    { label: 'Chain ID',              value: String(arcChainId), mono: false },
    { label: 'Connected Wallet',      value: address ? formatAddress(address) : '—',                 mono: true,  link: address ? buildAddressUrl(address) : undefined },
    { label: 'Contract Owner',        value: owner ? formatAddress(owner) : (isDeployed ? 'Loading...' : '—'), mono: true,  link: owner ? buildAddressUrl(owner) : undefined },
    { label: 'Your Treasury',         value: contractAddress ? formatAddress(contractAddress) : 'Not deployed', mono: true,  link: contractAddress ? buildAddressUrl(contractAddress) : undefined },
    { label: 'Factory Contract',      value: factoryAddress ? formatAddress(factoryAddress) : 'Not configured', mono: true,  link: factoryAddress ? buildAddressUrl(factoryAddress) : undefined },
    { label: 'USDC Address',          value: formatAddress(usdcAddress), mono: true,  link: buildAddressUrl(usdcAddress) },
    { label: 'Explorer',              value: explorerBase, mono: true,  link: explorerBase },
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

      {!isDeployed && address && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 space-y-1">
          <p className="font-semibold">No treasury found for this wallet</p>
          <p>Go to the Dashboard to set up your treasury.</p>
        </div>
      )}
    </div>
  )
}
