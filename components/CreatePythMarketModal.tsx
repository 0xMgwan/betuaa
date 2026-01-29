'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { PYTH_PRICE_FEEDS, fetchPythPrice, generatePythMarketQuestion, type PythFeedId } from '@/lib/pyth';

interface CreatePythMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PythMarketData) => Promise<void>;
}

export interface PythMarketData {
  question: string;
  description: string;
  priceId: string;
  feedName: string;
  threshold: number;
  isAbove: boolean;
  expiryTime: number;
  collateralToken: string;
}

export default function CreatePythMarketModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePythMarketModalProps) {
  const [selectedFeed, setSelectedFeed] = useState<PythFeedId>('ETH/USD');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<string>('');
  const [isAbove, setIsAbove] = useState(true);
  const [expiryDays, setExpiryDays] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current price when feed changes
  useEffect(() => {
    const fetchPrice = async () => {
      const feed = PYTH_PRICE_FEEDS[selectedFeed];
      try {
        const priceData = await fetchPythPrice(feed.id);
        setCurrentPrice(parseFloat(priceData.formattedPrice.replace(/,/g, '')));
      } catch (err) {
        console.error('Error fetching price:', err);
      }
    };

    fetchPrice();
  }, [selectedFeed]);

  const feed = PYTH_PRICE_FEEDS[selectedFeed];
  const expiryTime = Math.floor(Date.now() / 1000) + expiryDays * 86400;
  const question = generatePythMarketQuestion({
    priceId: feed.id,
    feedName: feed.name,
    marketType: 'threshold',
    threshold: threshold ? parseFloat(threshold) : 0,
    expiryTime,
    isAbove,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!threshold) {
      setError('Please enter a threshold price');
      return;
    }

    if (parseFloat(threshold) <= 0) {
      setError('Threshold must be greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        question,
        description: `Pyth-powered market: ${feed.name} price prediction. Auto-resolves based on ${feed.symbol} price feed.`,
        priceId: feed.id,
        feedName: feed.name,
        threshold: parseFloat(threshold),
        isAbove,
        expiryTime,
        collateralToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create market');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Create Pyth Market</h2>
            <p className="text-blue-100 text-sm mt-1">Auto-resolves using Pyth price feeds</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Price Feed Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Price Feed
            </label>
            <select
              value={selectedFeed}
              onChange={(e) => setSelectedFeed(e.target.value as PythFeedId)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(PYTH_PRICE_FEEDS).map(([key, feed]) => (
                <option key={key} value={key}>
                  {feed.name} ({feed.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Current Price Display */}
          {currentPrice && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current {feed.symbol} Price</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Threshold Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Threshold Price (${feed.symbol})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={currentPrice ? currentPrice.toString() : 'Enter price'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The price level to predict against
            </p>
          </div>

          {/* Direction Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Prediction Direction
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsAbove(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  isAbove
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                ↑ Above ${threshold || '?'}
              </button>
              <button
                type="button"
                onClick={() => setIsAbove(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  !isAbove
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                ↓ Below ${threshold || '?'}
              </button>
            </div>
          </div>

          {/* Expiry Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Market Expires In
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 Day</option>
              <option value={7}>1 Week</option>
              <option value={30}>1 Month</option>
              <option value={90}>3 Months</option>
            </select>
          </div>

          {/* Market Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Market Question Preview</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {question}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              ✅ Auto-resolves when market expires
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !threshold}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
            >
              {isLoading ? 'Creating...' : 'Create Pyth Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
