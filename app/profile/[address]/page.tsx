'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useAllMarkets } from '@/hooks/useMarkets';
import ResolveMarketModal from '@/components/ResolveMarketModal';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Calendar, Users, BarChart3, Trophy, CheckCircle, Clock as ClockIcon, XCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
  const { t } = useTranslation();
  const params = useParams();
  const profileAddress = params.address as string;
  const { address: currentUserAddress } = useAccount();
  const isOwnProfile = currentUserAddress?.toLowerCase() === profileAddress?.toLowerCase();
  
  // Get real data from blockchain
  const { positions, activePositions, totalValue, totalPnL } = useUserPositions();
  const { markets: allMarkets } = useAllMarkets();
  
  // Filter markets created by this user
  const marketsCreated = allMarkets.filter(
    market => market.creator.toLowerCase() === profileAddress.toLowerCase()
  );
  
  // Calculate real stats
  const totalTrades = positions.length;
  const resolvedPositions = positions.filter(p => p.resolved);
  const winningPositions = resolvedPositions.filter(p => p.winningOutcomeId === p.outcomeId).length;
  const winRate = resolvedPositions.length > 0 ? (winningPositions / resolvedPositions.length) * 100 : 0;
  
  // Calculate total volume from positions
  const calculatedVolume = positions.reduce((sum, pos) => {
    return sum + (Number(pos.shares) / 1e18 * pos.currentPrice / 100);
  }, 0);
  
  const userData = {
    address: profileAddress,
    username: profileAddress ? `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}` : '',
    joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    totalVolume: calculatedVolume,
    totalProfit: totalPnL,
    winRate: winRate,
    totalTrades: totalTrades,
    activeTrades: activePositions.length,
    marketsCreated: marketsCreated.length,
    followers: 0, // TODO: Implement follow system
    following: 0, // TODO: Implement follow system
    rank: 42, // TODO: Calculate from leaderboard
    badges: winRate > 60 ? ['Profit Master'] : [],
  };

  const [activeTab, setActiveTab] = useState<'positions' | 'activity' | 'created'>('positions');
  const [selectedMarketToResolve, setSelectedMarketToResolve] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-200 dark:border-gray-700 shadow-xl mb-4 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xl md:text-3xl font-bold shadow-lg">
                {userData.username.slice(0, 2).toUpperCase()}
              </div>
              {userData.rank <= 10 && (
                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-7 h-7 md:w-10 md:h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-3 h-3 md:w-5 md:h-5 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white">
                  {userData.username}
                </h1>
                {isOwnProfile && (
                  <span className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs md:text-sm font-medium">
                    You
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-4">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profile.joined')} {userData.joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profile.rank')} #{userData.rank}
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  {userData.followers} {t('profile.followers')} · {userData.following} {t('profile.following')}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {userData.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="px-2 md:px-3 py-0.5 md:py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-[10px] md:text-xs font-bold shadow-lg"
                  >
                    🏆 {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow Button (if not own profile) */}
            {!isOwnProfile && (
              <button className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm md:text-base font-bold transition-colors shadow-lg">
                Follow
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
          {/* Total Volume */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
              <div className="p-1 md:p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                <DollarSign className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">{t('profile.totalVolume')}</span>
            </div>
            <p className="text-sm md:text-3xl font-black text-gray-900 dark:text-white font-mono">
              ${userData.totalVolume.toLocaleString()}
            </p>
          </div>

          {/* Total Profit */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
              <div className="p-1 md:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">{t('profile.totalProfit')}</span>
            </div>
            <p className="text-sm md:text-3xl font-black text-green-600 dark:text-green-400 font-mono">
              +${userData.totalProfit.toLocaleString()}
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
              <div className="p-1 md:p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Award className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">{t('profile.winRate')}</span>
            </div>
            <p className="text-sm md:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {userData.winRate}%
            </p>
          </div>

          {/* Total Trades */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
              <div className="p-1 md:p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <BarChart3 className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Trades</span>
            </div>
            <p className="text-sm md:text-3xl font-black text-gray-900 dark:text-white font-mono">
              {userData.totalTrades}
            </p>
          </div>
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
            {t('profile.activePositions')} ({userData.activeTrades})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'activity'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
            {t('profile.activity')}
          </button>
          {userData.marketsCreated > 0 && (
            <button
              onClick={() => setActiveTab('created')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'created'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Award className="w-3 h-3 md:w-4 md:h-4" />
              {t('profile.createdMarkets')} ({userData.marketsCreated})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          {activeTab === 'positions' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('profile.activePositions')}</h3>
              {activePositions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No active positions</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePositions.map((position, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                          CRYPTO
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          position.outcomeName.toLowerCase().includes('yes') 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {position.outcomeName}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-sm mb-3 line-clamp-2 text-gray-900 dark:text-white">
                        {position.marketTitle}
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Shares</p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {(Number(position.shares) / 1e18).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Price</p>
                          <p className="font-bold text-gray-900 dark:text-white">{position.currentPrice}¢</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">P&L</p>
                          <p className={`font-bold ${
                            position.unrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {position.unrealizedPnL >= 0 ? '+' : ''}{position.unrealizedPnL.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('activity.recentActivity')}</h3>
              <p className="text-gray-600 dark:text-gray-400">Activity feed will be displayed here...</p>
            </div>
          )}

          {activeTab === 'created' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Markets Created</h3>
              {marketsCreated.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No markets created yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketsCreated.map((market) => {
                    const closingDate = new Date(Number(market.closingDate) * 1000);
                    const isActive = closingDate > new Date() && !market.resolved;
                    const isClosed = closingDate <= new Date() && !market.resolved;
                    
                    return (
                      <div key={market.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                            CRYPTO
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                            market.resolved
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              : isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          }`}>
                            {market.resolved ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Resolved
                              </>
                            ) : isActive ? (
                              <>
                                <ClockIcon className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Closed
                              </>
                            )}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-white">
                          {market.title}
                        </h4>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {market.description}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Volume</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              ${(Number(market.totalVolume) / 1e6).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Traders</p>
                            <p className="font-bold text-gray-900 dark:text-white">{market.participantCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Closes</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {isClosed && isOwnProfile && (
                          <button 
                            onClick={() => setSelectedMarketToResolve(market)}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors"
                          >
                            Resolve Market
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedMarketToResolve && (
        <ResolveMarketModal
          isOpen={!!selectedMarketToResolve}
          onClose={() => setSelectedMarketToResolve(null)}
          market={selectedMarketToResolve}
        />
      )}

      <Footer />
    </div>
  );
}
