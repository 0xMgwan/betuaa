'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useCTFMintPositionTokens } from '@/hooks/useCTFMarket';
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
    <div 
      className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-md" 
      onClick={onClose}
      style={{ willChange: 'opacity' }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border-2 border-gray-200 dark:border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: 'transform' }}
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

        {mintSuccess ? (
          <div className="text-center py-8 space-y-6">
            {/* Success Icon with Animation */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30 animate-pulse">
                <span className="text-4xl">✅</span>
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                Position Tokens Minted!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your position has been successfully created
              </p>
            </div>

            {/* Details Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 space-y-3 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Outcome</span>
                <span className="font-semibold text-gray-900 dark:text-white">{outcomeName}</span>
              </div>
              <div className="h-px bg-green-200 dark:bg-green-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount Invested</span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Image src="/USDC logo.png" alt="USDC" width={20} height={20} className="rounded-full" />
                  {amount} {tokenSymbol}
                </span>
              </div>
              <div className="h-px bg-green-200 dark:bg-green-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Price per Share</span>
                <span className="font-semibold text-gray-900 dark:text-white">{currentPrice}¢</span>
              </div>
              <div className="h-px bg-green-200 dark:bg-green-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tokens Received</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {(parseFloat(amount) / (currentPrice / 100)).toFixed(2)} tokens
                </span>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 Your position tokens will be worth more if {outcomeName.toLowerCase()} wins the market
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                disabled={isApproving || isMinting}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || isApproving || isMinting || estimatedCostDisplay > parseFloat(balanceFormatted)}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isApproving ? 'Approving...' : isMinting ? 'Minting...' : needsApproval ? 'Approve & Mint' : 'Mint Tokens'}
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

            {step === 'mint' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Step 2/2: Minting position tokens...
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
