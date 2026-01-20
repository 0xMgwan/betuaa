// Contract addresses for BetUAA platform
export const CONTRACTS = {
  baseSepolia: {
    predictionMarket: '0x5B7b439DC5e39E60e790fc2e347054f3F0D0AC9f', // Fixed: claimWinnings decimal handling
    mockUSDC: '0xEcd9E178aB6897d905E9A227E7A480AFE35b2DC8',
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
      address: '0xEcd9E178aB6897d905E9A227E7A480AFE35b2DC8',
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
