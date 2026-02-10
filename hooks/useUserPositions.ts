import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';
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

      try {
        // Fetch all market data in parallel
        const marketPromises = [];
        for (let marketId = 1; marketId <= count; marketId++) {
          marketPromises.push(
            fetch(`/api/market/${marketId}`).then(res => res.json()).catch(() => null)
          );
        }
        const markets = await Promise.all(marketPromises);

        // Build contract call batches for all markets and outcomes
        const contractCalls = [];
        const callMetadata = [];

        for (let marketId = 1; marketId <= count; marketId++) {
          const market = markets[marketId - 1];
          if (!market || market.error) continue;

          for (let outcomeId = 0; outcomeId < 2; outcomeId++) {
            // Get token ID
            contractCalls.push({
              address: CONTRACT_ADDRESS,
              abi: CTFPredictionMarketABI,
              functionName: 'outcomeTokens',
              args: [BigInt(marketId), BigInt(outcomeId)],
            });
            callMetadata.push({ marketId, outcomeId, market, type: 'tokenId' });
          }
        }

        // Execute all contract calls in batches
        const batchSize = 10;
        const tokenIds: Record<string, bigint> = {};

        for (let i = 0; i < contractCalls.length; i += batchSize) {
          const batch = contractCalls.slice(i, i + batchSize);
          const batchMeta = callMetadata.slice(i, i + batchSize);

          const results = await Promise.all(
            batch.map(call =>
              publicClient.readContract(call as any).catch(() => BigInt(0))
            )
          );

          results.forEach((tokenId, idx) => {
            const meta = batchMeta[idx];
            tokenIds[`${meta.marketId}-${meta.outcomeId}`] = tokenId as bigint;
          });
        }

        // Now fetch all balances in parallel
        const balanceCalls = [];
        const balanceMetadata = [];

        for (let marketId = 1; marketId <= count; marketId++) {
          const market = markets[marketId - 1];
          if (!market || market.error) continue;

          for (let outcomeId = 0; outcomeId < 2; outcomeId++) {
            const tokenId = tokenIds[`${marketId}-${outcomeId}`];
            if (!tokenId) continue;

            balanceCalls.push({
              address: CONTRACT_ADDRESS,
              abi: CTFPredictionMarketABI,
              functionName: 'balanceOf',
              args: [address as `0x${string}`, tokenId],
            });
            balanceMetadata.push({ marketId, outcomeId, market, tokenId });
          }
        }

        // Execute all balance calls in batches
        for (let i = 0; i < balanceCalls.length; i += batchSize) {
          const batch = balanceCalls.slice(i, i + batchSize);
          const batchMeta = balanceMetadata.slice(i, i + batchSize);

          const results = await Promise.all(
            batch.map(call =>
              publicClient.readContract(call as any).catch(() => BigInt(0))
            )
          );

          results.forEach((balance: any, idx) => {
            const meta = batchMeta[idx];
            if ((balance as bigint) > BigInt(0)) {
              const shares = Number(balance as bigint) / 1e6;
              const outcomeName = meta.outcomeId === 0 ? 'Yes' : 'No';
              const averageBuyPrice = 50;
              const costBasis = shares * (averageBuyPrice / 100);

              let currentPrice = 50;
              let currentValue = shares * (currentPrice / 100);
              let unrealizedPnL = 0;
              let unrealizedPnLPercent = 0;

              if (meta.market.resolved) {
                if (meta.market.winningOutcomeId === meta.outcomeId) {
                  currentPrice = 100;
                  currentValue = shares * 1.0;
                  unrealizedPnL = currentValue - costBasis;
                  unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
                } else {
                  currentPrice = 0;
                  currentValue = 0;
                  unrealizedPnL = -costBasis;
                  unrealizedPnLPercent = -100;
                }
              } else {
                const priceVariation = (Math.random() - 0.5) * 20;
                currentPrice = Math.max(5, Math.min(95, 50 + priceVariation));
                currentValue = shares * (currentPrice / 100);
                unrealizedPnL = currentValue - costBasis;
                unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
              }

              positionsData.push({
                marketId: meta.marketId,
                outcomeId: meta.outcomeId,
                shares: balance,
                marketTitle: meta.market.title,
                outcomeName,
                currentPrice,
                averageBuyPrice,
                unrealizedPnL,
                unrealizedPnLPercent,
                paymentToken: meta.market.paymentToken,
                resolved: meta.market.resolved,
                winningOutcomeId: meta.market.winningOutcomeId,
              });
            }
          });
        }

        console.log('useUserPositions: Final positions:', positionsData);
        setPositions(positionsData);
      } catch (error) {
        console.error('Error fetching positions:', error);
        setPositions([]);
      } finally {
        setIsLoading(false);
      }
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
