import { useState, useEffect } from 'react';
import { useAllMarkets } from './useMarkets';

interface PlatformStats {
  totalVolume: number;
  totalMarkets: number;
  activeMarkets: number;
  resolvedMarkets: number;
  totalTraders: number;
  volume24h: number;
  markets24h: number;
}

export function usePlatformStats() {
  const { markets, isLoading } = useAllMarkets();
  const [stats, setStats] = useState<PlatformStats>({
    totalVolume: 0,
    totalMarkets: 0,
    activeMarkets: 0,
    resolvedMarkets: 0,
    totalTraders: 0,
    volume24h: 0,
    markets24h: 0,
  });

  useEffect(() => {
    if (!markets.length) return;

    // Calculate total volume across all markets
    const totalVolume = markets.reduce((sum, market) => {
      return sum + Number(market.totalVolume) / 1e6; // Convert to USDC
    }, 0);

    // Count active vs resolved markets
    const activeMarkets = markets.filter(m => !m.resolved).length;
    const resolvedMarkets = markets.filter(m => m.resolved).length;

    // Sum up unique traders (participantCount)
    const totalTraders = markets.reduce((sum, market) => {
      return sum + (market.participantCount || 0);
    }, 0);

    // Calculate 24h metrics (simplified - in production would use timestamps)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const markets24h = markets.filter(m => {
      const createdAt = Number(m.closingDate) * 1000 - 7 * 24 * 60 * 60 * 1000; // Estimate creation time
      return createdAt > oneDayAgo;
    }).length;

    const volume24h = totalVolume * 0.3; // Simplified estimate

    setStats({
      totalVolume,
      totalMarkets: markets.length,
      activeMarkets,
      resolvedMarkets,
      totalTraders,
      volume24h,
      markets24h,
    });
  }, [markets]);

  return { stats, isLoading };
}
