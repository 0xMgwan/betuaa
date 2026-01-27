import { useState, useEffect, useRef } from 'react';
import { SimplifiedPolymarketMarket } from '@/lib/polymarket/types';

interface PriceUpdate {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  timestamp: number;
}

interface UseRealtimePricesOptions {
  markets: SimplifiedPolymarketMarket[];
  enabled?: boolean;
  interval?: number; // in milliseconds
}

export function useRealtimePrices({
  markets,
  enabled = true,
  interval = 30000, // 30 seconds default
}: UseRealtimePricesOptions) {
  const [priceUpdates, setPriceUpdates] = useState<Map<string, PriceUpdate>>(new Map());
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || markets.length === 0) {
      return;
    }

    const fetchPriceUpdates = async () => {
      setIsUpdating(true);
      try {
        // Fetch updated market data from Polymarket API
        const response = await fetch('/api/polymarket/events?limit=100&active=true&closed=false');
        const events = await response.json();

        const updates = new Map<string, PriceUpdate>();
        
        events.forEach((event: any) => {
          if (event.markets && Array.isArray(event.markets)) {
            event.markets.forEach((market: any) => {
              if (market.outcomePrices) {
                try {
                  const prices = typeof market.outcomePrices === 'string' 
                    ? JSON.parse(market.outcomePrices) 
                    : market.outcomePrices;
                  
                  if (Array.isArray(prices) && prices.length >= 2) {
                    updates.set(market.conditionId || market.id, {
                      marketId: market.conditionId || market.id,
                      yesPrice: parseFloat(prices[0]) || 0.5,
                      noPrice: parseFloat(prices[1]) || 0.5,
                      volume: market.volume || market.volumeNum?.toString() || '0',
                      timestamp: Date.now(),
                    });
                  }
                } catch (e) {
                  console.error('Error parsing prices:', e);
                }
              }
            });
          }
        });

        setPriceUpdates(updates);
      } catch (error) {
        console.error('Error fetching price updates:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    // Initial fetch
    fetchPriceUpdates();

    // Set up interval for periodic updates
    intervalRef.current = setInterval(fetchPriceUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [markets, enabled, interval]);

  const getPriceUpdate = (marketId: string): PriceUpdate | undefined => {
    return priceUpdates.get(marketId);
  };

  return {
    priceUpdates,
    isUpdating,
    getPriceUpdate,
  };
}
