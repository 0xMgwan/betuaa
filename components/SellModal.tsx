'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { formatUnits } from 'viem';
import { useCTFBurnPositionTokens } from '@/hooks/useCTFMarket';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: {
    marketId: number;
    outcomeId: number;
    outcomeName: string;
    shares: bigint;
    currentPrice: number;
    paymentToken: string;
    marketTitle: string;
  };
}

export default function SellModal({
  isOpen,
  onClose,
  position,
}: SellModalProps) {
  const [amount, setAmount] = useState('');
  const { burnPositionTokens, isPending, isSuccess, error } = useCTFBurnPositionTokens();
  
  // Log errors
  if (error) {
    console.error('Burn error:', error);
  }

  const maxShares = Number(position.shares) / 1e6; // USDC has 6 decimals
  const sharesToSell = amount ? parseFloat(amount) : 0;
  const estimatedPayout = (sharesToSell * position.currentPrice) / 100;

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || sharesToSell <= 0) return;

    try {
      const sharesAmount = BigInt(Math.floor(sharesToSell * 1e6)); // USDC has 6 decimals
      console.log('Selling shares:', { marketId: position.marketId, amount: sharesToSell, sharesAmount: sharesAmount.toString() });
      burnPositionTokens(position.marketId, sharesAmount);
    } catch (error) {
      console.error('Error selling shares:', error);
    }
  };

  // Close modal after successful sell
  if (isSuccess) {
    setTimeout(() => {
      onClose();
      setAmount('');
    }, 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Sell {position.outcomeName} Shares
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Shares Sold!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You sold {amount} shares of {position.outcomeName}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSell} className="space-y-4">
            {/* Market Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Market
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {position.marketTitle}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Shares to Sell
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                min="0"
                max={maxShares}
                disabled={isPending}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Available: {maxShares.toFixed(4)} shares
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(maxShares.toString())}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={isPending}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Payout Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current price:</span>
                <span className="font-medium text-gray-900 dark:text-white">{position.currentPrice}¢</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Estimated payout:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {estimatedPayout.toFixed(4)} tokens
                </span>
              </div>
            </div>

            {/* Warning */}
            {sharesToSell > maxShares && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  You only have {maxShares.toFixed(4)} shares available
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || isPending || sharesToSell <= 0 || sharesToSell > maxShares}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isPending ? 'Selling...' : 'Sell Shares'}
              </button>
            </div>

            {/* Status Message */}
            {isPending && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Selling shares...
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
