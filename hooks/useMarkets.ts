import { useEffect, useState, useCallback, useRef } from 'react';

export interface BlockchainMarket {
  id: number;
  title: string;
  description: string;
  creator: string;
  paymentToken: string;
  closingDate: string;
  status: 'Active' | 'Resolved' | 'Canceled';
  resolved: boolean;
  canceled: boolean;
  winningOutcomeId: number;
  totalVolume?: string;
  participantCount?: number;
  platformFeeBps: number;
  creatorFeeBps: number;
  image?: string;
}

const REFETCH_INTERVAL = 15_000; // 15 seconds — reduces RPC load during testing

export function useAllMarkets() {
  const [markets, setMarkets] = useState<BlockchainMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketCount, setMarketCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.markets) {
        setMarkets(data.markets);
        setMarketCount(data.total ?? data.markets.length);
      }
    } catch (error) {
      console.error('Error fetching markets batch:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchMarkets();
    intervalRef.current = setInterval(fetchMarkets, REFETCH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMarkets]);

  return { markets, isLoading, marketCount };
}

export function useUserMarkets(userAddress?: string) {
  const { markets, isLoading } = useAllMarkets();

  const userMarkets = markets.filter(
    (market: BlockchainMarket) => market.creator.toLowerCase() === userAddress?.toLowerCase()
  );

  return { markets: userMarkets, isLoading };
}
