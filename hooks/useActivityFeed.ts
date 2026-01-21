import { useState, useEffect } from 'react';
import { useAllMarkets } from './useMarkets';

interface Activity {
  id: string;
  type: 'trade' | 'market_created' | 'market_resolved' | 'claim';
  user: string;
  marketTitle: string;
  amount?: number;
  outcome?: string;
  timestamp: number;
}

export function useActivityFeed() {
  const { markets } = useAllMarkets();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!markets.length) return;

    // Generate sample activities based on markets
    // In production, this would come from event logs or an indexer
    const generatedActivities: Activity[] = [];
    const now = Date.now();

    markets.forEach((market, index) => {
      // Market created activity
      generatedActivities.push({
        id: `created-${market.id}`,
        type: 'market_created',
        user: market.creator.slice(0, 6) + '...' + market.creator.slice(-4),
        marketTitle: market.title,
        timestamp: now - (markets.length - index) * 60 * 60 * 1000, // Stagger by hours
      });

      // Add some trade activities for markets with volume
      if (Number(market.totalVolume) > 0) {
        generatedActivities.push({
          id: `trade-${market.id}-1`,
          type: 'trade',
          user: market.creator.slice(0, 6) + '...' + market.creator.slice(-4),
          marketTitle: market.title,
          amount: Number(market.totalVolume) / 1e6,
          outcome: 'Yes',
          timestamp: now - (markets.length - index) * 45 * 60 * 1000,
        });
      }

      // Add resolved market activities
      if (market.resolved) {
        generatedActivities.push({
          id: `resolved-${market.id}`,
          type: 'market_resolved',
          user: 'System',
          marketTitle: market.title,
          outcome: market.winningOutcomeId === 0 ? 'Yes' : 'No',
          timestamp: now - (markets.length - index) * 30 * 60 * 1000,
        });
      }
    });

    // Sort by timestamp (most recent first)
    generatedActivities.sort((a, b) => b.timestamp - a.timestamp);

    setActivities(generatedActivities);
  }, [markets]);

  return { activities };
}
