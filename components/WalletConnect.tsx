"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, LogOut, Settings, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import UsernameModal from './UsernameModal';
import DepositModal from './DepositModal';
import NTZSWithdrawModal from './NTZSWithdrawModal';
import { useNTZSBalance } from '@/hooks/useNTZS';

// nTZS uses off-chain balance, no ERC20 needed

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors }  = useConnect();
  const { disconnect }           = useDisconnect();
  const [showUsernameModal, setShowUsernameModal]   = useState(false);
  const [showDepositModal,  setShowDepositModal]    = useState(false);
  const [showWithdrawModal, setShowWithdrawModal]   = useState(false);
  const [showDropdown,      setShowDropdown]        = useState(false);
  const [username,          setUsername]            = useState<string | null>(null);

  // On-chain balances
  const { data: ethBalance }  = useBalance({ address });
  // usdcBalance removed — nTZS balance used instead

  // nTZS balance (M-Pesa rails)
  const { balance: ntzsBalance } = useNTZSBalance(address);

  // Display balance: prefer nTZS balance
  const displayBalance = ntzsBalance > 0 ? ntzsBalance.toFixed(2) : (ethBalance?.formatted || '0.00');

  useEffect(() => {
    if (isConnected && address) {
      const storedUsername = localStorage.getItem(`username_${address}`);
      if (!storedUsername) {
        setShowUsernameModal(true);
      } else {
        setUsername(storedUsername);
      }
    }
  }, [isConnected, address]);

  const handleConnect = () => {
    const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
    if (coinbaseConnector) connect({ connector: coinbaseConnector });
  };

  const handleUsernameSet = (newUsername: string) => {
    if (address) {
      localStorage.setItem(`username_${address}`, newUsername);
      setUsername(newUsername);
      setShowUsernameModal(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setUsername(null);
    setShowDropdown(false);
  };

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} size="sm" className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect
      </Button>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <span className="text-xs font-bold">
              {username ? username[0].toUpperCase() : '?'}
            </span>
          </div>
          <span className="text-sm font-medium">{username || 'User'}</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50">
            {/* Profile header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {username ? username[0].toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{username}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between px-2.5 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">nTZS</div>
                  <div className="text-sm font-bold text-green-600">
                    {ntzsBalance > 0
                      ? `${ntzsBalance.toFixed(2)} TZS`
                      : ethBalance
                        ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH`
                        : '0.00 TZS'}
                  </div>
                </div>
                {ntzsBalance && (
                  <div className="flex items-center justify-between px-2.5 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/50 dark:border-emerald-700/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">🇹🇿</span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">nTZS</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {(ntzsBalance.balanceTzs ?? 0).toLocaleString()} TZS
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => { setShowDropdown(false); setShowDepositModal(true); }}
                  className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <DollarSign className="h-3 w-3" />
                  Deposit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowDropdown(false); setShowWithdrawModal(true); }}
                  className="flex-1 gap-1 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  Withdraw
                </Button>
              </div>
            </div>

            {/* Nav links */}
            <div className="py-1">
              <Link
                href={`/profile/${address}`}
                onClick={() => setShowDropdown(false)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setShowDropdown(false)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                Portfolio
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setShowDropdown(false)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowDropdown(false)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-1">
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSubmit={handleUsernameSet}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        address={address}
        currentBalance={displayBalance}
        onDeposit={(amount: string) => {
          console.log('Deposit completed:', amount);
          setShowDepositModal(false);
        }}
      />

      <NTZSWithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        walletAddress={address}
      />
    </>
  );
}
