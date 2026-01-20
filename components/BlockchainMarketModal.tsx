'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { BlockchainMarket } from '@/hooks/useMarkets';
import { useMarketDetails } from '@/hooks/useMarketDetails';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';
import TradingModal from './TradingModal';
import ShareButton from './ShareButton';

interface BlockchainMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: BlockchainMarket;
}

export default function BlockchainMarketModal({
  isOpen,
  onClose,
  market,
}: BlockchainMarketModalProps) {
  const { outcomes, isLoading } = useMarketDetails(market.id);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<{ id: number; name: string; price: number } | null>(null);
  
  if (!isOpen) return null;

  const token = STABLECOINS.baseSepolia.find(
    (t) => t.address.toLowerCase() === market.paymentToken.toLowerCase()
  );

  const closingDate = new Date(Number(market.closingDate) * 1000);
  const isActive = closingDate > new Date();

  // Get Yes/No outcomes (assuming binary market)
  const yesOutcome = outcomes[0];
  const noOutcome = outcomes[1];

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm font-medium rounded-full">
                Crypto
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {formatDistanceToNow(closingDate, { addSuffix: true })}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {market.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {market.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton
              marketId={market.id}
              marketTitle={market.title}
              marketDescription={market.description}
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Volume
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                $ ${(Number(market.totalVolume) / 1e6).toFixed(1)}M
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Traders
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <span>👥</span> 0
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                24h Change
              </div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>📈</span> +0.0%
              </div>
            </div>
          </div>

          {/* Price History Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Price History
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  Yes {yesOutcome?.price || 50}¢
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  No {noOutcome?.price || 50}¢
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-40 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Price history chart coming soon
              </p>
            </div>
          </div>

          {/* Trading Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Yes Option */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="mb-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Buy {yesOutcome?.name || 'Yes'}
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {yesOutcome?.price || 50}¢
                </div>
              </div>
              <button
                disabled={!isActive}
                onClick={() => {
                  setSelectedOutcome({ id: 0, name: yesOutcome?.name || 'Yes', price: yesOutcome?.price || 50 });
                  setShowTradingModal(true);
                }}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {isActive ? `Buy ${yesOutcome?.name || 'Yes'}` : 'Market Closed'}
              </button>
            </div>

            {/* No Option */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="mb-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Buy {noOutcome?.name || 'No'}
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {noOutcome?.price || 50}¢
                </div>
              </div>
              <button
                disabled={!isActive}
                onClick={() => {
                  setSelectedOutcome({ id: 1, name: noOutcome?.name || 'No', price: noOutcome?.price || 50 });
                  setShowTradingModal(true);
                }}
                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {isActive ? `Buy ${noOutcome?.name || 'No'}` : 'Market Closed'}
              </button>
            </div>
          </div>

          {/* Trading Modal */}
          {selectedOutcome && (
            <TradingModal
              isOpen={showTradingModal}
              onClose={() => {
                setShowTradingModal(false);
                setSelectedOutcome(null);
              }}
              marketId={market.id}
              outcomeId={selectedOutcome.id}
              outcomeName={selectedOutcome.name}
              currentPrice={selectedOutcome.price}
              paymentToken={market.paymentToken}
              tokenSymbol={token?.symbol || 'USDC'}
              tokenDecimals={token?.decimals || 6}
            />
          )}

          {/* Market Information */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
              Market Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Market ID:</span>
                <span className="font-medium text-gray-900 dark:text-white">#{market.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Creator:</span>
                <span className="font-mono text-gray-900 dark:text-white text-xs">
                  {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Closes:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Creator Fee:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {market.creatorFeePercent / 100}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform Fee:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {market.platformFeePercent / 100}%
                </span>
              </div>
            </div>
          </div>

          {/* Rules Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Rules Summary
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              This market will resolve based on the outcome specified in the description. 
              Trading is available until {closingDate.toLocaleDateString()}. 
              After resolution, winning shares can be redeemed for {token?.symbol || 'tokens'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
