'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useBuyShares } from '@/hooks/usePredictionMarket';
import { useApproveToken, useTokenBalance, useTokenAllowance } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';

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
  const [step, setStep] = useState<'input' | 'approve' | 'buy'>('input');

  const { buyShares, isPending: isBuying, isSuccess: buySuccess } = useBuyShares();
  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveToken();

  // Get user's token balance
  const { data: balance } = useTokenBalance(
    paymentToken as `0x${string}`,
    address as `0x${string}`
  );

  // Get current allowance
  const { data: allowance } = useTokenAllowance(
    paymentToken as `0x${string}`,
    address as `0x${string}`,
    CONTRACTS.baseSepolia.predictionMarket as `0x${string}`
  );

  const sharesAmount = amount ? parseUnits(amount, 18) : BigInt(0);
  
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
    
    // Approve unlimited amount (standard DeFi practice)
    // User only needs to approve once, ever
    await approve(
      paymentToken as `0x${string}`,
      CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      MAX_UINT256
    );
  };

  const handleBuy = async () => {
    if (!amount) return;
    setStep('buy');
    
    await buyShares(
      marketId,
      outcomeId,
      sharesAmount
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (needsApproval) {
      await handleApprove();
    } else {
      await handleBuy();
    }
  };

  // Auto-proceed after approval - use useEffect with delay to ensure on-chain confirmation
  React.useEffect(() => {
    if (approveSuccess && step === 'approve') {
      // Wait 3 seconds for approval to be confirmed on-chain before buying
      const timer = setTimeout(() => {
        setStep('buy');
        handleBuy();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [approveSuccess, step]);

  // Close modal after successful buy
  if (buySuccess) {
    setTimeout(() => {
      onClose();
      setAmount('');
      setStep('input');
    }, 2000);
  }

  if (!isOpen) return null;

  const balanceFormatted = balance ? formatUnits(balance as bigint, tokenDecimals) : '0';

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border-2 border-gray-200 dark:border-gray-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Buy {outcomeName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {buySuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Purchase Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You bought {amount} shares of {outcomeName}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Shares
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                min="0"
                disabled={step !== 'input'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Balance: {parseFloat(balanceFormatted).toFixed(4)} {tokenSymbol}
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(balanceFormatted)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={step !== 'input'}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Price Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Price per share:</span>
                <span className="font-medium text-gray-900 dark:text-white">{currentPrice}¢</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Estimated cost:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ~{estimatedCostDisplay.toFixed(4)} {tokenSymbol}
                </span>
              </div>
            </div>

            {/* Warning */}
            {estimatedCostDisplay > parseFloat(balanceFormatted) && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  Insufficient balance. You need ~{estimatedCostDisplay.toFixed(4)} {tokenSymbol}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isApproving || isBuying}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || isApproving || isBuying || estimatedCostDisplay > parseFloat(balanceFormatted)}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isApproving ? 'Approving...' : isBuying ? 'Buying...' : needsApproval ? 'Approve & Buy' : 'Buy Shares'}
              </button>
            </div>

            {/* Status Message */}
            {step === 'approve' && !approveSuccess && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Step 1/2: Approving {tokenSymbol} spending...
                </p>
              </div>
            )}

            {step === 'approve' && approveSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Approval confirmed! Waiting for on-chain confirmation before buying...
                </p>
              </div>
            )}

            {step === 'buy' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Step 2/2: Purchasing shares...
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
