/**
 * StablecoinBalances — shows USDC, EURC, and cirBTC balances for the connected wallet.
 *
 * EURC addresses (official Circle docs):
 *   Arc Mainnet:  0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1
 *   Arc Testnet:  0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
 *
 * cirBTC is supported on Arc mainnet only — testnet address not yet published.
 */

import { useAccount, useReadContracts } from 'wagmi'
import { erc20Abi } from 'viem'
import { useArcNetwork } from '@/context/NetworkContext'
import { TokenUSDC, TokenEURC } from '@web3icons/react'
import { Bitcoin } from 'lucide-react'

const EURC_TESTNET  = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`
const EURC_MAINNET  = '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1' as `0x${string}`
// cirBTC is mainnet-only on Arc; testnet has no published address.
const CIRBTC_MAINNET = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9' as `0x${string}`

interface TokenRowProps {
  icon: React.ReactNode
  symbol: string
  name: string
  balance: bigint | undefined
  isLoading: boolean
  decimals?: number
  unavailable?: boolean
  accentClass: string
  bgClass: string
}

function formatToken(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = balance / divisor
  const frac = balance % divisor
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 2)
  return `${whole.toLocaleString()}.${fracStr}`
}

function TokenRow({ icon, symbol, name, balance, isLoading, decimals = 6, unavailable, accentClass, bgClass }: TokenRowProps) {
  const formatted = balance !== undefined ? formatToken(balance, decimals) : '—'

  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] ${bgClass} backdrop-blur-sm`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{name}</p>
        {unavailable ? (
          <p className="text-sm text-[var(--subtle)] mt-0.5">Mainnet only</p>
        ) : isLoading ? (
          <div className="h-7 w-28 bg-[var(--surface-muted)] rounded animate-pulse mt-0.5" />
        ) : (
          <p className="display text-2xl font-bold text-[var(--ink)] tabular-nums leading-tight mt-0.5">
            {formatted}
          </p>
        )}
      </div>
      <div className="text-sm font-semibold text-[var(--muted)]">{symbol}</div>
    </div>
  )
}

export function StablecoinBalances() {
  const { address } = useAccount()
  const { arcChainId, usdcAddress } = useArcNetwork()
  const isMainnet = arcChainId === 5042

  const eurcAddress = isMainnet ? EURC_MAINNET : EURC_TESTNET
  const hasCirBTC = isMainnet

  const enabled = !!address
  const contracts = [
    { address: usdcAddress,  abi: erc20Abi, functionName: 'balanceOf' as const, args: [address ?? '0x0'] as [`0x${string}`], chainId: arcChainId },
    { address: eurcAddress,  abi: erc20Abi, functionName: 'balanceOf' as const, args: [address ?? '0x0'] as [`0x${string}`], chainId: arcChainId },
    ...(hasCirBTC ? [{ address: CIRBTC_MAINNET, abi: erc20Abi, functionName: 'balanceOf' as const, args: [address ?? '0x0'] as [`0x${string}`], chainId: arcChainId }] : []),
  ]

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled },
  })

  const usdcBal  = data?.[0]?.result
  const eurcBal  = data?.[1]?.result
  const cirBTCBal = hasCirBTC ? (data?.[2]?.result) : undefined

  return (
    <div className="space-y-3">
      <TokenRow
        icon={<TokenUSDC variant="branded" size={22} />}
        symbol="USDC"
        name="USD Coin"
        balance={usdcBal}
        isLoading={isLoading}
        accentClass="bg-blue-50"
        bgClass="bg-white/80"
      />
      <TokenRow
        icon={<TokenEURC variant="branded" size={22} />}
        symbol="EURC"
        name="Euro Coin"
        balance={eurcBal}
        isLoading={isLoading}
        accentClass="bg-indigo-50"
        bgClass="bg-white/80"
      />
      <TokenRow
        icon={<Bitcoin size={20} className="text-orange-500" />}
        symbol="cirBTC"
        name="Circle BTC"
        balance={cirBTCBal}
        isLoading={isLoading && hasCirBTC}
        unavailable={!hasCirBTC}
        decimals={8}
        accentClass="bg-orange-50"
        bgClass="bg-white/80"
      />
    </div>
  )
}
