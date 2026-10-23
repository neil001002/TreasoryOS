import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EXPLORER_BASE } from './arc'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function buildTxUrl(txHash: string): string {
  return `${EXPLORER_BASE}/tx/${txHash}`
}

export function buildAddressUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}`
}

/** Format a USDC bigint (6 decimals) to a display string. */
export function formatUSDC(raw: bigint, fractionDigits = 2): string {
  const n = Number(raw) / 1_000_000
  return n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** Parse a USDC string (e.g. "10.50") to bigint with 6 decimals. */
export function parseUSDCInput(value: string): bigint {
  const trimmed = value.trim()
  if (!trimmed || isNaN(Number(trimmed))) return 0n
  const [whole, fraction = ''] = trimmed.split('.')
  const paddedFraction = fraction.slice(0, 6).padEnd(6, '0')
  return BigInt(whole || '0') * 1_000_000n + BigInt(paddedFraction)
}

export const BUCKET_NAMES = ['Operating', 'Tax', 'Savings'] as const
export type BucketName = (typeof BUCKET_NAMES)[number]

export const BUCKET_COLORS: Record<string, string> = {
  Operating: '#1061a6',
  Tax:       '#e05c00',
  Savings:   '#1a8047',
}

export const BUCKET_BG: Record<string, string> = {
  Operating: 'bg-blue-50 text-blue-700',
  Tax:       'bg-orange-50 text-orange-700',
  Savings:   'bg-green-50 text-green-700',
}
