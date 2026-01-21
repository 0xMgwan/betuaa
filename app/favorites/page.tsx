'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';
import { useAllMarkets } from '@/hooks/useMarkets';
import CompactMarketCard from '@/components/CompactMarketCard';

export default function FavoritesPage() {
  const { address } = useAccount();
  const { markets: blockchainMarkets } = useAllMarkets();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    if (address) {
      const favorites = JSON.parse(localStorage.getItem(`favorites_${address}`) || '[]');
      setFavoriteIds(favorites);
    }
  }, [address]);

  const favoriteMarkets = blockchainMarkets.filter(market => 
    favoriteIds.includes(market.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar
        searchQuery=""
        onSearchChange={() => {}}
        showFilters={false}
        onToggleFilters={() => {}}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        sortBy="volume"
        onSortChange={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Favorite Markets
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Quick access to markets you're watching
          </p>
        </div>

        {/* Content */}
        {!address ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your wallet to save and view your favorite markets
            </p>
          </div>
        ) : favoriteMarkets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Favorites Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start adding markets to your favorites by clicking the star icon
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              Browse Markets
            </a>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {favoriteMarkets.length} {favoriteMarkets.length === 1 ? 'market' : 'markets'} saved
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteMarkets.map((market) => {
                const closingDate = new Date(Number(market.closingDate) * 1000);
                const isActive = closingDate > new Date() && !market.resolved;

                return (
                  <CompactMarketCard
                    key={market.id}
                    id={market.id}
                    question={market.title}
                    category="CRYPTO"
                    yesPrice={50}
                    noPrice={50}
                    volume={`$${(Number(market.totalVolume) / 1e6).toFixed(2)}M`}
                    endDate={closingDate.toLocaleDateString()}
                    trend="up"
                    priceHistory={[]}
                    onClick={() => {}}
                    isBlockchain={true}
                    status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
