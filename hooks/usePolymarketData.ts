import { useState, useEffect } from 'react';
import {
  fetchPolymarketMarkets,
  fetchPolymarketEvents,
  fetchTrendingPolymarketMarkets,
  fetchResolvedPolymarketMarkets,
  fetchPolymarketMarketsByCategory,
  simplifyPolymarketMarket,
} from '@/lib/polymarket/api';
import {
  PolymarketMarket,
  PolymarketEvent,
  SimplifiedPolymarketMarket,
} from '@/lib/polymarket/types';

export function usePolymarketMarkets(params?: {
  limit?: number;
  active?: boolean;
  closed?: boolean;
}) {
  const [markets, setMarkets] = useState<SimplifiedPolymarketMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMarkets() {
      try {
        setIsLoading(true);
        // Use events endpoint to get current active markets
        const events = await fetchPolymarketEvents({
          limit: params?.limit || 100,
          active: params?.active !== false,
          closed: params?.closed || false,
        });
        
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
        
        if (mounted) {
          setMarkets(allMarkets.map(simplifyPolymarketMarket));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadMarkets();

    return () => {
      mounted = false;
    };
  }, [params?.limit, params?.active, params?.closed]);

  return { markets, isLoading, error };
}

export function usePolymarketEvents(params?: {
  limit?: number;
  active?: boolean;
}) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      try {
        setIsLoading(true);
        const data = await fetchPolymarketEvents(params);
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [params?.limit, params?.active]);

  return { events, isLoading, error };
}

export function useTrendingPolymarketMarkets(limit: number = 10) {
  const [markets, setMarkets] = useState<SimplifiedPolymarketMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTrending() {
      try {
        setIsLoading(true);
        const data = await fetchTrendingPolymarketMarkets(limit);
        if (mounted) {
          setMarkets(data.map(simplifyPolymarketMarket));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTrending();

    return () => {
      mounted = false;
    };
  }, [limit]);

  return { markets, isLoading, error };
}

export function useResolvedPolymarketMarkets(limit: number = 10) {
  const [markets, setMarkets] = useState<SimplifiedPolymarketMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadResolved() {
      try {
        setIsLoading(true);
        const data = await fetchResolvedPolymarketMarkets(limit);
        if (mounted) {
          setMarkets(data.map(simplifyPolymarketMarket));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadResolved();

    return () => {
      mounted = false;
    };
  }, [limit]);

  return { markets, isLoading, error };
}

export function usePolymarketMarketsByCategory(category: string) {
  const [markets, setMarkets] = useState<SimplifiedPolymarketMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadByCategory() {
      try {
        setIsLoading(true);
        const data = await fetchPolymarketMarketsByCategory(category);
        if (mounted) {
          setMarkets(data.map(simplifyPolymarketMarket));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (category) {
      loadByCategory();
    }

    return () => {
      mounted = false;
    };
  }, [category]);

  return { markets, isLoading, error };
}
