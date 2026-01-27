// Polymarket Gamma API Service
// Documentation: https://docs.polymarket.com/developers/gamma-markets-api/overview

import {
  PolymarketMarket,
  PolymarketEvent,
  PolymarketMarketsResponse,
  PolymarketEventsResponse,
  SimplifiedPolymarketMarket,
  PolymarketPriceHistory,
} from './types';

// Use our Next.js API routes to avoid CORS issues
const API_BASE = '/api/polymarket';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch all active markets from Polymarket
 */
export async function fetchPolymarketMarkets(params?: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
}): Promise<PolymarketMarket[]> {
  const cacheKey = `markets-${JSON.stringify(params)}`;
  const cached = getCached<PolymarketMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.closed !== undefined) queryParams.append('closed', params.closed.toString());
    if (params?.archived !== undefined) queryParams.append('archived', params.archived.toString());

    const url = `${API_BASE}/markets?${queryParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data: PolymarketMarket[] = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
}

/**
 * Fetch a specific market by condition ID
 */
export async function fetchPolymarketMarket(conditionId: string): Promise<PolymarketMarket | null> {
  const cacheKey = `market-${conditionId}`;
  const cached = getCached<PolymarketMarket>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/markets/${conditionId}`);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data: PolymarketMarket = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Polymarket market:', error);
    return null;
  }
}

/**
 * Fetch events (grouped markets) - Use this for current active markets
 */
export async function fetchPolymarketEvents(params?: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
}): Promise<any[]> {
  const cacheKey = `events-${JSON.stringify(params)}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.closed !== undefined) queryParams.append('closed', params.closed.toString());

    const url = `${API_BASE}/events?${queryParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data: any[] = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Polymarket events:', error);
    return [];
  }
}

/**
 * Fetch price history for a market
 */
export async function fetchPolymarketPriceHistory(
  conditionId: string,
  params?: {
    interval?: 'all' | '1d' | '1w' | '1m';
  }
): Promise<PolymarketPriceHistory | null> {
  try {
    const interval = params?.interval || '1d';
    const response = await fetch(
      `${API_BASE}/prices-history?market=${conditionId}&interval=${interval}`
    );
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data: PolymarketPriceHistory = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Polymarket price history:', error);
    return null;
  }
}

/**
 * Search markets by query
 */
export async function searchPolymarketMarkets(query: string): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(
      `${API_BASE}/markets?search=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data: PolymarketMarket[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching Polymarket markets:', error);
    return [];
  }
}

/**
 * Convert Polymarket market to simplified format for our UI
 */
export function simplifyPolymarketMarket(market: any): SimplifiedPolymarketMarket {
  // Parse outcome prices if available
  let yesPrice = 0.5;
  let noPrice = 0.5;
  
  if (market.outcomePrices) {
    try {
      const prices = typeof market.outcomePrices === 'string' 
        ? JSON.parse(market.outcomePrices) 
        : market.outcomePrices;
      if (Array.isArray(prices) && prices.length >= 2) {
        yesPrice = parseFloat(prices[0]) || 0.5;
        noPrice = parseFloat(prices[1]) || 0.5;
      }
    } catch (e) {
      console.error('Error parsing outcome prices:', e);
    }
  }

  // Check if market is resolved
  const resolved = market.closed && market.archived;

  return {
    id: market.conditionId || market.id || '',
    question: market.question || 'Unknown Market',
    description: market.description || '',
    category: market.category || (market.tags && market.tags[0]?.label) || 'Other',
    yesPrice,
    noPrice,
    volume: market.volume || market.volumeNum?.toString() || '0',
    endDate: market.endDateIso || market.endDate || market.end_date_iso || new Date().toISOString(),
    active: market.active !== false,
    closed: market.closed || false,
    resolved,
    winningOutcome: undefined,
    icon: market.icon || market.image,
    slug: market.event_slug || market.slug || '',
  };
}

/**
 * Fetch markets by category
 */
export async function fetchPolymarketMarketsByCategory(category: string): Promise<PolymarketMarket[]> {
  const cacheKey = `category-${category}`;
  const cached = getCached<PolymarketMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    const allMarkets = await fetchPolymarketMarkets({ active: true, limit: 100 });
    const filtered = allMarkets.filter(
      m => m.category?.toLowerCase() === category.toLowerCase()
    );
    setCache(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.error('Error fetching markets by category:', error);
    return [];
  }
}

/**
 * Get trending markets (high volume) - Using events endpoint for current markets
 */
export async function fetchTrendingPolymarketMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
  const cacheKey = `trending-${limit}`;
  const cached = getCached<PolymarketMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch active events (which contain current markets)
    const events = await fetchPolymarketEvents({ active: true, closed: false, limit: 100 });
    
    // Extract all markets from events
    const allMarkets: any[] = [];
    events.forEach((event: any) => {
      if (event.markets && Array.isArray(event.markets)) {
        event.markets.forEach((market: any) => {
          allMarkets.push({
            ...market,
            event_title: event.title,
            event_slug: event.slug,
            tags: event.tags || [],
          });
        });
      }
    });
    
    // Sort by volume and take top markets
    const sorted = allMarkets
      .filter(m => m.volume || m.volumeNum)
      .sort((a, b) => {
        const volA = parseFloat(a.volumeNum || a.volume || '0');
        const volB = parseFloat(b.volumeNum || b.volume || '0');
        return volB - volA;
      })
      .slice(0, limit);
    
    setCache(cacheKey, sorted);
    return sorted;
  } catch (error) {
    console.error('Error fetching trending markets:', error);
    return [];
  }
}

/**
 * Get recently resolved markets
 */
export async function fetchResolvedPolymarketMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
  const cacheKey = `resolved-${limit}`;
  const cached = getCached<PolymarketMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    const markets = await fetchPolymarketMarkets({ closed: true, archived: false, limit: 200 });
    
    // Filter for recently resolved markets (within last 90 days)
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const resolved = markets
      .filter(m => {
        const endDate = new Date(m.end_date_iso || '');
        return endDate > ninetyDaysAgo && m.closed;
      })
      .slice(0, limit);
    
    setCache(cacheKey, resolved);
    return resolved;
  } catch (error) {
    console.error('Error fetching resolved markets:', error);
    return [];
  }
}
