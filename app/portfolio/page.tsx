"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SellModal from "@/components/SellModal";
import { useUserPositions } from '@/hooks/useUserPositions';
import { useClaimWinnings } from '@/hooks/usePredictionMarket';
import { STABLECOINS } from '@/lib/contracts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const { positions, activePositions, claimablePositions, isLoading, totalValue, totalPnL, totalPnLPercent } = useUserPositions();
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const { claimWinnings, isPending: isClaiming } = useClaimWinnings();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to view your portfolio.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your positions and performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <DollarSign className="w-4 h-4" />
              Total Value
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalValue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              {totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              Unrealized P&L
            </div>
            <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Active Positions
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {activePositions.length}
            </div>
            {claimablePositions.length > 0 && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                {claimablePositions.length} claimable
              </div>
            )}
          </div>
        </div>

        {/* Positions List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Positions
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                No positions yet
              </p>
              <p className="text-gray-400 dark:text-gray-500">
                Start trading to build your portfolio! 📈
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {positions.map((position, index) => {
                const token = STABLECOINS.baseSepolia.find(
                  (t) => t.address.toLowerCase() === position.paymentToken.toLowerCase()
                );
                const shares = Number(position.shares) / 1e18;
                const currentValue = (shares * position.currentPrice) / 100;
                const isWinning = position.unrealizedPnL >= 0;

                return (
                  <div
                    key={`${position.marketId}-${position.outcomeId}-${index}`}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                          {position.marketTitle}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            position.outcomeName === 'Yes' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {position.outcomeName}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {shares.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          shares
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Current Price
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {position.currentPrice}¢
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Current Value
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {currentValue.toFixed(2)} {token?.symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          P&L
                        </div>
                        <div className={`font-semibold ${isWinning ? 'text-green-600' : 'text-red-600'}`}>
                          {isWinning ? '+' : ''}{position.unrealizedPnL.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          P&L %
                        </div>
                        <div className={`font-semibold ${isWinning ? 'text-green-600' : 'text-red-600'}`}>
                          {position.unrealizedPnLPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!position.resolved ? (
                      <button
                        onClick={() => {
                          setSelectedPosition(position);
                          setShowSellModal(true);
                        }}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Sell Shares
                      </button>
                    ) : position.outcomeId === position.winningOutcomeId ? (
                      <button
                        onClick={() => claimWinnings(position.marketId, position.outcomeId)}
                        disabled={isClaiming}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {isClaiming ? 'Claiming...' : 'Claim Winnings 🎉'}
                      </button>
                    ) : (
                      <div className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium text-center">
                        Market Resolved - No Winnings
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sell Modal */}
      {selectedPosition && (
        <SellModal
          isOpen={showSellModal}
          onClose={() => {
            setShowSellModal(false);
            setSelectedPosition(null);
          }}
          position={selectedPosition}
        />
      )}

      <Footer />
    </div>
  );
}
