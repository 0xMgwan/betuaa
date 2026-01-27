import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export interface UserPosition {
  marketId: number;
  outcomeId: number;
  shares: bigint;
  marketTitle: string;
  outcomeName: string;
  currentPrice: number;
  averageBuyPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  paymentToken: string;
  resolved: boolean;
  winningOutcomeId: number;
}

export function useUserPositions() {
  const { address } = useAccount();
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get total market count from CTF contract
  const { data: marketCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'marketCount',
    chainId: baseSepolia.id,
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  useEffect(() => {
    async function fetchPositions() {
      if (!address || !marketCount) {
        console.log('useUserPositions: Missing address or marketCount', { address, marketCount });
        setPositions([]);
        setIsLoading(false);
        return;
      }

      console.log('useUserPositions: Fetching positions for', address, 'with marketCount', marketCount);
      setIsLoading(true);
      const positionsData: UserPosition[] = [];
      const count = Number(marketCount);

      // Iterate through all markets
      for (let marketId = 1; marketId <= count; marketId++) {
        try {
          // Fetch market data
          const marketResponse = await fetch(`/api/market/${marketId}`);
          if (!marketResponse.ok) continue;
          const market = await marketResponse.json();
          if (market.error) continue;

          // For CTF markets, check YES (0) and NO (1) token balances
          for (let outcomeId = 0; outcomeId < 2; outcomeId++) {
            // Get the actual token ID from the contract mapping
            const tokenId = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CTFPredictionMarketABI,
              functionName: 'outcomeTokens',
              args: [BigInt(marketId), BigInt(outcomeId)],
            }) as bigint;

            console.log(`Market ${marketId}, outcome ${outcomeId}, tokenId ${tokenId}`);

            // Get user's balance of this outcome token
            const balance = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CTFPredictionMarketABI,
              functionName: 'balanceOf',
              args: [address as `0x${string}`, tokenId],
            }) as bigint;

            console.log(`Market ${marketId}, outcome ${outcomeId}, tokenId ${tokenId}, balance: ${balance}`);

            if (balance > BigInt(0)) {
              const shares = Number(balance) / 1e6; // USDC has 6 decimals
              const outcomeName = outcomeId === 0 ? 'Yes' : 'No';
              
              // For now, use 50¢ as default price (CTF markets start at 50¢ for each outcome)
              // In a real implementation, this would fetch from an AMM or price oracle
              const currentPrice = 50;
              const averageBuyPrice = 50; // User minted at 50¢ (1:1 ratio with USDC)
              
              // Calculate values in USDC
              const currentValue = shares * (currentPrice / 100);
              const costBasis = shares * (averageBuyPrice / 100);
              const unrealizedPnL = currentValue - costBasis;
              const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

              console.log(`Found position: market ${marketId}, outcome ${outcomeName}, shares ${shares}, value ${currentValue}`);

              positionsData.push({
                marketId,
                outcomeId,
                shares: balance,
                marketTitle: market.title,
                outcomeName,
                currentPrice,
                averageBuyPrice,
                unrealizedPnL,
                unrealizedPnLPercent,
                paymentToken: market.paymentToken,
                resolved: market.resolved,
                winningOutcomeId: market.winningOutcomeId,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching position for market ${marketId}:`, error);
        }
      }

      console.log('useUserPositions: Final positions:', positionsData);
      setPositions(positionsData);
      setIsLoading(false);
    }

    if (address && marketCount) {
      fetchPositions();
    } else {
      setPositions([]);
      setIsLoading(false);
    }
  }, [marketCount, address]);

  // Calculate portfolio totals
  const totalValue = positions.reduce((sum, pos) => {
    const shares = Number(pos.shares) / 1e6; // USDC has 6 decimals
    const value = shares * (pos.currentPrice / 100);
    return sum + value;
  }, 0);

  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalPnLPercent = positions.length > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  const activePositions = positions.filter(p => !p.resolved);
  const claimablePositions = positions.filter(
    p => p.resolved && p.outcomeId === p.winningOutcomeId
  );

  return {
    positions,
    activePositions,
    claimablePositions,
    isLoading,
    totalValue,
    totalPnL,
    totalPnLPercent,
  };
}
