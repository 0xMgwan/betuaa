/**
 * Pyth Network Integration
 * Price feeds and utilities for automated market resolution
 */

export const PYTH_CONTRACTS = {
  baseSepolia: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729',
  base: '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a',
} as const;

export const HERMES_API = 'https://hermes.pyth.network';

/**
 * Popular Pyth price feed IDs
 * Full list: https://pyth.network/developers/price-feed-ids
 */
export const PYTH_PRICE_FEEDS = {
  // Crypto
  'ETH/USD': {
    id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    name: 'Ethereum',
    symbol: 'ETH',
    category: 'crypto',
  },
  'BTC/USD': {
    id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    name: 'Bitcoin',
    symbol: 'BTC',
    category: 'crypto',
  },
  'SOL/USD': {
    id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    name: 'Solana',
    symbol: 'SOL',
    category: 'crypto',
  },
  'USDC/USD': {
    id: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    name: 'USD Coin',
    symbol: 'USDC',
    category: 'crypto',
  },
  'USDT/USD': {
    id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    name: 'Tether',
    symbol: 'USDT',
    category: 'crypto',
  },
  'BNB/USD': {
    id: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
    name: 'BNB',
    symbol: 'BNB',
    category: 'crypto',
  },
  'DOGE/USD': {
    id: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
    name: 'Dogecoin',
    symbol: 'DOGE',
    category: 'crypto',
  },
  'MATIC/USD': {
    id: '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
    name: 'Polygon',
    symbol: 'MATIC',
    category: 'crypto',
  },
  
  // Forex
  'EUR/USD': {
    id: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
    name: 'Euro / US Dollar',
    symbol: 'EUR/USD',
    category: 'forex',
  },
  'GBP/USD': {
    id: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
    name: 'British Pound / US Dollar',
    symbol: 'GBP/USD',
    category: 'forex',
  },
  'JPY/USD': {
    id: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52',
    name: 'Japanese Yen / US Dollar',
    symbol: 'JPY/USD',
    category: 'forex',
  },
  
  // Commodities
  'XAU/USD': {
    id: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
    name: 'Gold',
    symbol: 'XAU/USD',
    category: 'commodity',
  },
  'XAG/USD': {
    id: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
    name: 'Silver',
    symbol: 'XAG/USD',
    category: 'commodity',
  },
} as const;

export type PythFeedId = keyof typeof PYTH_PRICE_FEEDS;

/**
 * Get all price feeds grouped by category
 */
export function getPriceFeedsByCategory() {
  const categories: Record<string, typeof PYTH_PRICE_FEEDS[PythFeedId][]> = {
    crypto: [],
    forex: [],
    commodity: [],
  };
  
  Object.entries(PYTH_PRICE_FEEDS).forEach(([key, feed]) => {
    categories[feed.category].push(feed);
  });
  
  return categories;
}

/**
 * Format Pyth price (scaled by 10^expo) to human-readable format
 */
export function formatPythPrice(price: bigint, expo: number): string {
  const priceNum = Number(price) * Math.pow(10, expo);
  return priceNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Convert human-readable price to Pyth format (scaled by 10^8)
 */
export function toPythPrice(price: number): bigint {
  return BigInt(Math.floor(price * 1e8));
}

/**
 * Convert Pyth price to human-readable number
 */
export function fromPythPrice(pythPrice: bigint): number {
  return Number(pythPrice) / 1e8;
}

/**
 * Market type for Pyth-based markets
 */
export type PythMarketType = 'threshold' | 'range';

export interface PythMarketConfig {
  priceId: string;
  feedName: string;
  marketType: PythMarketType;
  threshold?: number;  // For threshold markets
  lowerBound?: number; // For range markets
  upperBound?: number; // For range markets
  expiryTime: number;
  isAbove?: boolean;   // For threshold: true = "above wins", false = "below wins"
}

/**
 * Generate market question from Pyth config
 */
export function generatePythMarketQuestion(config: PythMarketConfig): string {
  const feed = Object.values(PYTH_PRICE_FEEDS).find(f => f.id === config.priceId);
  const symbol = feed?.symbol || 'Asset';
  const date = new Date(config.expiryTime * 1000).toLocaleDateString();
  
  if (config.marketType === 'threshold' && config.threshold) {
    const direction = config.isAbove ? 'above' : 'below';
    return `Will ${symbol} be ${direction} $${config.threshold.toLocaleString()} by ${date}?`;
  } else if (config.marketType === 'range' && config.lowerBound && config.upperBound) {
    return `Will ${symbol} be between $${config.lowerBound.toLocaleString()} and $${config.upperBound.toLocaleString()} on ${date}?`;
  }
  
  return `${symbol} price prediction for ${date}`;
}

/**
 * Fetch current price from Pyth Hermes API
 */
export async function fetchPythPrice(priceId: string) {
  try {
    const response = await fetch(
      `${HERMES_API}/api/latest_price_feeds?ids[]=${priceId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Pyth price');
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No price data returned');
    }
    
    const priceData = data[0];
    const price = priceData.price.price;
    const expo = priceData.price.expo;
    const conf = priceData.price.conf;
    const publishTime = priceData.price.publish_time;
    
    return {
      price: BigInt(price),
      expo,
      conf: BigInt(conf),
      publishTime,
      formattedPrice: formatPythPrice(BigInt(price), expo),
    };
  } catch (error) {
    console.error('Error fetching Pyth price:', error);
    throw error;
  }
}

/**
 * Get price update data for on-chain resolution
 */
export async function getPriceUpdateData(priceIds: string[]) {
  try {
    const idsParam = priceIds.map(id => `ids[]=${id}`).join('&');
    const response = await fetch(
      `${HERMES_API}/api/latest_vaas?${idsParam}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price update data');
    }
    
    const data = await response.json();
    return data as string[];
  } catch (error) {
    console.error('Error fetching price update data:', error);
    throw error;
  }
}
