'use client';

import { useAccount } from 'wagmi';
import { useUserMarkets } from '@/hooks/useMarkets';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { STABLECOINS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { markets, isLoading } = useUserMarkets(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to view your profile and markets.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {address?.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Markets Created
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {markets.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Active Markets
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {markets.filter(m => !m.resolved).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Resolved Markets
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {markets.filter(m => m.resolved).length}
            </div>
          </div>
        </div>

        {/* My Markets */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            My Markets
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                You haven't created any markets yet.
              </p>
              <p className="text-gray-400 dark:text-gray-500">
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
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Market #{market.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : market.resolved
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {market.resolved ? 'Resolved' : isActive ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {market.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {market.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Token:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {token?.icon} {token?.symbol || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Closes:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {formatDistanceToNow(closingDate, { addSuffix: true })}
                        </span>
                      </div>

                      {market.resolved && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Winner:
                          </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            Outcome #{market.winningOutcomeId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
