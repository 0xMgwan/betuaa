import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import PredictionMarketABI from '@/lib/abis/PredictionMarket.json';

interface PriceDataPoint {
  time: string;
  yes: number;
  no: number;
  timestamp: number;
}

export function usePriceHistory(marketId: number) {
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get current prices
  const { data: yesPrice } = useReadContract({
    address: CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
    abi: PredictionMarketABI as any,
    functionName: 'calculatePrice',
    args: [BigInt(marketId), BigInt(0)],
  });

  const { data: noPrice } = useReadContract({
    address: CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
    abi: PredictionMarketABI as any,
    functionName: 'calculatePrice',
    args: [BigInt(marketId), BigInt(1)],
  });

  useEffect(() => {
    // Generate sample price history for visualization
    // In production, this would fetch from an indexer or event logs
    const generatePriceHistory = () => {
      const now = Date.now();
      const history: PriceDataPoint[] = [];
      const currentYes = yesPrice ? Number(yesPrice) / 1e16 : 50;
      const currentNo = noPrice ? Number(noPrice) / 1e16 : 50;

      // Generate 24 data points (hourly for last 24 hours)
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - i * 60 * 60 * 1000;
        const date = new Date(timestamp);
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        });

        // Add some variance to make it look realistic
        const variance = (Math.random() - 0.5) * 10;
        const yesVal = Math.max(10, Math.min(90, currentYes + variance));
        const noVal = 100 - yesVal;

        history.push({
          time: timeStr,
          yes: Math.round(yesVal),
          no: Math.round(noVal),
          timestamp,
        });
      }

      setPriceHistory(history);
      setIsLoading(false);
    };

    // Generate price history after a short delay to allow contract calls to complete
    // If contract calls fail, still generate with default 50/50 prices
    const timeout = setTimeout(() => {
      generatePriceHistory();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [marketId, yesPrice, noPrice]);

  return { priceHistory, isLoading };
}
