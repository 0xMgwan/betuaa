'use client';

import { useAllMarkets, BlockchainMarket } from '@/hooks/useMarkets';
import { useMarketDetails } from '@/hooks/useMarketDetails';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface MarketListProps {
  onMarketClick?: (market: BlockchainMarket) => void;
}

function MarketCard({ market, onMarketClick }: { market: BlockchainMarket; onMarketClick?: (market: BlockchainMarket) => void }) {
  const { outcomes } = useMarketDetails(market.id);
  const token = STABLECOINS.baseSepolia.find(
    (t) => t.address.toLowerCase() === market.paymentToken.toLowerCase()
  );
  const closingDate = new Date(Number(market.closingDate) * 1000);
  const isActive = closingDate > new Date();

  const yesOutcome = outcomes[0];
  const noOutcome = outcomes[1];

  return (
    <div
      onClick={() => onMarketClick?.(market)}
      className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg"
    >
      {/* Header with category badge and icon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded uppercase">
            Crypto
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            • {formatDistanceToNow(closingDate, { addSuffix: true })}
          </span>
        </div>
        <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 line-clamp-2 leading-tight">
        {market.title}
      </h3>

      {/* Yes/No Prices - Compact */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Yes</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {yesOutcome?.price || 50}¢
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">No</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {noOutcome?.price || 50}¢
          </div>
        </div>
      </div>

      {/* Volume info at bottom */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Volume: <span className="font-semibold text-gray-900 dark:text-white">${(Number(market.totalVolume) / 1e6).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketList({ onMarketClick }: MarketListProps) {
  const { markets, isLoading, marketCount } = useAllMarkets();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No markets created yet. Be the first to create one! 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} onMarketClick={onMarketClick} />
      ))}
    </div>
  );
}
