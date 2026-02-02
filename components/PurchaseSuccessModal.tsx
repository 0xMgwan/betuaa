'use client';

import { CheckCircle, X, TrendingUp, DollarSign, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  outcomeName: string;
  amount: number;
  tokenSymbol: string;
}

export default function PurchaseSuccessModal({
  isOpen,
  onClose,
  marketTitle,
  outcomeName,
  amount,
  tokenSymbol,
}: PurchaseSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
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
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md p-6 relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 shadow-2xl border-2 border-green-200 dark:border-green-800">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                {/* Success Icon with Animation */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative w-20 h-20 mx-auto mb-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse opacity-20"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 mb-2"
                >
                  Purchase Successful! 🎉
                </motion.h3>

                {/* Description */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-400 mb-6 text-sm"
                >
                  Your position tokens have been minted successfully
                </motion.p>

                {/* Market Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                    Market
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white mb-4 text-sm">
                    {marketTitle}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Position
                      </div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {outcomeName}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs mb-1">
                        <DollarSign className="w-3 h-3" />
                        Amount
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-green-600 dark:text-green-400">
                        <Image 
                          src="/USDC logo.png" 
                          alt="USDC" 
                          width={20} 
                          height={20}
                          className="rounded-full"
                        />
                        {amount.toFixed(2)} {tokenSymbol}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/portfolio';
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                  >
                    View Portfolio
                  </button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
