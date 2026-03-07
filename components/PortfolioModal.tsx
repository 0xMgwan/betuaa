'use client';

import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
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
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalValue.toFixed(0)} TZS</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCost.toFixed(0)} TZS</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">P&L</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)} TZS
                    </p>
                    {totalPnL >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
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
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No positions yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Start trading to see your portfolio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => {
                    const pnl = (position.currentValue || position.costTzs) - position.costTzs;
                    const pnlPercent = (pnl / position.costTzs) * 100;
                    
                    return (
                      <div
                        key={position.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {position.marketTitle || `Market #${position.marketId}`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {position.outcomeName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)} TZS
                            </p>
                            <p className={`text-sm ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Shares: {parseFloat(position.shares).toFixed(2)}</span>
                          <span>Cost: {position.costTzs.toFixed(0)} TZS</span>
                        </div>
                      </div>
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
