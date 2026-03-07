import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { ntzsWalletConnector } from './ntzs-wallet-connector'

/**
 * Wagmi config — nTZS wallet only.
 * Users connect via phone number (nTZS provisions a Base wallet address).
 * No MetaMask, Coinbase, Rainbow, or other browser extensions needed.
 */
export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [ntzsWalletConnector()],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [base.id]:        http('https://mainnet.base.org'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
