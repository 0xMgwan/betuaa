'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useAllMarkets } from '@/hooks/useMarkets';
import ResolveMarketModal from '@/components/ResolveMarketModal';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Calendar, Users, BarChart3, Trophy, CheckCircle, Clock as ClockIcon, XCircle, Zap, Gamepad2, Mic2, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchMarketData, fetchUserStats } from '@/lib/graphql';

export default function ProfilePage() {
  const { t } = useTranslation();
  const params = useParams();
  const profileAddress = params.address as string;
  const { address: currentUserAddress } = useAccount();
  const isOwnProfile = currentUserAddress?.toLowerCase() === profileAddress?.toLowerCase();
  
  // State declarations first
  const [activeTab, setActiveTab] = useState<'positions' | 'activity' | 'created'>('positions');
  const [selectedMarketToResolve, setSelectedMarketToResolve] = useState<any>(null);
  const [marketStats, setMarketStats] = useState<Record<string, any>>({});
  const [userStats, setUserStats] = useState<any>(null);
  
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
  const winningPositions = resolvedPositions.filter(p => {
    // A position is winning if the user's outcome matches the winning outcome
    const isWinning = p.winningOutcomeId === p.outcomeId;
    console.log(`Position check: Market ${p.marketId}, User outcome: ${p.outcomeId}, Winning outcome: ${p.winningOutcomeId}, Is winning: ${isWinning}`);
    return isWinning;
  }).length;
  const winRate = resolvedPositions.length > 0 ? (winningPositions / resolvedPositions.length) * 100 : 0;
  
  console.log(`Win rate calculation: ${winningPositions} winning / ${resolvedPositions.length} resolved = ${winRate.toFixed(2)}%`);
  
  // Calculate total volume from positions (sum of all position values)
  const calculatedVolume = positions.reduce((sum, pos) => {
    // Each position's volume is the number of shares (USDC has 6 decimals)
    const positionValue = Number(pos.shares) / 1e6; // Convert from USDC decimals to actual amount
    return sum + positionValue;
  }, 0);

  const userData: {
    address: string;
    username: string;
    joinedDate: Date;
    totalVolume: number;
    totalProfit: number;
    winRate: number;
    totalTrades: number;
    activeTrades: number;
    marketsCreated: number;
    followers: number;
    following: number;
    rank: number;
    badges: string[];
  } = {
    address: profileAddress,
    username: profileAddress ? `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}` : '',
    joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    totalVolume: calculatedVolume,
    totalProfit: totalPnL,
    winRate: winRate,
    totalTrades: totalTrades,
    activeTrades: activePositions.length,
    marketsCreated: marketsCreated.length,
    followers: 0,
    following: 0,
    rank: 42,
    badges: winRate > 60 ? ['Profit Master'] : [],
  };

  // Fetch user stats from The Graph
  useEffect(() => {
    const fetchUserStatsData = async () => {
      try {
        const stats = await fetchUserStats(profileAddress);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    if (profileAddress) {
      fetchUserStatsData();
    }
  }, [profileAddress]);

  // Fetch market stats from The Graph
  useEffect(() => {
    const fetchStats = async () => {
      const stats: Record<string, any> = {};
      
      // Fetch all market stats in parallel instead of sequentially
      const statsPromises = marketsCreated.map(market =>
        fetchMarketData(market.id.toString())
          .then(data => {
            if (data) {
              stats[market.id] = {
                totalVolume: data.totalVolume || '0',
                participantCount: data.participantCount || 0,
                tradeCount: data.tradeCount || 0,
              };
            }
            return stats;
          })
          .catch(error => {
            console.error(`Error fetching stats for market ${market.id}:`, error);
            return stats;
          })
      );

      // Wait for all requests to complete
      await Promise.all(statsPromises);
      setMarketStats(stats);
    };

    if (marketsCreated.length > 0) {
      fetchStats();
    }
  }, [marketsCreated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header with Gradient Background */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl mb-6 md:mb-8 relative overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            {/* Avatar */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative"
            >
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-white via-blue-100 to-purple-100 flex items-center justify-center text-2xl md:text-4xl font-black bg-white/20 backdrop-blur-xl border-2 border-white/30 shadow-xl">
                {userData.username.slice(0, 2).toUpperCase()}
              </div>
              {userData.rank <= 10 && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                >
                  <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
                </motion.div>
              )}
            </motion.div>

            {/* User Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <h1 className="text-2xl md:text-4xl font-black text-white">
                  {userData.username}
                </h1>
                {isOwnProfile && (
                  <span className="px-3 md:px-4 py-1 md:py-1.5 bg-white/20 backdrop-blur-xl text-white rounded-full text-xs md:text-sm font-bold border border-white/30">
                    You
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-white/90 mb-3 md:mb-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-1 md:gap-1.5"
                >
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profile.joined')} {userData.joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center gap-1 md:gap-1.5"
                >
                  <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profile.rank')} #{userData.rank}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-1 md:gap-1.5"
                >
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  {userData.followers} {t('profile.followers')} · {userData.following} {t('profile.following')}
                </motion.div>
              </div>

              {/* Badges */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-2"
              >
                {userData.badges.map((badge, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="px-3 md:px-4 py-1 md:py-1.5 bg-white/20 backdrop-blur-xl text-white rounded-full text-[10px] md:text-xs font-bold border border-white/30"
                  >
                    ✨ {badge}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            {/* Follow Button (if not own profile) */}
            {!isOwnProfile && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-xl text-sm md:text-base font-bold transition-all border border-white/30 shadow-lg"
              >
                Follow
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {/* Total Volume */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-xl rounded-xl p-3 md:p-5 border border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 md:p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400">{t('profile.totalVolume')}</span>
            </div>
            <p className="text-base md:text-2xl font-black text-gray-900 dark:text-white font-mono">
              ${userData.totalVolume.toLocaleString()}
            </p>
          </motion.div>

          {/* Total Profit */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl rounded-xl p-3 md:p-5 border border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 md:p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400">{t('profile.totalProfit')}</span>
            </div>
            <p className="text-base md:text-2xl font-black text-green-600 dark:text-green-400 font-mono">
              +${userData.totalProfit.toLocaleString()}
            </p>
          </motion.div>

          {/* Win Rate */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl rounded-xl p-3 md:p-5 border border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 md:p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400">{t('profile.winRate')}</span>
            </div>
            <p className="text-base md:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono truncate">
              {userData.winRate.toFixed(2)}%
            </p>
          </motion.div>

          {/* Total Trades */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 backdrop-blur-xl rounded-xl p-3 md:p-5 border border-orange-200/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 md:p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400">Total Trades</span>
            </div>
            <p className="text-base md:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {userData.totalTrades}
            </p>
          </motion.div>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
        >
          {activeTab === 'positions' && (
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {t('profile.activePositions')}
              </h3>
              {activePositions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No active positions</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePositions.map((position, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                      className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {/* Gradient overlay */}
                      <div className={`absolute top-0 right-0 w-32 h-32 ${
                        position.outcomeName.toLowerCase().includes('yes')
                          ? 'bg-gradient-to-br from-green-500/15 to-emerald-500/15'
                          : 'bg-gradient-to-br from-red-500/15 to-orange-500/15'
                      } rounded-full blur-3xl group-hover:scale-150 transition-transform duration-300`}></div>
                      
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100/50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                            CRYPTO
                          </span>
                          <motion.span 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap shadow-lg ${
                              position.outcomeName.toLowerCase().includes('yes') 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                            }`}
                          >
                            {position.outcomeName}
                          </motion.span>
                        </div>
                        
                        {/* Market Title */}
                        <h4 className="font-black text-sm mb-3 line-clamp-2 text-gray-900 dark:text-white leading-snug">
                          {position.marketTitle}
                        </h4>
                        
                        {/* Stats Grid */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Shares</span>
                            <span className="font-black text-sm text-gray-900 dark:text-white">
                              {(Number(position.shares) / 1e6).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Price</span>
                            <span className="font-black text-sm text-gray-900 dark:text-white">{position.currentPrice.toFixed(1)}¢</span>
                          </div>
                          <div className={`flex justify-between items-center px-3 py-2 rounded-lg border backdrop-blur-sm ${
                            position.unrealizedPnL >= 0
                              ? 'bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50'
                              : 'bg-gradient-to-r from-red-100/50 to-orange-100/50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200/50 dark:border-red-700/50'
                          }`}>
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">P&L</span>
                            <span className={`font-black text-sm ${
                              position.unrealizedPnL >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
                    const isActive = closingDate > new Date();
                    const isClosed = closingDate <= new Date() && !market.resolved;

                    // Extract category from description
                    const categoryMatch = market.description.match(/\[CATEGORY:(\w+)\]/);
                    const categoryName = categoryMatch ? categoryMatch[1].toLowerCase() : 'crypto';
                    const category = categoryName.toUpperCase();
                    
                    // Get category icon
                    const getCategoryIcon = (cat: string) => {
                      switch(cat) {
                        case 'crypto': return <Zap className="w-4 h-4" />;
                        case 'sports': return <Trophy className="w-4 h-4" />;
                        case 'entertainment': return <Mic2 className="w-4 h-4" />;
                        case 'other': return <Globe className="w-4 h-4" />;
                        default: return <Zap className="w-4 h-4" />;
                      }
                    };
                    
                    // Get category color
                    const getCategoryColor = (cat: string) => {
                      switch(cat) {
                        case 'crypto': return 'text-blue-600 dark:text-blue-400';
                        case 'sports': return 'text-orange-600 dark:text-orange-400';
                        case 'entertainment': return 'text-purple-600 dark:text-purple-400';
                        case 'other': return 'text-green-600 dark:text-green-400';
                        default: return 'text-blue-600 dark:text-blue-400';
                      }
                    };

                    return (
                      <div key={market.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs font-semibold uppercase flex items-center gap-1 ${getCategoryColor(categoryName)}`}>
                            {getCategoryIcon(categoryName)}
                            {category}
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
                          {market.description.replace(/\[CATEGORY:\w+\]\s*/, '')}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Status</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {market.resolved ? 'Resolved' : isActive ? 'Active' : 'Closed'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Closes</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Market Stats from The Graph */}
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Volume</p>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {marketStats[market.id] 
                                ? (() => {
                                    const vol = Number(marketStats[market.id].totalVolume) / 1e6;
                                    return vol >= 1000 ? `${(vol / 1000).toFixed(1)}K` : `${vol.toFixed(2)}`;
                                  })()
                                : '0'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Traders</p>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                              <Users className="w-3 h-3" />
                              {marketStats[market.id]?.participantCount || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Trades</p>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {marketStats[market.id]?.tradeCount || 0}
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
        </motion.div>
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
