'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, DollarSign, Tag, FileText, TrendingUp } from 'lucide-react';
import { STABLECOINS } from '@/lib/contracts';
import { useCreateMarket } from '@/hooks/usePredictionMarket';
import { useApproveToken } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';
import { parseUnits } from 'viem';

const CATEGORIES = [
  { value: 'crypto', label: 'Crypto', icon: '₿', color: 'from-orange-500 to-yellow-500' },
  { value: 'sports', label: 'Sports', icon: '⚽', color: 'from-green-500 to-emerald-500' },
  { value: 'politics', label: 'Politics', icon: '🏛️', color: 'from-blue-500 to-indigo-500' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'from-purple-500 to-pink-500' },
  { value: 'technology', label: 'Technology', icon: '💻', color: 'from-cyan-500 to-blue-500' },
  { value: 'other', label: 'Other', icon: '📊', color: 'from-gray-500 to-slate-500' },
];

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateMarketModal({ isOpen, onClose }: CreateMarketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>(STABLECOINS.baseSepolia[0].address);
  const [category, setCategory] = useState('crypto');
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form');

  const { createMarket, isPending: isCreating, isSuccess } = useCreateMarket();
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();

  const selectedStablecoin = STABLECOINS.baseSepolia.find(t => t.address === selectedToken);

  // Automatically create market after approval succeeds
  useEffect(() => {
    if (isApproved && step === 'approve') {
      setStep('create');
      handleCreateMarket();
    }
  }, [isApproved]);

  const handleApprove = async () => {
    if (!selectedStablecoin || !initialLiquidity) return;
    
    const amount = parseUnits(initialLiquidity, selectedStablecoin.decimals);
    await approve(
      selectedToken as `0x${string}`,
      CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      amount
    );
  };

  const handleCreateMarket = async () => {
    if (!selectedStablecoin) return;

    const closingTimestamp = BigInt(Math.floor(new Date(closingDate).getTime() / 1000));
    const liquidityAmount = parseUnits(initialLiquidity || '0', selectedStablecoin.decimals);

    // Encode category in description with special format
    const descriptionWithCategory = `[CATEGORY:${category}] ${description}`;

    await createMarket(
      title,
      descriptionWithCategory,
      0, // Binary market
      closingTimestamp,
      ['Yes', 'No'],
      liquidityAmount,
      selectedToken as `0x${string}`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseFloat(initialLiquidity || '0') > 0) {
      setStep('approve');
      await handleApprove();
    } else {
      setStep('create');
      await handleCreateMarket();
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Market Created!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your prediction market has been successfully created on Base Sepolia.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  setStep('form');
                  setTitle('');
                  setDescription('');
                  setClosingDate('');
                  setInitialLiquidity('');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Create Another Market
              </button>
              <button
                onClick={() => {
                  onClose();
                  setStep('form');
                  setTitle('');
                  setDescription('');
                  setClosingDate('');
                  setInitialLiquidity('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create Prediction Market</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    category === cat.value
                      ? `border-transparent bg-gradient-to-r ${cat.color} text-white shadow-lg`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-semibold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Market Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Will Bitcoin reach $150,000 by end of 2026?"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the market resolution criteria..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Closing Date
            </label>
            <input
              type="datetime-local"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            >
              {STABLECOINS.baseSepolia.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.icon} {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Users will trade using {selectedStablecoin?.symbol} for this market
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Initial Liquidity (Optional)
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(e.target.value)}
              placeholder="0"
              step="0.000001"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add initial liquidity to help bootstrap your market
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isApproving || isCreating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isApproving ? 'Approving...' : isCreating ? 'Creating...' : 'Create Market'}
            </button>
          </div>

          {step === 'approve' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Step 1/2: Approving {selectedStablecoin?.symbol} spending...
              </p>
            </div>
          )}

          {step === 'create' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Step 2/2: Creating market on blockchain...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
