import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

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

  // Get total market count with refetch enabled
  const { data: marketCount, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'marketCount',
    chainId: baseSepolia.id,
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Log market count for debugging
  useEffect(() => {
    console.log('CTF Market Count:', marketCount?.toString());
  }, [marketCount]);

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
        console.log('Fetched markets from API:', fetchedMarkets);
        // Filter out null markets and markets with errors
        const validMarkets = fetchedMarkets.filter(m => m && !m.error && m.title);
        console.log('Valid markets after filtering:', validMarkets);
        setMarkets(validMarkets);
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
