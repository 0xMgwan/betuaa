'use client';

import React, { useState } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNTZSBalance, useNTZSDeposit, useNTZSWithdraw } from '@/hooks/useNTZS';

interface NtzsWalletDashboardProps {
  ntzsUser: {
    userId: string;
    walletAddress: string;
    username: string;
    email?: string;
    phone?: string;
  };
}

export default function NtzsWalletDashboard({ ntzsUser }: NtzsWalletDashboardProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [phone, setPhone] = useState(ntzsUser.phone || '');
  const [amount, setAmount] = useState('');

  // Hooks
  const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useNTZSBalance(ntzsUser.walletAddress);
  const { status: depositStatus, depositId, txHash, error: depositError, initiateDeposit, reset: resetDeposit } = useNTZSDeposit();
  const { status: withdrawStatus, withdrawalId, error: withdrawError, initiateWithdraw, reset: resetWithdraw } = useNTZSWithdraw();

  const handleDeposit = async () => {
    if (!ntzsUser.userId || !amount || !phone) return;

    await initiateDeposit({
      walletAddress: ntzsUser.walletAddress,
      amountTzs: Number(amount),
      phone,
    });
  };

  const handleWithdraw = async () => {
    if (!ntzsUser.userId || !amount || !phone) return;

    await initiateWithdraw({
      walletAddress: ntzsUser.walletAddress,
      amountTzs: Number(amount),
      phone,
    });
  };

  const handleReset = () => {
    setAmount('');
    setPhone(ntzsUser.phone || '');
    resetDeposit();
    resetWithdraw();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Balance */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🇹🇿</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">nTZS Wallet</h2>
              <p className="text-white/80 text-sm">@{ntzsUser.username}</p>
            </div>
          </div>
          <button
            onClick={refreshBalance}
            disabled={balanceLoading}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white ${balanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-white/80 text-sm mb-1">Available Balance</p>
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
          className={`flex-1 py-4 px-6 font-semibold transition-colors ${
            activeTab === 'deposit'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownCircle className="w-5 h-5 inline-block mr-2" />
          Deposit (On-Ramp)
        </button>
        <button
          onClick={() => { setActiveTab('withdraw'); handleReset(); }}
          className={`flex-1 py-4 px-6 font-semibold transition-colors ${
            activeTab === 'withdraw'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpCircle className="w-5 h-5 inline-block mr-2" />
          Withdraw (Off-Ramp)
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {depositStatus === 'minted' || withdrawStatus === 'completed' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {activeTab === 'deposit' ? 'Deposit Successful!' : 'Withdrawal Successful!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'deposit' 
                  ? `${amount} TZS has been deposited to your wallet`
                  : `${amount} TZS has been sent to ${phone}`
                }
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 text-sm hover:underline"
                >
                  View Transaction
                </a>
              )}
              <button
                onClick={handleReset}
                className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Make Another Transaction
              </button>
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
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="255712345678"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter your M-Pesa number (e.g., 255712345678)
                  </p>
                </div>

                {/* Amount */}
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

                {/* Submit Button */}
                <button
                  onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                  disabled={!phone || !amount || depositStatus === 'pending' || withdrawStatus === 'pending'}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(depositStatus === 'pending' || withdrawStatus === 'pending') ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : activeTab === 'deposit' ? (
                    <>
                      <ArrowDownCircle className="w-5 h-5" />
                      Deposit via M-Pesa
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="w-5 h-5" />
                      Withdraw to M-Pesa
                    </>
                  )}
                </button>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {activeTab === 'deposit' ? (
                      <>
                        <strong>How it works:</strong> You'll receive an M-Pesa STK push on your phone. 
                        Approve the payment and nTZS tokens will be minted to your wallet within minutes.
                      </>
                    ) : (
                      <>
                        <strong>How it works:</strong> Your nTZS tokens will be burned and TZS will be 
                        sent to your M-Pesa number within minutes.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
