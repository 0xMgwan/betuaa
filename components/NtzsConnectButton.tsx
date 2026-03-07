'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';
import NtzsRegistrationModal from './NtzsRegistrationModal';
import WalletModal from './WalletModal';

export default function NtzsConnectButton() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [ntzsUser, setNtzsUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Check if user is already registered
    const storedUser = localStorage.getItem('ntzsUser');
    if (storedUser) {
      setNtzsUser(JSON.parse(storedUser));
    }
  }, []);

  const handleRegistrationSuccess = (userData: any) => {
    setNtzsUser(userData);
    setShowRegistration(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ntzsUser');
    setNtzsUser(null);
    setShowDropdown(false);
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

            {/* Wallet Address */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wallet Address</p>
              <p className="text-xs font-mono text-gray-900 dark:text-white">
                {ntzsUser.walletAddress.slice(0, 10)}...{ntzsUser.walletAddress.slice(-8)}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowWallet(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <WalletIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Wallet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deposit & Withdraw</p>
                </div>
              </button>

              <Link
                href={`/profile/${ntzsUser.walletAddress}`}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Profile</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View your profile</p>
                </div>
              </Link>

              <Link
                href="/portfolio"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowDownCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Portfolio</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your positions</p>
                </div>
              </Link>

              <Link
                href="/leaderboard"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowUpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Leaderboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Top traders</p>
                </div>
              </Link>

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

      {/* Wallet Modal */}
      {ntzsUser && (
        <WalletModal
          isOpen={showWallet}
          onClose={() => setShowWallet(false)}
          ntzsUser={ntzsUser}
        />
      )}
    </div>
  );
}
