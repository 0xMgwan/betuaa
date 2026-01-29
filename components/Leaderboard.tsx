'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, Activity, Medal } from 'lucide-react';
import { fetchTopTraders, fetchTopProfitTraders } from '@/lib/graphql';

interface Trader {
  id: string;
  address: string;
  totalVolume: string;
  totalPnL: string;
  marketsTraded: number;
  positionCount: number;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'volume' | 'profit'>('volume');
  const [traders, setTraders] = useState<Trader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = activeTab === 'volume' 
        ? await fetchTopTraders(10)
        : await fetchTopProfitTraders(10);
      setTraders(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
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

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-bold">{index + 1}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('volume')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'volume'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top Volume
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profit'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Top Profit
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : traders.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No traders yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {traders.map((trader, index) => (
              <div
                key={trader.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.02] ${
                  index < 3
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-10">
                  {getMedalIcon(index)}
                </div>

                {/* Trader Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {formatAddress(trader.address)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>{trader.marketsTraded} markets</span>
                    <span>•</span>
                    <span>{trader.positionCount} positions</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  {activeTab === 'volume' ? (
                    <>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ${formatAmount(trader.totalVolume)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Volume
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`text-lg font-bold ${
                        Number(trader.totalPnL) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {Number(trader.totalPnL) >= 0 ? '+' : ''}${formatAmount(trader.totalPnL)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total P&L
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
