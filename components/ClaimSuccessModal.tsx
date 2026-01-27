'use client';

import { CheckCircle, X, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from './ui/card';
import Image from 'next/image';

interface ClaimSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  shares: number;
  payout: number;
  tokenSymbol: string;
}

export default function ClaimSuccessModal({
  isOpen,
  onClose,
  marketTitle,
  shares,
  payout,
  tokenSymbol,
}: ClaimSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative bg-white dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Winnings Claimed! 🎉
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your winnings have been successfully transferred to your wallet
          </p>

          {/* Market Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Market
            </div>
            <div className="font-medium text-gray-900 dark:text-white mb-4">
              {marketTitle}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Shares
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {shares.toFixed(2)}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  Payout
                </div>
                <div className="flex items-center gap-2 text-lg font-bold text-green-600 dark:text-green-400">
                  <Image 
                    src="/USDC logo.png" 
                    alt="USDC" 
                    width={24} 
                    height={24}
                    className="rounded-full"
                  />
                  {payout.toFixed(2)} {tokenSymbol}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View Markets
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
