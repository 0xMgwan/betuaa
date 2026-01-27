// Contract addresses for Stretch platform
export const CONTRACTS = {
  baseSepolia: {
    // CTF Prediction Market (New)
    ctfPredictionMarket: '0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7',
    mockUSDC: '0x7c476223C59E2106511C7238c1A3f78C4d8AF7a1',
    
    // Legacy contracts (kept for reference)
    predictionMarket: '0x33063a9fD4d812939586E90924Fa3946e252C019',
  },
  base: {
    ctfPredictionMarket: '', // Deploy to mainnet when ready
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
      icon: '/USDC logo.png',
    },
    {
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      icon: '/USDT Logo.png',
    },
    {
      address: '0x929A08903C22440182646Bb450a67178Be402f7f',
      symbol: 'cNGN',
      name: 'Nigerian Naira',
      decimals: 18,
      icon: '/cngn logo.png',
    },
    {
      address: '0x182FcDFe504bb116555C8b9b3CF425F44a965b11',
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
      icon: '/USDC logo.png',
    },
    {
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      icon: '/USDT Logo.png',
    },
    {
      address: '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F',
      symbol: 'cNGN',
      name: 'Nigerian Naira',
      decimals: 18,
      icon: '/cngn logo.png',
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
