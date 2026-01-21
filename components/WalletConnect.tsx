"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, LogOut, Settings, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import UsernameModal from './UsernameModal';
import DepositModal from './DepositModal';

// USDC contract address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Get real wallet balances
  const { data: ethBalance } = useBalance({
    address: address,
  });

  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS,
  });

  // Calculate display balance (prefer USDC, fallback to ETH)
  const displayBalance = usdcBalance?.formatted || ethBalance?.formatted || '0.00';

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
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
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
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
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
              <div className="flex items-center justify-between mt-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Portfolio</div>
                  <div className="text-lg font-bold text-green-600">
                    {usdcBalance ? `${parseFloat(usdcBalance.formatted).toFixed(2)} USDC` : 
                     ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : 
                     '$0.00'}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setShowDropdown(false);
                    setShowDepositModal(true);
                  }}
                  className="gap-1"
                >
                  <DollarSign className="h-3 w-3" />
                  Deposit
                </Button>
              </div>
            </div>

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
          // Balance will update automatically via wagmi hooks
        }}
      />
    </>
  );
}
