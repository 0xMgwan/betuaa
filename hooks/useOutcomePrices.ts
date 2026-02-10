import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '../lib/contracts';
import CTFPredictionMarketABI from '../lib/abis/CTFPredictionMarketV2.json';
import { baseSepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

interface OutcomePrice {
  yesPrice: number;
  noPrice: number;
}

/**
 * Hook to fetch and calculate outcome prices for a market
 * For CTF markets, prices are calculated based on the market's current state
 */
export function useOutcomePrices(marketId: number, outcomeIndex: number) {
  const [prices, setPrices] = useState<OutcomePrice>({ yesPrice: 50, noPrice: 50 });

  // Get the market data which includes outcome information
  const { data: marketData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });

  useEffect(() => {
    if (marketData) {
      // For now, use a simple calculation based on outcome index
      // In a real scenario, you'd calculate this from the AMM bonding curve
      // Default to 50/50 split, but this can be enhanced with actual pool data
      
      // Simulate price variation based on outcome index for demo purposes
      // In production, fetch actual prices from the contract's pricing function
      const basePrice = 50;
      const variation = (outcomeIndex % 2) * 10; // Slight variation per outcome
      
      setPrices({
        yesPrice: Math.max(10, Math.min(90, basePrice + variation)),
        noPrice: Math.max(10, Math.min(90, basePrice - variation)),
      });
    }
  }, [marketData, outcomeIndex]);

  return prices;
}

/**
 * Hook to fetch prices for all outcomes in a custom outcome market
 */
export function useAllOutcomePrices(marketId: number, outcomeCount: number) {
  const [allPrices, setAllPrices] = useState<OutcomePrice[]>([]);

  // Fetch prices for each outcome
  const outcomePrices = Array.from({ length: outcomeCount }, (_, i) => 
    useOutcomePrices(marketId, i)
  );

  useEffect(() => {
    setAllPrices(outcomePrices);
  }, [outcomePrices]);

  return allPrices;
}
