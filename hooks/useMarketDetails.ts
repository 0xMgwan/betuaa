import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import PredictionMarketABI from '@/lib/abis/PredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';
import { BlockchainMarket } from './useMarkets';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.predictionMarket as `0x${string}`;

export interface MarketOutcome {
  name: string;
  totalShares: bigint;
  price: number; // 0-100
}

export function useMarketDetails(marketId: number) {
  const [outcomes, setOutcomes] = useState<MarketOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch market outcomes
  const { data: outcomesData, isLoading: isLoadingOutcomes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'getMarketOutcomes',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });

  useEffect(() => {
    if (outcomesData && Array.isArray(outcomesData)) {
      const formattedOutcomes = outcomesData.map((outcome: any, index: number) => {
        // Calculate price based on total shares (simple AMM pricing)
        const totalShares = Number(outcome.totalShares);
        const allShares = outcomesData.reduce((sum: number, o: any) => sum + Number(o.totalShares), 0);
        
        // If no shares yet, default to 50/50
        const price = allShares > 0 ? Math.round((totalShares / allShares) * 100) : 50;

        return {
          name: outcome.name,
          totalShares: outcome.totalShares,
          price: Math.min(Math.max(price, 1), 99), // Clamp between 1-99
        };
      });

      setOutcomes(formattedOutcomes);
      setIsLoading(false);
    }
  }, [outcomesData]);

  return { outcomes, isLoading: isLoadingOutcomes || isLoading };
}

export function convertBlockchainMarketToModalFormat(
  market: BlockchainMarket,
  outcomes: MarketOutcome[]
) {
  const closingDate = new Date(Number(market.closingDate) * 1000);
  
  // For binary markets, assume first outcome is "Yes" and second is "No"
  const yesOutcome = outcomes[0];
  const noOutcome = outcomes[1];

  return {
    id: market.id,
    question: market.title,
    category: 'Crypto', // Default category, could be enhanced
    yesPrice: (yesOutcome?.price || 50) / 100,
    noPrice: (noOutcome?.price || 50) / 100,
    volume: `$${(Number(market.totalVolume) / 1e6).toFixed(1)}K`, // Assuming 6 decimals
    endDate: closingDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    participants: 0, // Would need to track this separately
    priceHistory: [], // Would need historical data
    description: market.description,
  };
}
