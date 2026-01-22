'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Users, DollarSign, Clock, ExternalLink, BarChart3 } from 'lucide-react';
import { useMarketDetails } from '@/hooks/useMarketDetails';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MarketAnalytics from './MarketAnalytics';
import ShareButton from './ShareButton';
import PriceChart from './PriceChart';
import TradingModal from './TradingModal';
import MarketComments from './MarketComments';
import FavoriteButton from './FavoriteButton';
import { BlockchainMarket } from '@/hooks/useMarkets';
import { cleanDescription } from '@/lib/categoryUtils';

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
  const { priceHistory, isLoading: isPriceLoading } = usePriceHistory(market.id);
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 md:p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                Crypto
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {formatDistanceToNow(closingDate, { addSuffix: true })}
              </span>
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
              {market.title}
            </h2>
            <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
              {cleanDescription(market.description)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton
              marketId={market.id}
              marketTitle={market.title}
            />
            <ShareButton
              marketId={market.id}
              marketTitle={market.title}
              marketDescription={cleanDescription(market.description)}
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
        <div className="p-3 md:p-4 space-y-3 md:space-y-4">
          {/* Market Analytics - Moved to Top */}
          <MarketAnalytics
            marketId={market.id}
            totalVolume={Number(market.totalVolume)}
            participantCount={market.participantCount}
            outcomes={outcomes.map((outcome) => ({
              name: outcome.name,
              price: outcome.price,
              totalShares: Number(outcome.totalShares)
            }))}
            tokenSymbol={token?.symbol}
          />

          {/* Trading Section */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {/* Yes Option */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 md:p-4 border border-green-200 dark:border-green-800">
              <div className="mb-2 md:mb-3">
                <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5 md:mb-1">
                  Buy {yesOutcome?.name || 'Yes'}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {yesOutcome?.price || 50}¢
                </div>
              </div>
              <button
                disabled={!isActive}
                onClick={() => {
                  setSelectedOutcome({ id: 0, name: yesOutcome?.name || 'Yes', price: yesOutcome?.price || 50 });
                  setShowTradingModal(true);
                }}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors"
              >
                {isActive ? `Buy ${yesOutcome?.name || 'Yes'}` : 'Market Closed'}
              </button>
            </div>

            {/* No Option */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 md:p-4 border border-red-200 dark:border-red-800">
              <div className="mb-2 md:mb-3">
                <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5 md:mb-1">
                  Buy {noOutcome?.name || 'No'}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                  {noOutcome?.price || 50}¢
                </div>
              </div>
              <button
                disabled={!isActive}
                onClick={() => {
                  setSelectedOutcome({ id: 1, name: noOutcome?.name || 'No', price: noOutcome?.price || 50 });
                  setShowTradingModal(true);
                }}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors"
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 md:p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 text-xs md:text-sm">
              Market Information
            </h3>
            <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs">
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 md:p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 text-xs md:text-base">
              Rules Summary
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-sm">
              This market will resolve based on the outcome specified in the description. 
              Trading is available until {closingDate.toLocaleDateString()}. 
              After resolution, winning shares can be redeemed for {token?.symbol || 'tokens'}.
            </p>
          </div>

          {/* Market Comments */}
          <MarketComments marketId={market.id} marketTitle={market.title} />
        </div>
      </div>
    </div>
  );
}
