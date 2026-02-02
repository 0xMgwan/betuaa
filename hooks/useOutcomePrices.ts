import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '../lib/contracts';
import CTFPredictionMarketABI from '../lib/abis/CTFPredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

interface OutcomePrice {
  yesPrice: number;
  noPrice: number;
}

/**
 * Hook to fetch and calculate outcome prices for a market
 * For CTF markets, prices are calculated based on the total supply of outcome tokens
 * and the market's liquidity pool
 */
export function useOutcomePrices(marketId: number, outcomeIndex: number) {
  const [prices, setPrices] = useState<OutcomePrice>({ yesPrice: 50, noPrice: 50 });

  // Get the outcome token IDs
  const { data: yesTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'outcomeTokens',
    args: [BigInt(marketId), BigInt(outcomeIndex * 2)], // Yes token
    chainId: baseSepolia.id,
  });

  const { data: noTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'outcomeTokens',
    args: [BigInt(marketId), BigInt(outcomeIndex * 2 + 1)], // No token
    chainId: baseSepolia.id,
  });

  // Get total supply for each outcome token (using contract address as holder to estimate total minted)
  const { data: yesSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'balanceOf',
    args: yesTokenId ? [CONTRACT_ADDRESS, yesTokenId] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!yesTokenId,
    },
  });

  const { data: noSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'balanceOf',
    args: noTokenId ? [CONTRACT_ADDRESS, noTokenId] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!noTokenId,
    },
  });

  useEffect(() => {
    if (yesSupply !== undefined && noSupply !== undefined) {
      // Calculate prices based on supply ratio
      // More supply = lower price (more people bought it)
      const yesSupplyNum = Number(formatUnits(yesSupply as bigint, 6));
      const noSupplyNum = Number(formatUnits(noSupply as bigint, 6));
      const totalSupply = yesSupplyNum + noSupplyNum;

      if (totalSupply > 0) {
        // Price is inversely proportional to supply
        // If 70% bought Yes, Yes price should be higher (70¢), No should be lower (30¢)
        const yesRatio = yesSupplyNum / totalSupply;
        const noRatio = noSupplyNum / totalSupply;

        // Convert to cents (0-100)
        const calculatedYesPrice = Math.round(yesRatio * 100);
        const calculatedNoPrice = Math.round(noRatio * 100);

        setPrices({
          yesPrice: calculatedYesPrice || 50,
          noPrice: calculatedNoPrice || 50,
        });
      } else {
        // No trades yet, default to 50/50
        setPrices({ yesPrice: 50, noPrice: 50 });
      }
    }
  }, [yesSupply, noSupply]);

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
