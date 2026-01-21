'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useUserPositions } from '@/hooks/useUserPositions';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Calendar, Users, BarChart3, Trophy } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const profileAddress = params.address as string;
  const { address: currentUserAddress } = useAccount();
  const isOwnProfile = currentUserAddress?.toLowerCase() === profileAddress?.toLowerCase();
  
  // Mock user data - will be replaced with real data from blockchain/database
  const [userData, setUserData] = useState({
    address: profileAddress,
    username: profileAddress ? `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}` : '',
    joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    totalVolume: 15420.50,
    totalProfit: 2340.25,
    winRate: 68.5,
    totalTrades: 127,
    activeTrades: 8,
    marketsCreated: 3,
    followers: 234,
    following: 89,
    rank: 42,
    badges: ['Early Adopter', 'High Roller', 'Profit Master'],
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'activity' | 'created'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {userData.username.slice(0, 2).toUpperCase()}
              </div>
              {userData.rank <= 10 && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                  {userData.username}
                </h1>
                {isOwnProfile && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                    You
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {userData.joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  Rank #{userData.rank}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {userData.followers} followers · {userData.following} following
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {userData.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold shadow-lg"
                  >
                    🏆 {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow Button (if not own profile) */}
            {!isOwnProfile && (
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg">
                Follow
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Volume */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Volume</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white font-mono">
              ${userData.totalVolume.toLocaleString()}
            </p>
          </div>

          {/* Total Profit */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</span>
            </div>
            <p className="text-3xl font-black text-green-600 dark:text-green-400 font-mono">
              +${userData.totalProfit.toLocaleString()}
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</span>
            </div>
            <p className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {userData.winRate}%
            </p>
          </div>

          {/* Total Trades */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trades</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white font-mono">
              {userData.totalTrades}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'positions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Target className="w-4 h-4" />
            Active Positions ({userData.activeTrades})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'activity'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Activity
          </button>
          {userData.marketsCreated > 0 && (
            <button
              onClick={() => setActiveTab('created')}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'created'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Created Markets ({userData.marketsCreated})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trading Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Positions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{userData.activeTrades}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Markets Created</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{userData.marketsCreated}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Trade Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(userData.totalVolume / userData.totalTrades).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Positions</h3>
              <p className="text-gray-600 dark:text-gray-400">Position details will be displayed here...</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <p className="text-gray-600 dark:text-gray-400">Activity feed will be displayed here...</p>
            </div>
          )}

          {activeTab === 'created' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Markets Created</h3>
              <p className="text-gray-600 dark:text-gray-400">Created markets will be displayed here...</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
