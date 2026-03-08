import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketNTZSABI from '@/lib/abis/CTFPredictionMarketNTZS.json';
import { baseSepolia } from 'wagmi/chains';
import { BlockchainMarket } from './useMarkets';

const CTF_NTZS_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarketNTZS as `0x${string}`;

export interface MarketOutcome {
  name: string;
  totalShares: bigint;
  price: number; // 0-100
}

export function useMarketDetails(marketId: number) {
  const [outcomes, setOutcomes] = useState<MarketOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch market data from nTZS contract
  const { data: marketData, isLoading: isLoadingMarket } = useReadContract({
    address: CTF_NTZS_ADDRESS,
    abi: CTFPredictionMarketNTZSABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });

  useEffect(() => {
    if (marketData) {
      const market = marketData as any;
      const outcomeCount = Number(market.outcomeCount || 2);
      
      // For binary markets: Yes/No outcomes, default 50/50 pricing
      const outcomeNames = outcomeCount === 2 
        ? ['Yes', 'No'] 
        : Array.from({ length: outcomeCount }, (_, i) => `Outcome ${i + 1}`);

      const formattedOutcomes = outcomeNames.map((name, index) => ({
        name,
        totalShares: BigInt(0), // nTZS contract tracks positions per-user, not globally
        price: Math.round(100 / outcomeCount), // Equal split by default
      }));

      setOutcomes(formattedOutcomes);
      setIsLoading(false);
    }
  }, [marketData]);

  return { outcomes, isLoading: isLoadingMarket || isLoading };
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
    category: 'Crypto',
    yesPrice: (yesOutcome?.price || 50) / 100,
    noPrice: (noOutcome?.price || 50) / 100,
    volume: `${Number(market.totalVolume || 0).toFixed(0)} TZS`,
    endDate: closingDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    participants: 0,
    priceHistory: [],
    description: market.description,
  };
}
