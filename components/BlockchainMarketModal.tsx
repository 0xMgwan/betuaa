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
import CategoryBadge from './CategoryBadge';
import { BlockchainMarket } from '@/hooks/useMarkets';
import { cleanDescription, extractCategory } from '@/lib/categoryUtils';
import Image from 'next/image';

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

  const change24h = yesOutcome ? ((yesOutcome.price - 50) / 50) * 100 : 0;
  const categoryKey = extractCategory(market.description);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full md:h-auto md:max-h-[90vh] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 md:p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={categoryKey} size="sm" />
              <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ShareButton
                marketId={market.id}
                marketTitle={market.title}
                marketDescription={cleanDescription(market.description)}
              />
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <h2 className="text-base md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {market.title}
          </h2>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
            {cleanDescription(market.description)}
          </p>
        </div>

        {/* Content */}
        <div className="p-2 md:p-6 space-y-2 md:space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Volume</div>
              <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <Image 
                  src="/USDC logo.png" 
                  alt="USDC"
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                />
                {market.totalVolume > BigInt(0) 
                  ? (Number(market.totalVolume) / 1e6).toFixed(1) + 'K USDC'
                  : '0 USDC'
                }
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Traders</div>
              <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-0.5">
                <Users className="w-3 h-3 md:w-5 md:h-5" />
                {market.participantCount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">24h Change</div>
              <div className={`text-sm md:text-xl font-bold flex items-center gap-0.5 ${
                change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {change24h >= 0 ? <TrendingUp className="w-3 h-3 md:w-5 md:h-5" /> : <TrendingDown className="w-3 h-3 md:w-5 md:h-5" />}
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Price History Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Price History</h3>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Yes {yesOutcome?.price || 50}¢</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">No {noOutcome?.price || 50}¢</span>
                </div>
              </div>
            </div>
            <PriceChart data={priceHistory} height={180} />
          </div>

          {/* Trading Section */}
          <div className="grid grid-cols-2 gap-2">
            {/* Yes Option */}
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2 border border-green-200 dark:border-green-800">
              <div className="mb-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                  Buy Yes
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
                className="w-full px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-bold text-xs transition-colors"
              >
                {isActive ? 'Buy Yes' : 'Closed'}
              </button>
            </div>

            {/* No Option */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2 border border-red-200 dark:border-red-800">
              <div className="mb-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                  Buy No
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
                className="w-full px-2 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-bold text-xs transition-colors"
              >
                {isActive ? 'Buy No' : 'Closed'}
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

          {/* Rules Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
              Rules Summary
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              Resolves to <span className="font-semibold text-gray-900 dark:text-white">Yes</span> if event occurs before {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, otherwise <span className="font-semibold text-gray-900 dark:text-white">No</span>.
            </p>
          </div>

          {/* Market Comments */}
          <MarketComments marketId={market.id} marketTitle={market.title} />
        </div>
      </div>
    </div>
  );
}
