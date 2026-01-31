'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';

interface MarketResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  resolutionType: 'yesno' | 'custom';
  customOutcomes?: string[];
  onResolve: (outcomeIndex: number, outcomeName: string) => Promise<void>;
  isLoading?: boolean;
}

export default function MarketResolutionModal({
  isOpen,
  onClose,
  marketTitle,
  resolutionType,
  customOutcomes = [],
  onResolve,
  isLoading = false,
}: MarketResolutionModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const outcomes = resolutionType === 'custom' 
    ? customOutcomes 
    : ['Yes', 'No'];

  const handleResolve = async () => {
    if (selectedOutcome === null) return;
    
    setIsResolving(true);
    try {
      await onResolve(selectedOutcome, outcomes[selectedOutcome]);
      setSelectedOutcome(null);
      onClose();
    } catch (error) {
      console.error('Error resolving market:', error);
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-black text-white drop-shadow-lg">Resolve Market</h2>
            <p className="text-white/80 text-sm mt-1">Select the winning outcome</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Market Title */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Market Question</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{marketTitle}</p>
          </div>

          {/* Outcomes Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
              Select Winning Outcome
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outcomes.map((outcome, index) => (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => setSelectedOutcome(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedOutcome === index
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg shadow-green-500/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedOutcome === index
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedOutcome === index && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-900 dark:text-white text-lg">
                        {outcome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {resolutionType === 'custom' ? `Option ${index + 1}` : outcome}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Important</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Once resolved, this market cannot be changed. Make sure you select the correct outcome.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isResolving}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleResolve}
              disabled={selectedOutcome === null || isResolving || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isResolving || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Resolve Market
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
