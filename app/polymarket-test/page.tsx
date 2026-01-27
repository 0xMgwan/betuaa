'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CompactMarketCard from '@/components/CompactMarketCard';
import {
  usePolymarketMarkets,
  useTrendingPolymarketMarkets,
  useResolvedPolymarketMarkets,
} from '@/hooks/usePolymarketData';
import { TrendingUp, CheckCircle, Activity } from 'lucide-react';

export default function PolymarketTestPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'trending' | 'resolved'>('trending');

  const { markets: activeMarkets, isLoading: loadingActive } = usePolymarketMarkets({
    limit: 20,
    active: true,
  });

  const { markets: trendingMarkets, isLoading: loadingTrending } = useTrendingPolymarketMarkets(20);

  const { markets: resolvedMarkets, isLoading: loadingResolved } = useResolvedPolymarketMarkets(20);

  const currentMarkets =
    activeTab === 'active'
      ? activeMarkets
      : activeTab === 'trending'
      ? trendingMarkets
      : resolvedMarkets;

  const isLoading =
    activeTab === 'active'
      ? loadingActive
      : activeTab === 'trending'
      ? loadingTrending
      : loadingResolved;

  const generatePriceHistory = (yesPrice: number, noPrice: number) => {
    return Array.from({ length: 10 }, (_, i) => ({
      time: `${i}h`,
      yes: yesPrice * 100 + (Math.random() - 0.5) * 10,
      no: noPrice * 100 + (Math.random() - 0.5) * 10,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Polymarket Data Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Real-time markets from Polymarket via Gamma API
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'trending'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Active Markets
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'resolved'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Resolved
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Polymarket data...</p>
          </div>
        )}

        {/* Markets Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentMarkets.map((market) => {
              const volumeNum = parseFloat(market.volume || '0');
              const volumeDisplay = volumeNum > 1000000 
                ? `${(volumeNum / 1000000).toFixed(1)}M USDC`
                : volumeNum > 1000
                ? `${(volumeNum / 1000).toFixed(1)}K USDC`
                : `${volumeNum.toFixed(0)} USDC`;

              return (
                <CompactMarketCard
                  key={market.id}
                  id={parseInt(market.id.slice(0, 8), 16)} // Convert condition_id to number
                  question={market.question}
                  category={market.category}
                  yesPrice={market.yesPrice}
                  noPrice={market.noPrice}
                  volume={volumeDisplay}
                  endDate={new Date(market.endDate).toLocaleDateString()}
                  trend={market.yesPrice > 0.5 ? 'up' : 'down'}
                  priceHistory={generatePriceHistory(market.yesPrice, market.noPrice)}
                  onClick={() => {
                    if (market.slug) {
                      window.open(`https://polymarket.com/event/${market.slug}`, '_blank');
                    }
                  }}
                  status={market.resolved ? 'resolved' : market.active ? 'active' : 'closed'}
                />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && currentMarkets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No markets found</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Markets</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeMarkets.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trending Markets</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {trendingMarkets.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Resolved Markets</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {resolvedMarkets.length}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
