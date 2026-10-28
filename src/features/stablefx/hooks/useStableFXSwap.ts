/**
 * useStableFXSwap — StableFX in-treasury USDC conversion hook.
 *
 * Pattern: estimate → user reviews → user clicks Swap → execute.
 * swap() is ONLY called from the explicit user action (executeSwap).
 * NEVER called from an effect, render, or after estimation automatically.
 *
 * Arc note: USDC ↔ NATIVE is the same asset — rejected before routing.
 */

import { useState, useCallback } from 'react'
import { AppKit, SwapChain } from '@circle-fin/app-kit'
import type { SwapEstimate } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { EIP1193Provider } from 'viem'
import { useConnectorClient, useSwitchChain, useAccount } from 'wagmi'
import { useArcNetwork } from '@/context/NetworkContext'
import { STABLEFX_SOURCE_TOKEN, getArcSwapChain } from '../lib/tokens'

const appKit = new AppKit()

export type SwapStatus = 'idle' | 'estimating' | 'reviewed' | 'swapping' | 'success' | 'error'

export interface ReviewedSwap {
  estimate: SwapEstimate
  amountIn: string
  tokenOut: string
  account: string
}

interface SwapState {
  status: SwapStatus
  reviewed: ReviewedSwap | null
  txHash?: string
  explorerUrl?: string
  amountOut?: string
  errorMessage?: string
}

export function useStableFXSwap() {
  const { isMainnet, arcChainId } = useArcNetwork()
  const { data: connectorClient } = useConnectorClient()
  const { switchChainAsync } = useSwitchChain()
  const { address } = useAccount()
  const [state, setState] = useState<SwapState>({
    status: 'idle',
    reviewed: null,
  })

  const getAdapter = useCallback(async () => {
    if (!connectorClient) throw new Error('Wallet not connected')

    // Must be on Arc to swap Arc tokens.
    if (connectorClient.chain.id !== arcChainId) {
      await switchChainAsync({ chainId: arcChainId })
    }

    const provider = connectorClient.transport as unknown as EIP1193Provider
    return createViemAdapterFromProvider({ provider })
  }, [connectorClient, switchChainAsync, arcChainId])

  /** Step 1: Get a rate estimate. Does NOT execute the swap. */
  const estimateSwap = useCallback(
    async (amountIn: string, tokenOut: string) => {
      if (!address) throw new Error('Wallet not connected')
      if (!amountIn || Number(amountIn) <= 0) throw new Error('Invalid amount')
      // Guard: USDC → USDC or NATIVE is a no-op on Arc (NATIVE === USDC).
      if (tokenOut === 'USDC' || tokenOut === 'NATIVE') {
        throw new Error('USDC and NATIVE are the same asset on Arc. Choose EURC or cirBTC.')
      }

      setState((prev) => ({ ...prev, status: 'estimating', errorMessage: undefined }))

      try {
        const adapter = await getAdapter()
        const arcChainStr = getArcSwapChain(isMainnet) as `${SwapChain}`
        const estimate = await appKit.estimateSwap({
          from: { adapter, chain: arcChainStr },
          tokenIn: STABLEFX_SOURCE_TOKEN,
          tokenOut,
          amountIn,
          config: { slippageBps: 100 }, // 1% slippage
        })

        setState((prev) => ({
          ...prev,
          status: 'reviewed',
          reviewed: {
            estimate,
            amountIn,
            tokenOut,
            account: address,
          },
          errorMessage: undefined,
        }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Estimation failed'
        setState((prev) => ({ ...prev, status: 'error', errorMessage: msg }))
      }
    },
    [address, getAdapter, isMainnet],
  )

  /** Step 2: Execute the swap after user reviews the estimate. */
  const executeSwap = useCallback(async () => {
    const { reviewed } = state
    if (!reviewed) throw new Error('Get a quote first')
    if (address !== reviewed.account) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Wallet account changed since the estimate. Get a new quote.',
      }))
      return
    }

    setState((prev) => ({ ...prev, status: 'swapping', errorMessage: undefined }))

    try {
      const adapter = await getAdapter()
      const arcChainStr = getArcSwapChain(isMainnet) as `${SwapChain}`
      const result = await appKit.swap({
        from: { adapter, chain: arcChainStr },
        tokenIn: STABLEFX_SOURCE_TOKEN,
        tokenOut: reviewed.tokenOut,
        amountIn: reviewed.amountIn,
        config: { slippageBps: 100 },
      })

      setState((prev) => ({
        ...prev,
        status: result.progress?.status === 'DONE' ? 'success' : 'error',
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        amountOut: result.amountOut,
        reviewed: null,
        errorMessage:
          result.progress?.status !== 'DONE'
            ? `Swap status: ${result.progress?.status ?? 'unknown'}`
            : undefined,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swap failed'
      setState((prev) => ({ ...prev, status: 'error', errorMessage: msg }))
    }
  }, [state, address, getAdapter, isMainnet])

  const reset = useCallback(() => {
    setState({ status: 'idle', reviewed: null })
  }, [])

  return { state, estimateSwap, executeSwap, reset }
}
