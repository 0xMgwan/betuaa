'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, Award, ExternalLink } from 'lucide-react';
import { fetchAllTrades, fetchMarketTrades } from '@/lib/graphql';

interface Trade {
  id: string;
  user: {
    id: string;
    address: string;
  };
  market?: {
    id: string;
    marketId: string;
    question: string;
  };
  outcomeId: number;
  amount: string;
  type: string;
  timestamp: string;
  transactionHash: string;
}

interface TradeHistoryProps {
  marketId?: string;
  maxItems?: number;
}

export default function TradeHistory({ marketId, maxItems = 20 }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, [marketId]);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      const data = marketId 
        ? await fetchMarketTrades(marketId, maxItems)
        : await fetchAllTrades(maxItems);
      setTrades(data || []);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string, decimals = 6) => {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTradeIcon = (type: string) => {
    switch (type) {
      case 'MINT':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'REDEEM':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'CLAIM':
        return <Award className="w-4 h-4 text-yellow-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTradeColor = (type: string) => {
    switch (type) {
      case 'MINT':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'REDEEM':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'CLAIM':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {marketId ? 'Market Trade History' : 'Recent Trades'}
          </h2>
        </div>
      </div>

      {/* Trade List */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No trades yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className={`p-4 rounded-lg border transition-all hover:scale-[1.01] ${getTradeColor(trade.type)}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    {getTradeIcon(trade.type)}
                  </div>

                  {/* Trade Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {formatAddress(trade.user.address)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {trade.type.toLowerCase()}ed
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${formatAmount(trade.amount)}
                      </span>
                    </div>
                    
                    {trade.market && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {trade.market.question}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(trade.timestamp)}
                      </span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${trade.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        View TX
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Outcome Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    trade.outcomeId === 0
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {trade.outcomeId === 0 ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
