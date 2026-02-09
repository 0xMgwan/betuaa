'use client';

import { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Users, DollarSign, Clock, ExternalLink, BarChart3, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketDetails } from '@/hooks/useMarketDetails';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { useUserPositions } from '@/hooks/useUserPositions';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MarketAnalytics from './MarketAnalytics';
import ShareButton from './ShareButton';
import PriceChart from './PriceChart';
import CLOBTradingModal from './CLOBTradingModal';
import OrderBookPanel from './OrderBookPanel';
import MarketComments from './MarketComments';
import FavoriteButton from './FavoriteButton';
import CategoryBadge from './CategoryBadge';
import { BlockchainMarket } from '@/hooks/useMarkets';
import { cleanDescription, extractCategory, extractResolutionType, extractCustomOutcomes } from '@/lib/categoryUtils';
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
  const { positions } = useUserPositions();
  const [showCLOBModal, setShowCLOBModal] = useState(false);
  const [selectedCLOBOutcome, setSelectedCLOBOutcome] = useState<{ index: number; name: string } | null>(null);

  // Determine outcomes list (standard Yes/No or custom multi-outcome)
  const resolutionType = extractResolutionType(market.description);
  const customOutcomes = extractCustomOutcomes(market.description);
  const isCustomMarket = resolutionType === 'custom' && customOutcomes.length > 0;

  const outcomesList = useMemo(() => {
    if (isCustomMarket) {
      return customOutcomes.map((name, index) => ({ index, name }));
    }
    return [
      { index: 0, name: 'Yes' },
      { index: 1, name: 'No' },
    ];
  }, [isCustomMarket, customOutcomes]);

  // Colors for multi-outcome buttons
  const outcomeColors = [
    'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
    'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
    'from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700',
  ];
  
  // Use Graph data as primary source, positions as fallback
  const displayVolume = useMemo(() => {
    // Primary: Use subgraph data (total volume from all users)
    if (Number(market.totalVolume) > 0) {
      return (Number(market.totalVolume) / 1e6).toFixed(2);
    }
    
    // Fallback: Calculate from current user's positions only
    const marketPositions = positions.filter(p => p.marketId === market.id);
    if (marketPositions.length === 0) return '0';
    
    const userVolume = marketPositions.reduce((sum, pos) => {
      return sum + (Number(pos.shares) / 1e6);
    }, 0);
    
    return userVolume.toFixed(2);
  }, [market.totalVolume, positions, market.id]);
  
  const displayTraders = useMemo(() => {
    // Primary: Use subgraph data (total unique traders)
    if (market.participantCount > 0) {
      return market.participantCount;
    }
    
    // Fallback: Show 1 if current user has positions
    const marketPositions = positions.filter(p => p.marketId === market.id);
    return marketPositions.length > 0 ? 1 : 0;
  }, [market.participantCount, positions, market.id]);
  
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
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl max-w-4xl w-full md:h-auto md:max-h-[90vh] max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Header with gradient background */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b border-white/10 p-3.5 md:p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={categoryKey} size="sm" />
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-white/90 text-[11px] md:text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm"
                >
                  <Clock className="w-3 h-3" />
                  {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </motion.span>
              </div>
              <div className="flex items-center gap-2">
                <ShareButton
                  marketId={market.id}
                  marketTitle={market.title}
                  marketDescription={cleanDescription(market.description)}
                />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 md:p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-2xl font-black text-white mb-1.5 md:mb-2 leading-tight"
            >
              {market.title}
            </motion.h2>
          </div>

          {/* Content */}
          <div className="p-3.5 md:p-6 space-y-3 md:space-y-6">
            {/* Enhanced Stats Row with glass morphism */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-2.5 md:p-4 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm"
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Volume</div>
                <div className="text-sm md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Image 
                    src="/USDC logo.png" 
                    alt="USDC"
                    width={16}
                    height={16}
                    className="w-4 h-4 md:w-5 md:h-5 rounded-full"
                  />
                  {displayVolume} USDC
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-2.5 md:p-4 border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm"
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Traders</div>
                <div className="text-sm md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  {displayTraders.toLocaleString()}
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`bg-gradient-to-br rounded-xl p-2.5 md:p-4 border backdrop-blur-sm ${
                  change24h >= 0 
                    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50' 
                    : 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/50'
                }`}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">24h Change</div>
                <div className={`text-sm md:text-xl font-black flex items-center gap-1.5 ${
                  change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {change24h >= 0 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}%
                </div>
              </motion.div>
            </div>

            {/* Order Books + Buy Buttons (dynamic per outcome) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className={`grid gap-3 ${outcomesList.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : outcomesList.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                {outcomesList.map((outcome) => (
                  <OrderBookPanel
                    key={outcome.index}
                    marketId={market.id}
                    outcomeIndex={outcome.index}
                    outcomeName={outcome.name}
                    maxLevels={outcomesList.length > 2 ? 4 : 6}
                    compact={true}
                  />
                ))}
              </div>
              <div className={`flex gap-2 mt-3 ${outcomesList.length > 3 ? 'flex-wrap' : ''}`}>
                {outcomesList.map((outcome) => (
                  <motion.button
                    key={outcome.index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!isActive}
                    onClick={() => {
                      setSelectedCLOBOutcome({ index: outcome.index, name: outcome.name });
                      setShowCLOBModal(true);
                    }}
                    className={`flex-1 py-2.5 bg-gradient-to-r ${outcomeColors[outcome.index % outcomeColors.length]} disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:cursor-not-allowed ${outcomesList.length > 3 ? 'min-w-[calc(50%-0.25rem)]' : ''}`}
                  >
                    Buy {outcome.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Enhanced Price History Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-3 md:p-5 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h3 className="font-black text-gray-900 dark:text-white text-sm md:text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  Price History
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold">Yes {yesOutcome?.price || 50}¢</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-900 dark:text-gray-200 font-semibold">No {noOutcome?.price || 50}¢</span>
                  </div>
                </div>
              </div>
              <PriceChart data={priceHistory} height={180} />
            </motion.div>

          {/* CLOB Trading Modal */}
          {selectedCLOBOutcome && (
            <CLOBTradingModal
              isOpen={showCLOBModal}
              onClose={() => {
                setShowCLOBModal(false);
                setSelectedCLOBOutcome(null);
              }}
              marketId={market.id}
              marketQuestion={market.title}
              outcomeIndex={selectedCLOBOutcome.index}
              outcomeName={selectedCLOBOutcome.name}
              paymentToken={market.paymentToken}
              tokenSymbol={token?.symbol || 'USDC'}
              tokenDecimals={token?.decimals || 6}
            />
          )}

            {/* Enhanced Rules Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 md:p-4 border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-sm space-y-2"
            >
              <h3 className="font-black text-gray-900 dark:text-white mb-1.5 md:mb-2 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Rules Summary
              </h3>
              
              {/* Market Description */}
              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                {cleanDescription(market.description)}
              </p>

              {/* Resolution Type and Custom Outcomes */}
              {(() => {
                const resolutionType = extractResolutionType(market.description);
                const customOutcomes = extractCustomOutcomes(market.description);
                
                if (resolutionType === 'custom' && customOutcomes.length > 0) {
                  return (
                    <div className="space-y-2 pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        <span className="font-black">Resolution Type:</span> Custom Outcomes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {customOutcomes.map((outcome, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 border border-amber-200 dark:border-amber-700"
                          >
                            {outcome}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        Closes on {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        Resolves to <span className="font-black text-green-600 dark:text-green-400">Yes</span> if event occurs before {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, otherwise <span className="font-black text-red-600 dark:text-red-400">No</span>.
                      </p>
                    </div>
                  );
                }
              })()}
            </motion.div>

            {/* Market Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <MarketComments marketId={market.id} marketTitle={market.title} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
