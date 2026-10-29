/**
 * useCCTPBridge — bidirectional CCTP bridge hook.
 *
 * Supports both:
 *   - "to Arc": other chain → Arc (existing behaviour)
 *   - "from Arc": Arc → other chain (new)
 *
 * For "to Arc": wallet is switched to the external chain before bridging.
 * For "from Arc": wallet is switched to Arc, recipient defaults to connected address.
 *
 * Security: bridge() is ONLY called from the explicit user action (handleBridge).
 */

import { useState, useCallback } from 'react'
import { AppKit, BridgeChain } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { EIP1193Provider } from 'viem'
import { useConnectorClient, useSwitchChain } from 'wagmi'
import { useArcNetwork } from '@/context/NetworkContext'
import { type CctpSourceChain, getArcCircleId, CCTP_SOURCE_CHAINS } from '../lib/chains'
import { withAddChainFallback } from '../lib/withAddChainFallback'

const appKit = new AppKit()

export type BridgeStepName = 'approve' | 'burn' | 'fetchAttestation' | 'mint'
export type BridgeStepState = 'idle' | 'pending' | 'success' | 'error'
export type BridgeDirection = 'toArc' | 'fromArc'

export interface BridgeStep {
  name: BridgeStepName
  state: BridgeStepState
  txHash?: string
  explorerUrl?: string
}

export type BridgeStatus = 'idle' | 'bridging' | 'success' | 'error'

interface BridgeState {
  status: BridgeStatus
  steps: BridgeStep[]
  errorMessage?: string
  finalTxHash?: string
  finalExplorerUrl?: string
}

const STEP_NAMES: BridgeStepName[] = ['approve', 'burn', 'fetchAttestation', 'mint']

function makeInitialSteps(): BridgeStep[] {
  return STEP_NAMES.map((name) => ({ name, state: 'idle' as BridgeStepState }))
}

export function useCCTPBridge() {
  const { isMainnet, arcChainId } = useArcNetwork()
  const { data: connectorClient } = useConnectorClient()
  const { switchChainAsync } = useSwitchChain()
  const [state, setState] = useState<BridgeState>({
    status: 'idle',
    steps: makeInitialSteps(),
  })

  const handleBridge = useCallback(
    async (
      direction: BridgeDirection,
      externalChain: CctpSourceChain,
      amount: string,
      recipientAddress: string,
    ) => {
      if (!connectorClient) throw new Error('Wallet not connected')
      if (!amount || Number(amount) <= 0) throw new Error('Invalid amount')

      setState({ status: 'bridging', steps: makeInitialSteps(), errorMessage: undefined, finalTxHash: undefined })

      try {
        const arcCircleId = getArcCircleId(isMainnet) as `${BridgeChain}`
        const extCircleId = externalChain.circleId as `${BridgeChain}`

        // All chains the wallet may need for chain-switches during the bridge flow.
        const allViemChains = CCTP_SOURCE_CHAINS.map((c) => c.viemChain)
        const provider = connectorClient.transport as unknown as EIP1193Provider
        const adapter = await createViemAdapterFromProvider({
          provider: withAddChainFallback(provider, allViemChains),
        })

        // Switch wallet to the initiating chain.
        const initiatingChainId = direction === 'toArc' ? externalChain.chainId : arcChainId
        if (connectorClient.chain.id !== initiatingChainId) {
          await switchChainAsync({ chainId: initiatingChainId })
        }

        // Mark steps pending while bridging.
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((s) => ({ ...s, state: 'pending' as BridgeStepState })),
        }))

        type AnyChain = Parameters<typeof appKit.bridge>[0]['from']['chain']

        const result = await appKit.bridge({
          token: 'USDC',
          from: {
            adapter,
            chain: (direction === 'toArc' ? extCircleId : arcCircleId) as unknown as AnyChain,
          },
          to: {
            adapter,
            chain: (direction === 'toArc' ? arcCircleId : extCircleId) as unknown as AnyChain,
            recipientAddress,
          },
          amount,
        })

        // The "receiving" step is 'mint' when bridging to Arc, 'burn' destination when bridging from Arc.
        const finalStep = result.steps?.find((s) => s.name === (direction === 'toArc' ? 'mint' : 'burn'))

        setState({
          status: result.state === 'success' ? 'success' : 'error',
          errorMessage: result.state !== 'success' ? 'Bridge did not complete. Check step details.' : undefined,
          finalTxHash: (finalStep as { txHash?: string } | undefined)?.txHash,
          finalExplorerUrl: (finalStep as { explorerUrl?: string } | undefined)?.explorerUrl,
          steps: STEP_NAMES.map((name) => {
            const rs = result.steps?.find((s) => s.name === name)
            if (!rs) return { name, state: 'idle' as BridgeStepState }
            return {
              name,
              state: (rs.state === 'success' ? 'success' : rs.state === 'error' ? 'error' : 'idle') as BridgeStepState,
              txHash: (rs as { txHash?: string })?.txHash,
              explorerUrl: (rs as { explorerUrl?: string })?.explorerUrl,
            }
          }),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setState((prev) => ({ ...prev, status: 'error', errorMessage: msg }))
      }
    },
    [connectorClient, switchChainAsync, isMainnet, arcChainId],
  )

  const reset = useCallback(() => {
    setState({ status: 'idle', steps: makeInitialSteps() })
  }, [])

  return { state, handleBridge, reset }
}
