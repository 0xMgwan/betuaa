import { useState, useEffect } from 'react';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface PriceHistoryData {
  yes: PricePoint[];
  no: PricePoint[];
}

export function usePolymarketPriceHistory(marketId: string, enabled: boolean = true) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData>({ yes: [], no: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !marketId) return;

    const fetchPriceHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch price history from Polymarket API
        // Note: This is a placeholder - you'll need to use the actual Polymarket price history endpoint
        const response = await fetch(`https://clob.polymarket.com/prices-history?market=${marketId}&interval=1h&fidelity=60`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch price history');
        }

        const data = await response.json();
        
        // Transform the data into our format
        // This will depend on the actual API response structure
        const transformedData: PriceHistoryData = {
          yes: data.history?.map((point: any) => ({
            timestamp: point.t,
            price: parseFloat(point.p),
          })) || [],
          no: data.history?.map((point: any) => ({
            timestamp: point.t,
            price: 1 - parseFloat(point.p),
          })) || [],
        };

        setPriceHistory(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError(err as Error);
        // Fallback to generating synthetic data
        generateSyntheticHistory();
      } finally {
        setIsLoading(false);
      }
    };

    const generateSyntheticHistory = () => {
      // Generate 24 hours of synthetic price data
      const now = Date.now();
      const points: PricePoint[] = [];
      
      for (let i = 24; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const basePrice = 0.5;
        const variation = (Math.random() - 0.5) * 0.2;
        points.push({
          timestamp,
          price: Math.max(0.1, Math.min(0.9, basePrice + variation)),
        });
      }

      setPriceHistory({
        yes: points,
        no: points.map(p => ({ ...p, price: 1 - p.price })),
      });
    };

    fetchPriceHistory();
  }, [marketId, enabled]);

  return {
    priceHistory,
    isLoading,
    error,
  };
}
