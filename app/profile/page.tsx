'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useUserMarkets } from '@/hooks/useMarkets';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';
import ResolveMarketModal from '@/components/ResolveMarketModal';
import { useClaimWinnings } from '@/hooks/usePredictionMarket';
import { useUsername } from '@/hooks/useUsername';
import { TrendingUp, Clock, Award, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { username } = useUsername();
  const { markets, isLoading } = useUserMarkets(address);
  const [selectedMarketToResolve, setSelectedMarketToResolve] = useState<any>(null);
  const { claimWinnings, isPending: isClaiming } = useClaimWinnings();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Please connect your wallet to view your profile and markets.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
              <div className="relative w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/20 shadow-xl">
                {username ? username.slice(0, 2).toUpperCase() : address?.slice(2, 4).toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
                {username || 'My Profile'}
              </h1>
              <p className="text-white/90 font-mono text-sm bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg inline-block">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Markets Created
                </div>
              </div>
              <div className="text-4xl font-black bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {markets.length}
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Markets
                </div>
              </div>
              <div className="text-4xl font-black bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {markets.filter(m => !m.resolved).length}
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Resolved Markets
                </div>
              </div>
              <div className="text-4xl font-black bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {markets.filter(m => m.resolved).length}
              </div>
            </div>
          </div>
        </div>

        {/* My Markets Section */}
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">
            My Markets
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : markets.length === 0 ? (
            <div className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold mb-2">
                No markets yet
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Click "Create Market" in the navbar to get started! 🚀
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => {
                const token = STABLECOINS.baseSepolia.find(
                  (t) => t.address.toLowerCase() === market.paymentToken.toLowerCase()
                );
                const closingDate = new Date(Number(market.closingDate) * 1000);
                const isActive = closingDate > new Date();

                return (
                  <div
                    key={market.id}
                    className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                              #{market.id}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isActive
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                                  : market.resolved
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {market.resolved ? 'Resolved' : isActive ? 'Active' : 'Closed'}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {market.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {market.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">
                            Token:
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {token?.icon} {token?.symbol || 'Unknown'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">
                            Closes:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatDistanceToNow(closingDate, { addSuffix: true })}
                          </span>
                        </div>

                        {market.resolved && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                              Winner:
                            </span>
                            <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              Outcome #{market.winningOutcomeId}
                            </span>
                          </div>
                        )}
                      </div>

                      {!market.resolved && !isActive && (
                        <button
                          onClick={() => setSelectedMarketToResolve(market)}
                          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300"
                        >
                          Resolve Market
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
