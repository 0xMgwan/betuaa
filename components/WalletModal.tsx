'use client';

import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw, CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNTZSBalance, useNTZSDeposit, useNTZSWithdraw } from '@/hooks/useNTZS';
import Image from 'next/image';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  ntzsUser: {
    userId: string;
    walletAddress: string;
    username: string;
    email?: string;
    phone?: string;
  };
}

export default function WalletModal({ isOpen, onClose, ntzsUser }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [phone, setPhone] = useState(ntzsUser.phone || '');
  const [amount, setAmount] = useState('');

  const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useNTZSBalance(ntzsUser.walletAddress, ntzsUser.email);
  const { status: depositStatus, depositId, txHash, error: depositError, initiateDeposit, reset: resetDeposit } = useNTZSDeposit();
  const { status: withdrawStatus, withdrawalId, error: withdrawError, initiateWithdraw, reset: resetWithdraw } = useNTZSWithdraw();
  
  // Type assertions to help TypeScript
  const isDepositPending = depositStatus === 'pending' || depositStatus === 'processing';
  const isWithdrawPending = withdrawStatus === 'pending' || withdrawStatus === 'processing';

  const handleDeposit = async () => {
    if (!ntzsUser.userId || !amount || !phone) return;

    await initiateDeposit({
      walletAddress: ntzsUser.walletAddress,
      amountTzs: Number(amount),
      phone,
      email: ntzsUser.email,
    });
  };

  const handleWithdraw = async () => {
    if (!ntzsUser.userId || !amount || !phone) return;

    await initiateWithdraw({
      walletAddress: ntzsUser.walletAddress,
      amountTzs: Number(amount),
      phone,
      email: ntzsUser.email,
    });
  };

  const handleReset = () => {
    setAmount('');
    setPhone(ntzsUser.phone || '');
    resetDeposit();
    resetWithdraw();
    refreshBalance(); // Refresh balance after transaction
  };

  // Auto-refresh balance when deposit is minted or withdrawal is completed
  React.useEffect(() => {
    if (depositStatus === 'minted' || withdrawStatus === 'completed') {
      refreshBalance();
    }
  }, [depositStatus, withdrawStatus, refreshBalance]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center p-2">
                <Image 
                  src="/ntzs.png" 
                  alt="nTZS" 
                  width={40} 
                  height={40}
                  className="rounded-full"
                />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">nTZS Wallet</h2>
                <p className="text-white/80 text-sm">@{ntzsUser.username}</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/80 text-sm">Available Balance</p>
                <button
                  onClick={refreshBalance}
                  disabled={balanceLoading}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${balanceLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-white text-3xl font-bold">
                {balanceLoading ? (
                  <Loader className="w-8 h-8 animate-spin" />
                ) : (
                  `${balance?.balanceTzs?.toLocaleString() || '0'} TZS`
                )}
              </p>
              {balance && (
                <p className="text-white/60 text-xs mt-1">
                  {balance.balanceNtzs} nTZS
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setActiveTab('deposit'); handleReset(); }}
              className={`flex-1 py-3 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'deposit'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 inline-block mr-2" />
              Deposit
            </button>
            <button
              onClick={() => { setActiveTab('withdraw'); handleReset(); }}
              className={`flex-1 py-3 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'withdraw'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 inline-block mr-2" />
              Withdraw
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            <AnimatePresence mode="wait">
              {isDepositPending || isWithdrawPending ? (
                <motion.div
                  key="stk-push"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12"
                >
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <Loader className="w-12 h-12 text-white animate-spin" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto">
                      <div className="w-full h-full rounded-full border-4 border-blue-200 dark:border-blue-800 animate-ping opacity-20"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    📱 Check Your Phone
                  </h3>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 mb-6 mx-4">
                    <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                      {activeTab === 'deposit' 
                        ? `Payment request sent to ${phone}`
                        : `Processing withdrawal to ${phone}`
                    }
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {activeTab === 'deposit' 
                        ? '💳 Enter your PIN to complete the payment'
                        : '⏳ Your funds are being processed'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm font-medium">Waiting for confirmation</span>
                  </div>
                </motion.div>
              ) : depositStatus === 'minted' || withdrawStatus === 'completed' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative mb-8"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <CheckCircle className="w-14 h-14 text-white" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto">
                      <div className="w-full h-full rounded-full border-4 border-green-200 dark:border-green-800 animate-ping opacity-20"></div>
                    </div>
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
                  >
                    {activeTab === 'deposit' ? '✨ Deposit' : '🎉 Withdrawal'} Successful!
                  </motion.h3>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6 mb-6 mx-4"
                  >
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {amount} TZS
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {activeTab === 'deposit' ? '💰 Added to your wallet' : '📤 Sent to your phone'}
                    </p>
                  </motion.div>

                  {txHash && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-mono"
                    >
                      TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </motion.p>
                  )}
                  
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleReset}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Done
                  </motion.button>
                </motion.div>
              ) : depositStatus === 'failed' || withdrawStatus === 'failed' ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Transaction Failed
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {depositError || withdrawError}
                  </p>
                  {(depositError?.includes('404') || withdrawError?.includes('404')) && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                      The nTZS API endpoint may not be configured correctly. Please contact support.
                    </p>
                  )}
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="255712345678"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enter your Mobile Money number
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Amount (TZS)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="10000"
                        min="1000"
                        step="1000"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Minimum: 1,000 TZS
                      </p>
                    </div>

                    <button
                      onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                      disabled={!phone || !amount || isDepositPending || isWithdrawPending}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {(isDepositPending || isWithdrawPending) ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : activeTab === 'deposit' ? (
                        <>
                          <ArrowDownCircle className="w-5 h-5" />
                          Deposit via Mobile Money
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="w-5 h-5" />
                          Withdraw to Mobile Money
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
