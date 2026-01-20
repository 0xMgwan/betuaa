// Contract addresses for BetUAA platform
export const CONTRACTS = {
  baseSepolia: {
    predictionMarket: '0x8F23474E7f7641dff430986082C1c07aE9fbb949',
    mockUSDC: '0xAE44F1ad9111A2F61FBCd0624c6593A967d1F7FF',
  },
  base: {
    predictionMarket: '', // Deploy to mainnet when ready
  },
} as const;

// Supported stablecoins
export const STABLECOINS = {
  baseSepolia: [
    {
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '💵',
    },
    {
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      icon: '💵',
    },
    {
      address: '0x929A08903C22440182646Bb450a67178Be402f7f',
      symbol: 'cNGN',
      name: 'Nigerian Naira',
      decimals: 18,
      icon: '🇳🇬',
    },
    {
      address: '0xAE44F1ad9111A2F61FBCd0624c6593A967d1F7FF',
      symbol: 'MockUSDC',
      name: 'Mock USDC (Test)',
      decimals: 6,
      icon: '🧪',
    },
  ],
  base: [
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '💵',
    },
    {
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      icon: '💵',
    },
    {
      address: '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F',
      symbol: 'cNGN',
      name: 'Nigerian Naira',
      decimals: 18,
      icon: '🇳🇬',
    },
    {
      address: '0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22',
      symbol: 'IDRX',
      name: 'Indonesian Rupiah',
      decimals: 18,
      icon: '🇮🇩',
    },
  ],
} as const;

export type Stablecoin = typeof STABLECOINS.baseSepolia[number];
