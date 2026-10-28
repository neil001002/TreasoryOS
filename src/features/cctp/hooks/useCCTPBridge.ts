/**
 * useCCTPBridge — CCTP bridge hook for TreasuryOS.
 *
 * Flow:
 *   1. User selects source chain + amount → clicks "Bridge to Arc"
 *   2. Switch wallet to source chain (if needed)
 *   3. Build Viem provider adapter with withAddChainFallback
 *   4. Call appKit.bridge() — result.steps contains approve/burn/attestation/mint
 *   5. Surface final step states from the result
 *
 * Security: bridge() is ONLY called from the explicit user action (handleBridge).
 * Never called from an effect, render, or estimation callback.
 */

import { useState, useCallback } from 'react'
import { AppKit, BridgeChain } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { EIP1193Provider } from 'viem'
import { useConnectorClient, useSwitchChain } from 'wagmi'
import { useArcNetwork } from '@/context/NetworkContext'
import { type CctpSourceChain, getArcCircleId, CCTP_SOURCE_CHAINS } from '../lib/chains'
import { withAddChainFallback } from '../lib/withAddChainFallback'

// One AppKit instance for the lifetime of the module.
const appKit = new AppKit()

export type BridgeStepName = 'approve' | 'burn' | 'fetchAttestation' | 'mint'
export type BridgeStepState = 'idle' | 'pending' | 'success' | 'error'

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
}

const STEP_NAMES: BridgeStepName[] = ['approve', 'burn', 'fetchAttestation', 'mint']

function makeInitialSteps(): BridgeStep[] {
  return STEP_NAMES.map((name) => ({ name, state: 'idle' as BridgeStepState }))
}

export function useCCTPBridge() {
  const { isMainnet } = useArcNetwork()
  const { data: connectorClient } = useConnectorClient()
  const { switchChainAsync } = useSwitchChain()
  const [state, setState] = useState<BridgeState>({
    status: 'idle',
    steps: makeInitialSteps(),
  })

  const handleBridge = useCallback(
    async (sourceChain: CctpSourceChain, amount: string, recipientAddress: string) => {
      if (!connectorClient) throw new Error('Wallet not connected')
      if (!amount || Number(amount) <= 0) throw new Error('Invalid amount')

      setState({
        status: 'bridging',
        steps: makeInitialSteps(),
        errorMessage: undefined,
        finalTxHash: undefined,
      })

      try {
        // Switch wallet to the source chain if needed.
        if (connectorClient.chain.id !== sourceChain.chainId) {
          await switchChainAsync({ chainId: sourceChain.chainId })
        }

        // All chains the wallet may need to add (for mint step chain-switch).
        const allViemChains = CCTP_SOURCE_CHAINS.map((c) => c.viemChain)

        const provider = connectorClient.transport as unknown as EIP1193Provider
        const adapter = await createViemAdapterFromProvider({
          provider: withAddChainFallback(provider, allViemChains),
        })

        const destCircleId = getArcCircleId(isMainnet) as `${BridgeChain}`
        const srcCircleId = sourceChain.circleId as `${BridgeChain}`

        // Mark all steps pending while bridging.
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((s) => ({ ...s, state: 'pending' as BridgeStepState })),
        }))

        // Chain identifiers match the BridgeChain enum — cast via unknown to satisfy the
        // internal BridgeChainIdentifier type that is not publicly exported.
        type AnyChain = Parameters<typeof appKit.bridge>[0]['from']['chain']
        const result = await appKit.bridge({
          token: 'USDC',
          from: { adapter, chain: srcCircleId as unknown as AnyChain },
          to: {
            adapter,
            chain: destCircleId as unknown as AnyChain,
            recipientAddress,
          },
          amount,
        })

        // Parse step states from the result.
        const mintStep = result.steps?.find((s) => s.name === 'mint')

        setState({
          status: result.state === 'success' ? 'success' : 'error',
          errorMessage:
            result.state !== 'success' ? 'Bridge did not complete. Check step details.' : undefined,
          finalTxHash: (mintStep as { txHash?: string } | undefined)?.txHash,
          steps: STEP_NAMES.map((name) => {
            const rs = result.steps?.find((s) => s.name === name)
            if (!rs) return { name, state: 'idle' as BridgeStepState }
            return {
              name,
              state: (rs.state === 'success'
                ? 'success'
                : rs.state === 'error'
                  ? 'error'
                  : 'idle') as BridgeStepState,
              txHash: (rs as { txHash?: string })?.txHash,
              explorerUrl: (rs as { explorerUrl?: string })?.explorerUrl,
            }
          }),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: msg,
        }))
      }
    },
    [connectorClient, switchChainAsync, isMainnet],
  )

  const reset = useCallback(() => {
    setState({ status: 'idle', steps: makeInitialSteps() })
  }, [])

  return { state, handleBridge, reset }
}
