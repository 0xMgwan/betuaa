"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SellModal from "@/components/SellModal";
import ClaimSuccessModal from "@/components/ClaimSuccessModal";
import CreateMarketModal from "@/components/CreateMarketModal";
import { useUserPositions } from '@/hooks/useUserPositions';
import { useCTFRedeemWinningTokens } from '@/hooks/useCTFMarket';
import { useAllMarkets } from '@/hooks/useMarkets';
import { STABLECOINS } from '@/lib/contracts';
import { TrendingUp, TrendingDown, DollarSign, Sparkles, Award, Target, Star, Activity, Plus } from 'lucide-react';
import CompactMarketCard from '@/components/CompactMarketCard';
import BlockchainMarketModal from '@/components/BlockchainMarketModal';
import { useTranslation } from '@/hooks/useTranslation';

export default function Portfolio() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { positions, activePositions, claimablePositions, isLoading, totalValue, totalPnL, totalPnLPercent } = useUserPositions();
  const { markets: blockchainMarkets } = useAllMarkets();
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimedPosition, setClaimedPosition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'positions' | 'favorites' | 'activity'>('positions');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [selectedBlockchainMarket, setSelectedBlockchainMarket] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { redeemWinningTokens, isPending: isClaiming, isSuccess: claimSuccess } = useCTFRedeemWinningTokens();

  const generatePriceHistory = (yesPrice: number, noPrice: number) => {
    return Array.from({ length: 10 }, (_, i) => ({
      time: `${i}h`,
      yes: yesPrice + (Math.random() - 0.5) * 10,
      no: noPrice + (Math.random() - 0.5) * 10,
    }));
  };

  useEffect(() => {
    if (address) {
      const favorites = JSON.parse(localStorage.getItem(`favorites_${address}`) || '[]');
      setFavoriteIds(favorites);
    }
  }, [address]);

  useEffect(() => {
    if (claimSuccess && claimedPosition) {
      setShowClaimSuccess(true);
    }
  }, [claimSuccess, claimedPosition]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="text-center py-12 md:py-20">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 md:mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-6 md:mb-8">
              Please connect your wallet to view your portfolio.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="pt-32 md:pt-24 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-6 md:pb-12">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 md:mb-2">
            {t('portfolio.title')}
          </h1>
          <p className="text-xs md:text-lg text-gray-600 dark:text-gray-400">
            {t('portfolio.trackPositions')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 md:gap-2 mb-3 md:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'positions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Target className="w-3 h-3 md:w-4 md:h-4" />
            {t('portfolio.myPositions')}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Star className="w-3 h-3 md:w-4 md:h-4" />
            Favorites ({favoriteIds.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'activity'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Activity className="w-3 h-3 md:w-4 md:h-4" />
            {t('portfolio.activity')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'positions' && (
          <>
            {/* Stats Grid with Premium Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          {/* Total Value Card */}
          <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                <div className="relative w-9 h-9 md:w-10 md:h-10">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl rotate-6 opacity-80"></div>
                  <div className="absolute inset-0 bg-cyan-500 rounded-xl -rotate-6 opacity-60"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl"></div>
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white relative z-10" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('portfolio.totalValue')}
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ${totalValue.toFixed(2)}
              </div>
            </div>
          </div>

              {/* P&L Card */}
              <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute top-0 right-0 w-32 h-32 ${totalPnL >= 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-red-500/20 to-orange-500/20'} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`}></div>
                <div className="relative">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <div className="relative w-9 h-9 md:w-10 md:h-10">
                      <div className={`absolute inset-0 ${totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-xl rotate-6 opacity-80`}></div>
                      <div className={`absolute inset-0 ${totalPnL >= 0 ? 'bg-emerald-500' : 'bg-orange-500'} rounded-xl -rotate-6 opacity-60`}></div>
                      <div className={`absolute inset-0 ${totalPnL >= 0 ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-orange-600'} rounded-xl flex items-center justify-center shadow-lg`}>
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl"></div>
                        {totalPnL >= 0 ? <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white relative z-10" strokeWidth={2.5} /> : <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-white relative z-10" strokeWidth={2.5} />}
                      </div>
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('portfolio.unrealizedPL')}
                    </div>
                  </div>
                  <div className={`text-2xl md:text-4xl font-black ${totalPnL >= 0 ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-red-600 to-orange-600'} bg-clip-text text-transparent`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

          {/* Active Positions Card */}
          <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                <div className="relative w-9 h-9 md:w-10 md:h-10">
                  <div className="absolute inset-0 bg-purple-500 rounded-xl rotate-6 opacity-80"></div>
                  <div className="absolute inset-0 bg-pink-500 rounded-xl -rotate-6 opacity-60"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl"></div>
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-white relative z-10" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('portfolio.activePositions')}
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {activePositions.length}
              </div>
              {claimablePositions.length > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <Award className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs md:text-sm font-bold text-green-600 dark:text-green-400">
                    {claimablePositions.length} {t('portfolio.claimable')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Positions List */}
        <div>
          <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white mb-3 md:mb-6">
            Your Positions
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 animate-pulse border border-gray-200 dark:border-gray-700"
                >
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold mb-2">
                No positions yet
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Start trading to build your portfolio! 📈
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(() => {
                // Group positions by marketId
                const groupedPositions = positions.reduce((acc, position) => {
                  if (!acc[position.marketId]) {
                    acc[position.marketId] = {
                      marketId: position.marketId,
                      marketTitle: position.marketTitle,
                      paymentToken: position.paymentToken,
                      resolved: position.resolved,
                      winningOutcomeId: position.winningOutcomeId,
                      positions: []
                    };
                  }
                  acc[position.marketId].positions.push(position);
                  return acc;
                }, {} as Record<number, any>);

                return Object.values(groupedPositions).map((market: any) => {
                  const token = STABLECOINS.baseSepolia.find(
                    (t) => t.address.toLowerCase() === market.paymentToken.toLowerCase()
                  );
                  
                  const yesPosition = market.positions.find((p: any) => p.outcomeId === 0);
                  const noPosition = market.positions.find((p: any) => p.outcomeId === 1);
                  
                  const totalValue = market.positions.reduce((sum: number, p: any) => {
                    const shares = Number(p.shares) / 1e6;
                    return sum + (shares * p.currentPrice) / 100;
                  }, 0);
                  
                  const totalPnL = market.positions.reduce((sum: number, p: any) => sum + p.unrealizedPnL, 0);

                  return (
                    <div
                      key={market.marketId}
                      className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
                      
                      <div className="relative">
                        <div className="mb-3">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                            {market.marketTitle}
                          </h3>
                          
                          {/* YES Position */}
                          {yesPosition && (
                            <div className="flex items-center justify-between mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                  Yes
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {(Number(yesPosition.shares) / 1e6).toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPosition(yesPosition);
                                  setShowSellModal(true);
                                }}
                                className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
                              >
                                Sell
                              </button>
                            </div>
                          )}
                          
                          {/* NO Position */}
                          {noPosition && (
                            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-600 text-white">
                                  No
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {(Number(noPosition.shares) / 1e6).toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPosition(noPosition);
                                  setShowSellModal(true);
                                }}
                                className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
                              >
                                Sell
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Total Value</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{totalValue.toFixed(2)} {token?.symbol}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Total P&L</div>
                            <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {market.resolved && (
                          <div className="mt-2">
                            {yesPosition && market.winningOutcomeId === 0 && (
                              <button
                                onClick={() => {
                                  try {
                                    setClaimedPosition(yesPosition);
                                    redeemWinningTokens(market.marketId, yesPosition.shares);
                                  } catch (error) {
                                    console.error('Error claiming winnings:', error);
                                  }
                                }}
                                disabled={isClaiming}
                                className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50"
                              >
                                {isClaiming ? 'Claiming...' : 'Claim YES Winnings'}
                              </button>
                            )}
                            {noPosition && market.winningOutcomeId === 1 && (
                              <button
                                onClick={() => {
                                  try {
                                    setClaimedPosition(noPosition);
                                    redeemWinningTokens(market.marketId, noPosition.shares);
                                  } catch (error) {
                                    console.error('Error claiming winnings:', error);
                                  }
                                }}
                                disabled={isClaiming}
                                className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50"
                              >
                                {isClaiming ? 'Claiming...' : 'Claim NO Winnings'}
                              </button>
                            )}
                            {((yesPosition && market.winningOutcomeId !== 0) || (noPosition && market.winningOutcomeId !== 1)) && (
                              <div className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold text-center">
                                Market Resolved - No Winnings
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
          </>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteIds.length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Favorites Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Start adding markets to your favorites by clicking the star icon
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blockchainMarkets
                  .filter(market => favoriteIds.includes(market.id))
                  .map((market) => {
                    const closingDate = new Date(Number(market.closingDate) * 1000);
                    const isActive = closingDate > new Date() && !market.resolved;
                    return (
                      <CompactMarketCard
                        key={market.id}
                        id={market.id}
                        question={market.title}
                        category="CRYPTO"
                        yesPrice={0.50}
                        noPrice={0.50}
                        volume={`${(Number(market.totalVolume) / 1e6).toFixed(1)}K USDC`}
                        endDate={closingDate.toLocaleDateString()}
                        trend="up"
                        priceHistory={generatePriceHistory(50, 50)}
                        onClick={() => {
                          console.log('Favorite card clicked:', market.title);
                          setSelectedBlockchainMarket(market);
                        }}
                        isBlockchain={true}
                        status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                        description={market.description}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('activity.recentActivity')}</h3>
              <div className="space-y-3">
                {positions.slice(0, 5).map((position, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      position.outcomeName.toLowerCase().includes('yes') ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {position.outcomeName.toLowerCase().includes('yes') ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Bought {position.outcomeName} shares
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {position.marketTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {(Number(position.shares) / 1e18).toFixed(2)} shares
                      </p>
                      <p className={`text-xs font-medium ${
                        position.unrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {position.unrealizedPnL >= 0 ? '+' : ''}{position.unrealizedPnL.toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                ))}
                {positions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showSellModal && selectedPosition && (
        <SellModal
          isOpen={showSellModal}
          onClose={() => {
            setShowSellModal(false);
            setSelectedPosition(null);
          }}
          position={selectedPosition}
        />
      )}

      {showClaimSuccess && claimedPosition && (
        <ClaimSuccessModal
          isOpen={showClaimSuccess}
          onClose={() => {
            setShowClaimSuccess(false);
            setClaimedPosition(null);
          }}
          marketTitle={claimedPosition.marketTitle}
          shares={Number(claimedPosition.shares) / 1e6}
          payout={(Number(claimedPosition.shares) / 1e6 * claimedPosition.currentPrice) / 100}
          tokenSymbol={STABLECOINS.baseSepolia.find(t => t.address.toLowerCase() === claimedPosition.paymentToken.toLowerCase())?.symbol || 'USDC'}
        />
      )}

      {selectedBlockchainMarket && (
        <BlockchainMarketModal
          isOpen={!!selectedBlockchainMarket}
          onClose={() => setSelectedBlockchainMarket(null)}
          market={selectedBlockchainMarket}
        />
      )}

      {/* Floating Create Button - Mobile Only */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        aria-label="Create Market"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreateMarketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
