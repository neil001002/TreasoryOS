/**
 * wagmi + ConnectKit configuration
 * Built with Arc Studio — https://studio.arc.io
 *
 * Connectors (all shown as named tiles in the ConnectKit modal):
 *  - metaMask()       Extension on desktop; deep-links to MetaMask app on mobile (no QR)
 *  - injected()       Any other browser extension: Rabby, Brave Wallet, Frame, etc.
 *  - walletConnect()  300+ mobile wallets via deep-link / QR (needs VITE_WC_PROJECT_ID)
 *  - coinbaseWallet() Coinbase Wallet extension + Base mobile (eoaOnly for custom testnets)
 */

import { createConfig, http } from 'wagmi'
import { metaMask, injected, walletConnect, coinbaseWallet } from '@wagmi/connectors'
import { mainnet } from 'wagmi/chains'
import { arc, arcTestnet } from 'viem/chains'
import { registerChain } from './tracing'

registerChain(arc.id, arc.rpcUrls.default.http[0])
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])

const wcProjectId = (import.meta.env.VITE_WC_PROJECT_ID as string | undefined) ?? ''

/** True when a WalletConnect project ID is configured — mobile wallets require it. */
export const walletConnectEnabled = wcProjectId.length > 0

const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio.arc.io'

export const config = createConfig({
  chains: [arcTestnet, arc, mainnet],

  connectors: [
    // Desktop: connects via extension (EIP-6963 announce).
    // Mobile: useDeeplink opens the MetaMask app directly — no QR code shown.
    metaMask({
      useDeeplink: true,
      preferDesktop: false,
      dappMetadata: { name: 'TreasuryOS', url: appUrl },
    }),

    // Any other injected browser wallet (Rabby, Brave, Frame, etc.)
    injected({ shimDisconnect: true }),

    // WalletConnect — deep-links or QR for any other mobile wallet
    // Only registered when a project ID is present to avoid broken init.
    ...(wcProjectId
      ? [
          walletConnect({
            projectId: wcProjectId,
            showQrModal: false, // ConnectKit renders its own modal
            metadata: {
              name: 'TreasuryOS',
              description: 'Run your entire treasury on Arc',
              url: appUrl,
              icons: [`${appUrl}/favicon.ico`],
            },
          }),
        ]
      : []),

    // Coinbase Wallet — eoaOnly so it works with Arc Testnet (Smart Wallet only supports
    // a fixed set of chains and cannot add custom ones like Arc Testnet).
    coinbaseWallet({
      appName: 'TreasuryOS',
      preference: 'eoaOnly',
    }),
  ],

  transports: {
    [arcTestnet.id]: http(),
    [arc.id]: http('https://rpc.mainnet.arc.io'),
    [mainnet.id]: http(),
  },
})
