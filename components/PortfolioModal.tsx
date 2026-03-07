'use client';

import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Wallet, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Position {
  id: string;
  marketId: number;
  marketTitle?: string;
  outcomeIndex: number;
  outcomeName: string;
  shares: string;
  costTzs: number;
  currentValue?: number;
  pnl?: number;
}

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export default function PortfolioModal({ isOpen, onClose, walletAddress }: PortfolioModalProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchPositions();
    }
  }, [isOpen, walletAddress]);

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/portfolio?address=${walletAddress}`);
      const data = await res.json();
      setPositions(data.positions || []);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || p.costTzs), 0);
  const totalCost = positions.reduce((sum, p) => sum + p.costTzs, 0);
  const totalPnL = totalValue - totalCost;

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
            {/* Header with gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Portfolio</h2>
                  <p className="text-sm text-white/80">Track your positions & P&L</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="grid grid-cols-3 gap-4">
                {/* Total Value Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalValue.toFixed(0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">TZS</p>
                </div>

                {/* Total Cost Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCost.toFixed(0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">TZS</p>
                </div>

                {/* P&L Card */}
                <div className={`rounded-xl p-4 border shadow-sm ${
                  totalPnL >= 0 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      totalPnL >= 0 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {totalPnL >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">P&L</p>
                  </div>
                  <p className={`text-2xl font-bold ${
                    totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)}
                  </p>
                  <p className={`text-xs mt-1 ${
                    totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {totalPnL >= 0 ? '+' : ''}{totalCost > 0 ? ((totalPnL / totalCost) * 100).toFixed(1) : '0.0'}% TZS
                  </p>
                </div>
              </div>
            </div>

            {/* Positions List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No positions yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start trading to see your portfolio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => {
                    const pnl = (position.currentValue || position.costTzs) - position.costTzs;
                    const pnlPercent = (pnl / position.costTzs) * 100;
                    
                    return (
                      <motion.div
                        key={position.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-lg"
                      >
                        {/* P&L Badge */}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                          pnl >= 0 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                        </div>

                        {/* Market Info */}
                        <div className="mb-4 pr-20">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                            {position.marketTitle || `Market #${position.marketId}`}
                          </h3>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {position.outcomeName}
                            </p>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shares</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {parseFloat(position.shares).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {position.costTzs.toFixed(0)} TZS
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">P&L</p>
                            <p className={`font-semibold ${
                              pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)} TZS
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all">
                            View Market
                          </button>
                          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">
                            Sell
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
