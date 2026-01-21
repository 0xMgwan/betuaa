'use client';

import { TrendingUp, Users, BarChart3, Activity, Trophy, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useAllMarkets } from '@/hooks/useMarkets';

export default function StatsPage() {
  const { stats, isLoading } = usePlatformStats();
  const { markets } = useAllMarkets();

  // Get top markets by volume
  const topMarkets = [...markets]
    .sort((a, b) => Number(b.totalVolume) - Number(a.totalVolume))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time analytics and insights from Stretch prediction markets
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Volume */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    +{((stats.volume24h / stats.totalVolume) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  ${stats.totalVolume.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Volume
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  ${stats.volume24h.toFixed(2)} in 24h
                </div>
              </div>

              {/* Total Markets */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    +{stats.markets24h} today
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.totalMarkets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Markets
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {stats.activeMarkets} active, {stats.resolvedMarkets} resolved
                </div>
              </div>

              {/* Total Traders */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Active
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.totalTraders}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Traders
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Across all markets
                </div>
              </div>

              {/* Avg Market Size */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Average
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  ${(stats.totalVolume / stats.totalMarkets || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Market Size
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Per market volume
                </div>
              </div>
            </div>

            {/* Top Markets Leaderboard */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Top Markets by Volume
                </h2>
              </div>

              <div className="space-y-4">
                {topMarkets.map((market, index) => (
                  <div
                    key={market.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Rank */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
                    }`}>
                      #{index + 1}
                    </div>

                    {/* Market Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {market.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {market.participantCount || 0} traders
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {market.resolved ? 'Resolved' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${(Number(market.totalVolume) / 1e6).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Volume
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Platform Growth
              </h2>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Growth chart coming soon</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
