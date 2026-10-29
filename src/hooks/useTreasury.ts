/**
 * useTreasury — reads the connected wallet's TreasurySplitter address from the factory.
 *
 * Returns:
 *   treasuryAddress — the user's deployed contract address, or null if none / not connected
 *   isLoading       — true while the on-chain read is in flight
 *   refetch         — call after createTreasury() to re-read the mapping
 */

import { useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'
import { useArcNetwork } from '@/context/NetworkContext'
import { TREASURY_FACTORY_ABI } from '@/lib/factoryAbi'

export function useTreasury() {
  const { address, isConnected } = useAccount()
  const { factoryAddress } = useArcNetwork()

  const enabled = isConnected && !!address && !!factoryAddress

  const { data, isLoading, refetch } = useReadContract({
    address: factoryAddress,
    abi: TREASURY_FACTORY_ABI,
    functionName: 'getTreasury',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  // getTreasury returns zero address when no treasury exists
  const ZERO = '0x0000000000000000000000000000000000000000'
  const treasuryAddress: `0x${string}` | null =
    data && data !== ZERO ? (data) : null

  return {
    treasuryAddress,
    isLoading: enabled ? isLoading : false,
    hasFactory: !!factoryAddress,
    refetch,
  }
}
