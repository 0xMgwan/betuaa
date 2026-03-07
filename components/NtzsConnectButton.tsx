'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Wallet as WalletIcon, Trophy, BarChart3 } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import NtzsRegistrationModal from './NtzsRegistrationModal';
import WalletModal from './WalletModal';
import ProfileModal from './ProfileModal';
import PortfolioModal from './PortfolioModal';
import LeaderboardModal from './LeaderboardModal';

export default function NtzsConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [showRegistration, setShowRegistration] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [ntzsUser, setNtzsUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load user from localStorage, checking wallet address matches
  const loadUser = useCallback(() => {
    const storedUser = localStorage.getItem('ntzsUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      // Only use stored user if wallet matches current connected wallet
      if (address && parsed.walletAddress && 
          parsed.walletAddress.toLowerCase() === address.toLowerCase()) {
        setNtzsUser(parsed);
      } else {
        // Wallet mismatch — clear stale data
        localStorage.removeItem('ntzsUser');
        setNtzsUser(null);
      }
    } else {
      setNtzsUser(null);
    }
  }, [address]);

  // Re-check whenever address changes or component mounts
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Also listen for storage changes from other components
  useEffect(() => {
    const onStorage = () => loadUser();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadUser]);

  // When disconnected, clear user
  useEffect(() => {
    if (!isConnected) {
      setNtzsUser(null);
    }
  }, [isConnected]);

  const handleRegistrationSuccess = (userData: any) => {
    setNtzsUser(userData);
    setShowRegistration(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ntzsUser');
    // Clear all username_ keys too
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('username_')) localStorage.removeItem(key);
    });
    setNtzsUser(null);
    setShowDropdown(false);
    disconnect();
  };

  if (!ntzsUser) {
    return (
      <>
        <button
          onClick={() => setShowRegistration(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          <WalletIcon className="h-5 w-5" />
          Sign In
        </button>

        <NtzsRegistrationModal
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
        />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {ntzsUser.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="font-medium text-gray-900 dark:text-white">
          @{ntzsUser.username}
        </span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {ntzsUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold">@{ntzsUser.username}</p>
                  <p className="text-white/80 text-xs">
                    {ntzsUser.email || ntzsUser.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => { setShowDropdown(false); setShowWallet(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <WalletIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Wallet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deposit & Withdraw</p>
                </div>
              </button>

              <button
                onClick={() => { setShowDropdown(false); setShowProfile(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Profile</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View your profile</p>
                </div>
              </button>

              <button
                onClick={() => { setShowDropdown(false); setShowPortfolio(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Portfolio</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your positions</p>
                </div>
              </button>

              <button
                onClick={() => { setShowDropdown(false); setShowLeaderboard(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Leaderboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Top traders</p>
                </div>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {ntzsUser && (
        <>
          <WalletModal
            isOpen={showWallet}
            onClose={() => setShowWallet(false)}
            ntzsUser={ntzsUser}
          />
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            user={{
              walletAddress: ntzsUser.walletAddress || '',
              username: ntzsUser.username || '',
              email: ntzsUser.email,
              phone: ntzsUser.phone,
            }}
            onUpdate={async (data) => {
              const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: ntzsUser.walletAddress, ...data }),
              });
              const result = await res.json();
              if (result.user) {
                const updated = { ...ntzsUser, ...data };
                localStorage.setItem('ntzsUser', JSON.stringify(updated));
                setNtzsUser(updated);
              }
            }}
          />
          <PortfolioModal
            isOpen={showPortfolio}
            onClose={() => setShowPortfolio(false)}
            walletAddress={ntzsUser.walletAddress || ''}
          />
          <LeaderboardModal
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
          />
        </>
      )}
    </div>
  );
}
