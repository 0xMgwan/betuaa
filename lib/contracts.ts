// RPC endpoints — use PRIMARY, fall back to FALLBACK on errors
export const RPC = {
  baseSepolia: {
    primary: 'https://sepolia.base.org',
    fallback: 'https://base-sepolia-rpc.publicnode.com',
  },
} as const;

// Contract addresses for Stretch platform
export const CONTRACTS = {
  baseSepolia: {
    // V2 Upgradeable Contracts (UUPS Proxy addresses) — redeployed Feb 10 2026
    ctfPredictionMarket: '0xfb4224B9826b0e1c4d2113103dAD1167D0EdE69d',
    orderBook: '0x90E274E7AbD5eb7c4b164455c158a649b8012a84',
    
    // Supporting contracts
    pythResolver: '0xc3c8523FaC61b6E35DC553BB5a1F542982753F62',
    mockUSDC: '0x8FD3cf50315A4AA74e97516cC4F46150AB032616',
    
    // Legacy V1 contracts (kept for reference)
    ctfPredictionMarketV1: '0xb46Ff34C716570b90472D2b8d709252618126052',
    orderBookV1: '0x62f80b6433ca877c0e723061fa8222925ea4b709',
    predictionMarket: '0x33063a9fD4d812939586E90924Fa3946e252C019',
  },
  base: {
    ctfPredictionMarket: '', // Deploy to mainnet when ready
    orderBook: '', // Deploy to mainnet when ready
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
      address: '0x8FD3cf50315A4AA74e97516cC4F46150AB032616',
      symbol: 'MockUSDC',
      name: 'Mock USDC (V2 Test)',
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
