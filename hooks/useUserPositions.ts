import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import PredictionMarketABI from '@/lib/abis/PredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.predictionMarket as `0x${string}`;

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

  // Get user's markets (markets they've traded in)
  const { data: userMarkets } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'getUserMarkets',
    args: [address as `0x${string}`],
    chainId: baseSepolia.id,
  });

  useEffect(() => {
    async function fetchPositions() {
      if (!userMarkets || !Array.isArray(userMarkets) || userMarkets.length === 0) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const positionsData: UserPosition[] = [];

      for (const marketId of userMarkets) {
        try {
          // Fetch market data
          const marketResponse = await fetch(`/api/market/${marketId}`);
          const market = await marketResponse.json();

          // For each outcome in the market, check user's position
          for (let outcomeId = 0; outcomeId < market.outcomes.length; outcomeId++) {
            // Fetch user's position for this outcome
            const positionResponse = await fetch(
              `/api/position/${marketId}/${outcomeId}/${address}`
            );
            const position = await positionResponse.json();

            if (position.shares > 0) {
              // Calculate current value and P&L
              const currentPrice = market.outcomes[outcomeId].price || 50;
              const shares = Number(position.shares) / 1e18; // Convert from wei
              const averageBuyPrice = position.averageBuyPrice || currentPrice;
              const currentValue = (shares * currentPrice) / 100;
              const costBasis = (shares * averageBuyPrice) / 100;
              const unrealizedPnL = currentValue - costBasis;
              const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

              positionsData.push({
                marketId: Number(marketId),
                outcomeId,
                shares: BigInt(position.shares),
                marketTitle: market.title,
                outcomeName: market.outcomes[outcomeId].name,
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

      setPositions(positionsData);
      setIsLoading(false);
    }

    if (address) {
      fetchPositions();
    } else {
      setPositions([]);
      setIsLoading(false);
    }
  }, [userMarkets, address]);

  // Calculate portfolio totals
  const totalValue = positions.reduce((sum, pos) => {
    const value = (Number(pos.shares) / 1e18 * pos.currentPrice) / 100;
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
