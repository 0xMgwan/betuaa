'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { STABLECOINS } from '@/lib/contracts';
import { useCreateMarket } from '@/hooks/usePredictionMarket';
import { useApproveToken } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';
import { parseUnits } from 'viem';

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
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form');

  const { createMarket, isPending: isCreating, isSuccess } = useCreateMarket();
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();

  const selectedStablecoin = STABLECOINS.baseSepolia.find(t => t.address === selectedToken);

  const handleApprove = async () => {
    if (!selectedStablecoin || !initialLiquidity) return;
    
    const amount = parseUnits(initialLiquidity, selectedStablecoin.decimals);
    await approve(
      selectedToken as `0x${string}`,
      CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      amount
    );
    setStep('create');
  };

  const handleCreateMarket = async () => {
    if (!selectedStablecoin) return;

    const closingTimestamp = BigInt(Math.floor(new Date(closingDate).getTime() / 1000));
    const liquidityAmount = parseUnits(initialLiquidity || '0', selectedStablecoin.decimals);

    await createMarket(
      title,
      description,
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
            <button
              onClick={() => {
                onClose();
                setStep('form');
                setTitle('');
                setDescription('');
                setClosingDate('');
                setInitialLiquidity('');
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Create Another Market
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Prediction Market</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Market Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Will Bitcoin reach $150,000 by end of 2026?"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the market resolution criteria..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Closing Date
            </label>
            <input
              type="datetime-local"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Liquidity (Optional)
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(e.target.value)}
              placeholder="0"
              step="0.000001"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add initial liquidity to help bootstrap your market
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isApproving || isCreating}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
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
