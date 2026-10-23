/**
 * Circle Modular Wallet helpers (passkey / WebAuthn smart accounts).
 * Arc is fully supported on both testnet and mainnet.
 *
 * Transport URL: base client URL + chain path segment.
 * Arc Testnet → /arcTestnet  |  Arc Mainnet → /arc
 */

import { createPublicClient } from 'viem'
import { arc, arcTestnet } from 'viem/chains'
import {
  type P256Credential,
  createBundlerClient,
  toWebAuthnAccount,
} from 'viem/account-abstraction'
import {
  WebAuthnMode,
  toCircleSmartAccount,
  toModularTransport,
  toPasskeyTransport,
  toWebAuthnCredential,
} from '@circle-fin/modular-wallets-core'
import { ARC_CHAIN_ID } from './arc'

const clientKey = import.meta.env.VITE_CLIENT_KEY as string | undefined
const clientUrl = import.meta.env.VITE_CLIENT_URL as string | undefined

// Chain path segment for toModularTransport
const chainPath = ARC_CHAIN_ID === arc.id ? '/arc' : '/arcTestnet'
const activeChain = ARC_CHAIN_ID === arc.id ? arc : arcTestnet

export const circleWalletConfigured = !!(clientKey && clientUrl)

function getTransports() {
  if (!clientKey || !clientUrl) throw new Error('VITE_CLIENT_KEY and VITE_CLIENT_URL must be set')
  const passkeyTransport = toPasskeyTransport(clientUrl, clientKey)
  const modularTransport = toModularTransport(`${clientUrl}${chainPath}`, clientKey)
  return { passkeyTransport, modularTransport }
}

/** Register a new passkey and return the credential + smart account address. */
export async function registerCircleWallet(username: string): Promise<{ address: `0x${string}`; credential: P256Credential }> {
  const { passkeyTransport, modularTransport } = getTransports()

  const credential = await toWebAuthnCredential({
    transport: passkeyTransport,
    mode: WebAuthnMode.Register,
    username,
  })

  const publicClient = createPublicClient({ chain: activeChain, transport: modularTransport })
  const account = await toCircleSmartAccount({
    client: publicClient,
    owner: toWebAuthnAccount({ credential }),
  })

  return { address: account.address, credential }
}

/** Login with an existing passkey and return the credential + smart account address. */
export async function loginCircleWallet(): Promise<{ address: `0x${string}`; credential: P256Credential }> {
  const { passkeyTransport, modularTransport } = getTransports()

  const credential = await toWebAuthnCredential({
    transport: passkeyTransport,
    mode: WebAuthnMode.Login,
  })

  const publicClient = createPublicClient({ chain: activeChain, transport: modularTransport })
  const account = await toCircleSmartAccount({
    client: publicClient,
    owner: toWebAuthnAccount({ credential }),
  })

  return { address: account.address, credential }
}

/** Build a bundler client from a persisted credential. Used for sending user ops. */
export async function getCircleBundlerClient(credential: P256Credential) {
  const { modularTransport } = getTransports()
  const publicClient = createPublicClient({ chain: activeChain, transport: modularTransport })
  const account = await toCircleSmartAccount({
    client: publicClient,
    owner: toWebAuthnAccount({ credential }),
  })
  const bundlerClient = createBundlerClient({ chain: activeChain, transport: modularTransport })
  return { bundlerClient, account }
}
