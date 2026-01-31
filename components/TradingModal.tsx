'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Sparkles, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useCTFMintPositionTokens } from '@/hooks/useCTFMarket';
import { useApproveToken, useTokenBalance, useTokenAllowance } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId: number;
  outcomeId: number;
  outcomeName: string;
  currentPrice: number;
  paymentToken: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

export default function TradingModal({
  isOpen,
  onClose,
  marketId,
  outcomeId,
  outcomeName,
  currentPrice,
  paymentToken,
  tokenSymbol,
  tokenDecimals,
}: TradingModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'mint'>('input');

  const { mintPositionTokens, isPending: isMinting, isSuccess: mintSuccess } = useCTFMintPositionTokens();
  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveToken();

  // Get user's token balance
  const { data: balance } = useTokenBalance(
    paymentToken as `0x${string}`,
    address as `0x${string}`
  );

  // Get current allowance for CTF contract
  const { data: allowance } = useTokenAllowance(
    paymentToken as `0x${string}`,
    address as `0x${string}`,
    CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`
  );

  const mintAmount = amount ? parseUnits(amount, tokenDecimals) : BigInt(0);
  
  // Estimate cost for display
  const estimatedCostDisplay = amount ? parseFloat(amount) * (currentPrice / 100) : 0;
  
  // Use unlimited approval approach (standard in DeFi)
  // Approve max uint256 once, never need to approve again
  const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  
  // Check if we have any meaningful allowance (> 1000 tokens)
  const minUsefulAllowance = parseUnits('1000', tokenDecimals);
  const needsApproval = !allowance || (allowance as bigint) < minUsefulAllowance;

  const handleApprove = async () => {
    if (!amount) return;
    setStep('approve');
    
    try {
      await approve(
        paymentToken as `0x${string}`,
        CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
        MAX_UINT256
      );
    } catch (error) {
      console.error('Error approving token:', error);
      setStep('input');
    }
  };

  const handleMint = async () => {
    if (!amount) return;
    setStep('mint');
    
    try {
      await mintPositionTokens(marketId, mintAmount);
    } catch (error) {
      console.error('Error minting position tokens:', error);
      setStep('input');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (needsApproval) {
      await handleApprove();
    } else {
      await handleMint();
    }
  };

  // Auto-proceed after approval
  React.useEffect(() => {
    if (approveSuccess && step === 'approve') {
      const timer = setTimeout(() => {
        setStep('mint');
        handleMint();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [approveSuccess, step]);

  // Close modal after successful mint
  if (mintSuccess) {
    setTimeout(() => {
      onClose();
      setAmount('');
      setStep('input');
    }, 2000);
  }

  if (!isOpen) return null;

  const balanceFormatted = balance ? formatUnits(balance as bigint, tokenDecimals) : '0';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" 
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Buy Position</p>
                  <h2 className="text-2xl font-black text-white">
                    {outcomeName}
                  </h2>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

        {mintSuccess ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 px-6 space-y-6"
          >
            {/* Success Icon with Animation */}
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <motion.span 
                  className="text-4xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  ✅
                </motion.span>
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                Position Tokens Minted!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your position has been successfully created
              </p>
            </motion.div>

            {/* Details Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 space-y-3 border border-green-200/70 dark:border-green-700/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Outcome</span>
                <span className="font-black text-gray-900 dark:text-white">{outcomeName}</span>
              </div>
              <div className="h-px bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Amount Invested</span>
                <span className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Image src="/USDC logo.png" alt="USDC" width={16} height={16} className="rounded-full" />
                  {amount} {tokenSymbol}
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Price per Share</span>
                <span className="font-black text-gray-900 dark:text-white">{currentPrice}¢</span>
              </div>
              <div className="h-px bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tokens Received</span>
                <span className="font-black text-green-600 dark:text-green-400">
                  {(parseFloat(amount) / (currentPrice / 100)).toFixed(2)} tokens
                </span>
              </div>
            </motion.div>

            {/* Info Message */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
            >
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 Your position tokens will be worth more if {outcomeName.toLowerCase()} wins the market
              </p>
            </motion.div>

            {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-black transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40"
            >
              Done
            </motion.button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Amount ({tokenSymbol})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                min="0"
                disabled={step !== 'input'}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white disabled:opacity-50 font-semibold transition-all"
                required
              />
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-semibold">
                  Balance: <span className="text-gray-900 dark:text-white font-black">{parseFloat(balanceFormatted).toFixed(4)}</span> {tokenSymbol}
                </span>
                <motion.button
                  type="button"
                  onClick={() => setAmount(balanceFormatted)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-black px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  disabled={step !== 'input'}
                >
                  Max
                </motion.button>
              </div>
            </motion.div>

            {/* Price Info Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Price per share
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">{currentPrice}¢</span>
              </div>
              <div className="h-px bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Estimated cost</span>
                <span className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Image src="/USDC logo.png" alt="USDC" width={16} height={16} className="rounded-full" />
                  ~{estimatedCostDisplay.toFixed(4)}
                </span>
              </div>
            </motion.div>

            {/* Warning */}
            <AnimatePresence>
              {estimatedCostDisplay > parseFloat(balanceFormatted) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/70 dark:border-red-700/50 rounded-xl backdrop-blur-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Insufficient balance. You need ~{estimatedCostDisplay.toFixed(4)} {tokenSymbol}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3 pt-2"
            >
              <motion.button
                type="button"
                onClick={onClose}
                disabled={isApproving || isMinting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={!amount || isApproving || isMinting || estimatedCostDisplay > parseFloat(balanceFormatted)}
                whileHover={{ scale: !(!amount || isApproving || isMinting || estimatedCostDisplay > parseFloat(balanceFormatted)) ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-black transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isApproving ? 'Approving...' : isMinting ? 'Minting...' : needsApproval ? 'Approve & Mint' : 'Mint Tokens'}
              </motion.button>
            </motion.div>

            {/* Status Messages */}
            <AnimatePresence>
              {step === 'approve' && !approveSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-700/50 rounded-xl p-4 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      ⏳
                    </motion.span>
                    Step 1/2: Approving {tokenSymbol} spending...
                  </p>
                </motion.div>
              )}

              {step === 'approve' && approveSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200/70 dark:border-green-700/50 rounded-xl p-4 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>
                      ✓
                    </motion.span>
                    Approval confirmed! Proceeding to mint...
                  </p>
                </motion.div>
              )}

              {step === 'mint' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-700/50 rounded-xl p-4 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      ⏳
                    </motion.span>
                    Step 2/2: Minting position tokens...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
