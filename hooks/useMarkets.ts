import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import PredictionMarketABI from '@/lib/abis/PredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.predictionMarket as `0x${string}`;

export interface BlockchainMarket {
  id: number;
  title: string;
  description: string;
  creator: string;
  paymentToken: string;
  closingDate: bigint;
  resolved: boolean;
  winningOutcomeId: number;
  totalVolume: bigint;
  participantCount: number;
  creatorFeePercent: number;
  platformFeePercent: number;
}

export function useAllMarkets() {
  const [markets, setMarkets] = useState<BlockchainMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get total market count
  const { data: marketCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'marketCount',
    chainId: baseSepolia.id,
  });

  useEffect(() => {
    async function fetchMarkets() {
      if (!marketCount) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const count = Number(marketCount);
      const marketPromises = [];

      // Fetch all markets (starting from ID 1)
      for (let i = 1; i <= count; i++) {
        marketPromises.push(
          fetch(`/api/market/${i}`).then(res => res.json())
        );
      }

      try {
        const fetchedMarkets = await Promise.all(marketPromises);
        setMarkets(fetchedMarkets.filter(m => m !== null));
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarkets();
  }, [marketCount]);

  return { markets, isLoading, marketCount: Number(marketCount || 0) };
}

export function useUserMarkets(userAddress?: string) {
  const { markets, isLoading } = useAllMarkets();

  const userMarkets = markets.filter(
    market => market.creator.toLowerCase() === userAddress?.toLowerCase()
  );

  return { markets: userMarkets, isLoading };
}
