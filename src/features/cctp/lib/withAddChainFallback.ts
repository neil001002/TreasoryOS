/**
 * Wraps an EIP-1193 provider so that when the adapter tries to switch to a
 * destination chain the wallet doesn't know (error 4902), it first calls
 * wallet_addEthereumChain and then retries the switch.
 *
 * Required for CCTP bridging with browser wallets when the Forwarding Service
 * is NOT used — the adapter switches to the destination chain for the mint step.
 */

import { numberToHex, type Chain, type EIP1193Provider } from 'viem'

const isUnrecognizedChain = (error: unknown): boolean => {
  const e = error as { code?: number; data?: { originalError?: { code?: number } } }
  return e?.code === 4902 || e?.data?.originalError?.code === 4902
}

export function withAddChainFallback(
  provider: EIP1193Provider,
  chains: readonly Chain[],
): EIP1193Provider {
  const send = provider.request.bind(provider) as (args: {
    method: string
    params?: unknown
  }) => Promise<unknown>

  const request = (async (args: { method: string; params?: unknown }) => {
    try {
      return await send(args)
    } catch (error) {
      if (args.method !== 'wallet_switchEthereumChain' || !isUnrecognizedChain(error)) {
        throw error
      }
      const [{ chainId }] = args.params as [{ chainId: string }]
      const chain = chains.find((c) => c.id === Number(chainId))
      if (!chain) throw error
      await send({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: numberToHex(chain.id),
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [...chain.rpcUrls.default.http],
            blockExplorerUrls: chain.blockExplorers
              ? [chain.blockExplorers.default.url]
              : undefined,
          },
        ],
      })
      return send(args)
    }
  }) as EIP1193Provider['request']

  // Use a Proxy — wallet providers are class instances, not plain objects.
  return new Proxy(provider, {
    get(target, prop) {
      if (prop === 'request') return request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = Reflect.get(target, prop, target) as unknown
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(target)
        : value
    },
  })
}
