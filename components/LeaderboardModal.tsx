'use client';

import React, { useEffect, useState } from 'react';
import { X, Trophy, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  username: string;
  walletAddress: string;
  totalPnL: number;
  winRate: number;
  totalTrades: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, timeframe]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      const data = await res.json();
      setLeaders(data.leaders || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className={`w-5 h-5 ${getRankColor(rank)}`} />;
    return <span className="text-sm font-semibold text-gray-500">#{rank}</span>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Leaderboard
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Timeframe Selector */}
              <div className="flex gap-2">
                {(['day', 'week', 'month', 'all'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tf === 'day' ? '24h' : tf === 'week' ? '7d' : tf === 'month' ? '30d' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : leaders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No traders yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Be the first to make a trade!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaders.map((leader) => (
                    <motion.div
                      key={leader.walletAddress}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: leader.rank * 0.05 }}
                      className={`p-4 rounded-xl border transition-all ${
                        leader.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-12 flex items-center justify-center">
                          {getRankIcon(leader.rank)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {leader.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {leader.walletAddress.slice(0, 6)}...{leader.walletAddress.slice(-4)}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <p className={`text-lg font-bold ${leader.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {leader.totalPnL >= 0 ? '+' : ''}{leader.totalPnL.toFixed(0)} TZS
                            </p>
                            {leader.totalPnL >= 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span>{leader.winRate.toFixed(0)}% Win</span>
                            <span>•</span>
                            <span>{leader.totalTrades} Trades</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
