'use client';

import { useAllMarkets } from '@/hooks/useMarkets';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';

export default function MarketList() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Live Markets ({marketCount})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market) => {
          const token = STABLECOINS.baseSepolia.find(
            (t) => t.address.toLowerCase() === market.paymentToken.toLowerCase()
          );
          const closingDate = new Date(Number(market.closingDate) * 1000);
          const isActive = closingDate > new Date();

          return (
            <div
              key={market.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {market.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {market.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Payment Token:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {token?.icon} {token?.symbol || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Closes:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDistanceToNow(closingDate, { addSuffix: true })}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Trade Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
