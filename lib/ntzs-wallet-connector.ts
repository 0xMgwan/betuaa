import { createConnector } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { http, createPublicClient } from 'viem'

// Storage keys
export const NTZS_STORAGE_KEY = 'ntzs:wallet_address'
export const NTZS_USER_ID_KEY = 'ntzs:user_id'
export const NTZS_PHONE_KEY   = 'ntzs:phone'

// Define the type constant first so it can be referenced before function declaration
const CONNECTOR_TYPE = 'ntzs-wallet' as const

/**
 * Custom wagmi connector that uses nTZS-provisioned Base wallets.
 * Identity = phone number → nTZS provisions a Base wallet address.
 * No browser extension needed. Works on any device.
 */
export function ntzsWalletConnector() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createConnector(((config: any) => {
    // ── Helpers ──────────────────────────────────────────────────────────────
    const getStoredAddress = (): `0x${string}` | null => {
      try {
        return (localStorage.getItem(NTZS_STORAGE_KEY) as `0x${string}`) || null
      } catch { return null }
    }

    /** Minimal EIP-1193 provider backed by viem public client for reads */
    const buildProvider = (address: `0x${string}`) => {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      })

      return {
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
          switch (method) {
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [address]

            case 'eth_chainId':
              return `0x${baseSepolia.id.toString(16)}`

            case 'eth_getBalance': {
              const [addr, block] = params as [`0x${string}`, string]
              return publicClient.request({ method, params: [addr, block] } as never)
            }

            case 'eth_call':
            case 'eth_getLogs':
            case 'eth_getTransactionReceipt':
            case 'eth_blockNumber':
            case 'eth_getBlockByNumber':
              return publicClient.request({ method, params } as never)

            // Transaction signing — route through backend API for nTZS embedded wallets
            case 'eth_sendTransaction': {
              const [txParams] = params as [{ from: string; to: string; data?: string; value?: string; gas?: string }];
              
              // Send transaction through our backend API which uses nTZS
              const response = await fetch('/api/ntzs/send-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from: txParams.from,
                  to: txParams.to,
                  data: txParams.data || '0x',
                  value: txParams.value || '0x0',
                }),
              });
              
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Transaction failed');
              }
              
              const result = await response.json();
              return result.hash;
            }
            
            case 'eth_signTransaction':
            case 'personal_sign':
            case 'eth_sign':
            case 'eth_signTypedData':
            case 'eth_signTypedData_v4':
              throw new Error('nTZS embedded wallets: Message signing not yet supported. Use transaction execution instead.')

            default:
              return publicClient.request({ method, params } as never)
          }
        },
      }
    }

    // ── Connector ─────────────────────────────────────────────────────────────
    return {
      id:   'ntzs-wallet',
      name: 'nTZS Wallet',
      type: CONNECTOR_TYPE,

      async setup() {
        const address = getStoredAddress()
        if (address) {
          config.emitter.emit('change', { accounts: [address] as readonly `0x${string}`[] })
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async connect(_params?: any) {
        const address = getStoredAddress()
        if (!address) throw new Error('No nTZS wallet connected. Please connect with your phone number first.')
        return {
          accounts: [address] as readonly `0x${string}`[],
          chainId: baseSepolia.id,
        }
      },

      async disconnect() {
        try {
          localStorage.removeItem(NTZS_STORAGE_KEY)
          localStorage.removeItem(NTZS_USER_ID_KEY)
          localStorage.removeItem(NTZS_PHONE_KEY)
        } catch { /* noop */ }
        config.emitter.emit('disconnect')
      },

      async getAccounts(): Promise<readonly `0x${string}`[]> {
        const address = getStoredAddress()
        return address ? ([address] as readonly `0x${string}`[]) : []
      },

      async getChainId() {
        return baseSepolia.id
      },

      async getProvider(_params?: { chainId?: number }) {
        const address = getStoredAddress()
        if (!address) return buildProvider('0x0000000000000000000000000000000000000000')
        return buildProvider(address)
      },

      async isAuthorized() {
        return !!getStoredAddress()
      },

      onAccountsChanged(accounts: string[]) {
        if (accounts.length === 0) config.emitter.emit('disconnect')
        else config.emitter.emit('change', { accounts: accounts as `0x${string}`[] })
      },

      onChainChanged(chain: string) {
        config.emitter.emit('change', { chainId: Number(chain) })
      },

      onDisconnect() {
        config.emitter.emit('disconnect')
      },
    }
  }) as ReturnType<typeof createConnector>)
}

ntzsWalletConnector.type = CONNECTOR_TYPE

export type NtzsWalletConnectorType = typeof CONNECTOR_TYPE

/**
 * Store nTZS wallet in localStorage and trigger wagmi account change.
 * Called after successful phone-based nTZS auth.
 */
export function storeNtzsWallet(address: `0x${string}`, userId: string, phone: string) {
  localStorage.setItem(NTZS_STORAGE_KEY, address)
  localStorage.setItem(NTZS_USER_ID_KEY, userId)
  localStorage.setItem(NTZS_PHONE_KEY,   phone)
}

export function clearNtzsWallet() {
  localStorage.removeItem(NTZS_STORAGE_KEY)
  localStorage.removeItem(NTZS_USER_ID_KEY)
  localStorage.removeItem(NTZS_PHONE_KEY)
}

export function getNtzsWalletAddress(): `0x${string}` | null {
  try { return (localStorage.getItem(NTZS_STORAGE_KEY) as `0x${string}`) || null }
  catch { return null }
}

export function getNtzsPhone(): string | null {
  try { return localStorage.getItem(NTZS_PHONE_KEY) }
  catch { return null }
}
