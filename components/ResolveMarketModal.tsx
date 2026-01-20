'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useResolveMarket } from '@/hooks/usePredictionMarket';

interface ResolveMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: {
    id: number;
    title: string;
    outcomes: Array<{ name: string }>;
  };
}

export default function ResolveMarketModal({
  isOpen,
  onClose,
  market,
}: ResolveMarketModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { resolveMarket, isPending, isSuccess } = useResolveMarket();

  const handleResolve = async () => {
    if (selectedOutcome === null) return;
    
    await resolveMarket(market.id, selectedOutcome);
  };

  // Close modal after successful resolution
  if (isSuccess) {
    setTimeout(() => {
      onClose();
      setSelectedOutcome(null);
      setShowConfirm(false);
    }, 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Resolve Market
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Market Resolved!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The market has been successfully resolved
            </p>
          </div>
        ) : showConfirm ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                    Confirm Resolution
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    You are about to resolve this market with outcome:{' '}
                    <strong>{market.outcomes[selectedOutcome!]?.name}</strong>
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-2">
                    This action cannot be undone!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isPending}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isPending ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>

            {isPending && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Resolving market on blockchain...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Market Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Market
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {market.title}
              </div>
            </div>

            {/* Outcome Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Winning Outcome
              </label>
              <div className="space-y-2">
                {market.outcomes.map((outcome, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOutcome(index)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedOutcome === index
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {outcome.name}
                      </span>
                      {selectedOutcome === index && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={selectedOutcome === null}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
