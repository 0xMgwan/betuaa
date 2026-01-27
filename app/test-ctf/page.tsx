'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { 
  useCTFMarketCount, 
  useCTFGetMarket, 
  useCTFCreateMarket,
  useCTFMintPositionTokens,
  useCTFGetOutcomeToken,
  useCTFBalanceOf,
} from '@/hooks/useCTFMarket';
import { useApproveToken, useTokenBalance } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';

export default function TestCTFPage() {
  const { address, isConnected } = useAccount();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [closingDays, setClosingDays] = useState('7');
  const [selectedMarketId, setSelectedMarketId] = useState(1);
  const [mintAmount, setMintAmount] = useState('');

  // Read hooks
  const { data: marketCount } = useCTFMarketCount();
  const { data: marketData } = useCTFGetMarket(selectedMarketId);
  const { data: yesTokenId } = useCTFGetOutcomeToken(selectedMarketId, 0);
  const { data: noTokenId } = useCTFGetOutcomeToken(selectedMarketId, 1);
  const { data: yesBalance } = useCTFBalanceOf(address, yesTokenId as bigint | undefined);
  const { data: noBalance } = useCTFBalanceOf(address, noTokenId as bigint | undefined);

  // USDC balance
  const mockUSDC = CONTRACTS.baseSepolia.mockUSDC as `0x${string}`;
  const { data: usdcBalance } = useTokenBalance(mockUSDC, address as `0x${string}`);

  // Write hooks
  const { createMarket, isPending: isCreating, isSuccess: createSuccess } = useCTFCreateMarket();
  const { mintPositionTokens, isPending: isMinting, isSuccess: mintSuccess } = useCTFMintPositionTokens();
  const { approve, isPending: isApproving } = useApproveToken();

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !closingDays) return;

    const closingTime = BigInt(Math.floor(Date.now() / 1000) + parseInt(closingDays) * 86400);
    
    await createMarket(
      question,
      description || 'Test market',
      BigInt(2), // Binary market (Yes/No)
      closingTime,
      mockUSDC
    );
  };

  const handleApproveAndMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintAmount) return;

    const amount = parseUnits(mintAmount, 6); // USDC has 6 decimals

    // First approve
    await approve(
      mockUSDC,
      CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
      amount
    );

    // Then mint (you may need to wait for approval to confirm)
    setTimeout(async () => {
      await mintPositionTokens(selectedMarketId, amount);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CTF Market Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the deployed CTF Prediction Market contract on Base Sepolia
          </p>
          {isConnected && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Connected:</span> {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">USDC Balance:</span> {usdcBalance ? (Number(usdcBalance) / 1e6).toFixed(2) : '0'} USDC
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Total Markets:</span> {marketCount?.toString() || '0'}
              </p>
            </div>
          )}
        </div>

        {/* Create Market */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            1. Create Market
          </h2>
          <form onSubmit={handleCreateMarket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Will BTC reach $100k by end of 2026?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Closing in (days)
              </label>
              <input
                type="number"
                value={closingDays}
                onChange={(e) => setClosingDays(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!isConnected || isCreating}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Market'}
            </button>
            {createSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Market created successfully!
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Mint Position Tokens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            2. Mint Position Tokens
          </h2>
          {marketData && Array.isArray(marketData) && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-semibold">Market #{selectedMarketId}:</span> {String(marketData[0] || '')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Status:</span> {marketData[8] ? 'Resolved' : 'Active'}
              </p>
            </div>
          )}
          <form onSubmit={handleApproveAndMint} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Market ID
              </label>
              <input
                type="number"
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(parseInt(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="100"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!isConnected || isApproving || isMinting}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isApproving ? 'Approving...' : isMinting ? 'Minting...' : 'Approve & Mint Tokens'}
            </button>
            {mintSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Position tokens minted successfully!
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Token Balances */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            3. Your Position Tokens
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">YES Tokens (Market #{selectedMarketId})</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {yesBalance ? (Number(yesBalance) / 1e6).toFixed(2) : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">NO Tokens (Market #{selectedMarketId})</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {noBalance ? (Number(noBalance) / 1e6).toFixed(2) : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Contract Info
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold">CTF Market:</span>{' '}
              <a 
                href={`https://sepolia.basescan.org/address/${CONTRACTS.baseSepolia.ctfPredictionMarket}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {CONTRACTS.baseSepolia.ctfPredictionMarket}
              </a>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold">MockUSDC:</span>{' '}
              <a 
                href={`https://sepolia.basescan.org/address/${CONTRACTS.baseSepolia.mockUSDC}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {CONTRACTS.baseSepolia.mockUSDC}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
