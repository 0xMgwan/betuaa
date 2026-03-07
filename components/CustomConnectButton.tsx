'use client';

import Link from 'next/link';
import { User, Wallet, LogOut, BarChart3, Trophy, Languages, Smartphone, DollarSign, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import UsernameModal from './UsernameModal';
import NTZSConnectModal from './NTZSConnectModal';
import DepositModal from './DepositModal';
import NTZSWithdrawModal from './NTZSWithdrawModal';
import { useUsername } from '@/hooks/useUsername';
import { useNTZSBalance } from '@/hooks/useNTZS';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getNtzsPhone } from '@/lib/ntzs-wallet-connector';
import { useBalance } from 'wagmi';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

export default function CustomConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect }           = useDisconnect();
  const { username, hasUsername, isLoading, saveUsername } = useUsername();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const [showConnectModal,  setShowConnectModal]  = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDropdown,      setShowDropdown]      = useState(false);
  const [showDeposit,       setShowDeposit]       = useState(false);
  const [showWithdraw,      setShowWithdraw]      = useState(false);
  const [hasChecked,        setHasChecked]        = useState(false);

  // nTZS balance
  const { balance: ntzsBalance } = useNTZSBalance(address);
  const { data: usdcBalance }    = useBalance({ address, token: USDC_ADDRESS });

  // Phone from nTZS storage for display
  const [ntzsPhone, setNtzsPhone] = useState<string | null>(null);
  useEffect(() => {
    if (isConnected) setNtzsPhone(getNtzsPhone());
  }, [isConnected]);

  // Show username modal on first connect
  useEffect(() => {
    if (!isLoading && isConnected && !hasUsername && !hasChecked) {
      setShowUsernameModal(true);
      setHasChecked(true);
    }
  }, [isConnected, hasUsername, isLoading, hasChecked]);

  // ── Disconnected state ────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-green-500/20"
        >
          <Smartphone className="w-4 h-4" />
          Connect
        </button>

        <NTZSConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
        />
      </>
    );
  }

  // ── Connected state ───────────────────────────────────────────────────────
  const displayName = username || (ntzsPhone ? `+${ntzsPhone.slice(0, 6)}…` : 'Wallet');
  const shortAddr   = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  return (
    <>
      <div className="relative">
        {/* Account button */}
        <button
          onClick={() => setShowDropdown(d => !d)}
          className="flex items-center gap-2.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700/60 hover:border-gray-600 text-white rounded-xl font-medium text-sm transition-all"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {displayName[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <span>{displayName}</span>
          {/* nTZS badge */}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium border border-green-500/20">
            nTZS
          </span>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">

            {/* Profile section */}
            <div className="p-4 border-b border-gray-800 bg-gradient-to-br from-green-500/5 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {displayName[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white">{username || 'Anonymous'}</div>
                  <div className="text-xs text-gray-500 font-mono">{shortAddr}</div>
                  {ntzsPhone && (
                    <div className="text-[11px] text-green-500 mt-0.5">📱 {ntzsPhone}</div>
                  )}
                </div>
              </div>

              {/* Balances */}
              <div className="space-y-1.5 mb-3">
                {usdcBalance && parseFloat(usdcBalance.formatted) > 0 && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/60 rounded-lg">
                    <span className="text-xs text-gray-400">USDC</span>
                    <span className="text-sm font-bold text-white">
                      {parseFloat(usdcBalance.formatted).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">🇹🇿</span>
                    <span className="text-xs text-emerald-400">nTZS</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {(ntzsBalance?.balanceTzs ?? 0).toLocaleString()} TZS
                  </span>
                </div>
              </div>

              {/* Deposit / Withdraw */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setShowDropdown(false); setShowDeposit(true); }}
                  className="flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Deposit
                </button>
                <button
                  onClick={() => { setShowDropdown(false); setShowWithdraw(true); }}
                  className="flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 border border-orange-500/40 text-orange-400 text-xs font-semibold rounded-lg transition-colors"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Withdraw
                </button>
              </div>
            </div>

            {/* Nav links */}
            <div className="py-1.5">
              <Link href={`/profile/${address}`} onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                {t('nav.profile')}
              </Link>
              <Link href="/portfolio" onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <Wallet className="w-4 h-4" />
                {t('nav.portfolio')}
              </Link>
              <Link href="/stats" onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <BarChart3 className="w-4 h-4" />
                {t('nav.stats')}
              </Link>
              <Link href="/leaderboard" onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <Trophy className="w-4 h-4" />
                {t('nav.leaderboard')}
              </Link>

              {/* Language toggle */}
              <div className="px-4 py-2 border-t border-gray-800 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Language</span>
                </div>
                <div className="flex gap-2">
                  {(['en', 'sw'] as const).map(lang => (
                    <button key={lang} onClick={() => setLanguage(lang)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        language === lang
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}>
                      {lang === 'en' ? 'English' : 'Swahili'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Disconnect */}
            <div className="border-t border-gray-800">
              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSubmit={(newUsername) => { saveUsername(newUsername); setShowUsernameModal(false); }}
      />
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        address={address}
        currentBalance={usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'}
        onDeposit={() => setShowDeposit(false)}
      />
      <NTZSWithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        walletAddress={address}
      />
    </>
  );
}
