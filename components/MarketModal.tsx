"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { X, TrendingUp, TrendingDown, Clock, DollarSign, Users, Wallet } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import DepositModal from "./DepositModal";
import ShareButton from "./ShareButton";

// USDC contract address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: {
    id: number;
    question: string;
    category: string;
    yesPrice: number;
    noPrice: number;
    volume: string;
    endDate: string;
    participants: number;
    priceHistory: { time: string; yes: number; no: number }[];
    description?: string;
  };
}

export default function MarketModal({ isOpen, onClose, market }: MarketModalProps) {
  const { address, isConnected } = useAccount();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showTradeConfirm, setShowTradeConfirm] = useState(false);
  const [tradeSide, setTradeSide] = useState<'yes' | 'no'>('yes');

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS,
  });

  if (!isOpen) return null;

  const handleTrade = (side: 'yes' | 'no') => {
    if (!isConnected) {
      setShowConnectPrompt(true);
      return;
    }

    // Check if user has any USDC or ETH balance
    const hasEthBalance = ethBalance && parseFloat(ethBalance.formatted) > 0;
    const hasUsdcBalance = usdcBalance && parseFloat(usdcBalance.formatted) > 0;
    
    console.log('ETH Balance:', ethBalance?.formatted);
    console.log('USDC Balance:', usdcBalance?.formatted);
    console.log('Has ETH:', hasEthBalance);
    console.log('Has USDC:', hasUsdcBalance);
    
    if (!hasEthBalance && !hasUsdcBalance) {
      console.log('No balance, showing deposit modal');
      setShowDepositModal(true);
      return;
    }

    // Show trade confirmation
    setTradeSide(side);
    setShowTradeConfirm(true);
  };

  const executeTrade = () => {
    // Execute the trade (placeholder)
    console.log(`Executing trade: ${tradeSide} on market ${market.id}`);
    setShowTradeConfirm(false);
    onClose();
    // TODO: Implement actual trading logic
  };

  const maxPrice = Math.max(...market.priceHistory.map(p => Math.max(p.yes, p.no)));
  const minPrice = Math.min(...market.priceHistory.map(p => Math.min(p.yes, p.no)));
  const priceRange = maxPrice - minPrice;

  const getYPosition = (price: number) => {
    return ((maxPrice - price) / priceRange) * 200;
  };

  const yesPath = market.priceHistory.map((point, i) => {
    const x = (i / (market.priceHistory.length - 1)) * 600;
    const y = getYPosition(point.yes);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const noPath = market.priceHistory.map((point, i) => {
    const x = (i / (market.priceHistory.length - 1)) * 600;
    const y = getYPosition(point.no);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8 relative bg-white dark:bg-gray-950">
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <ShareButton
            marketId={market.id}
            marketTitle={market.question}
            marketDescription={market.description || ''}
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="mb-4 pr-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                {market.category}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {market.endDate}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2">{market.question}</h2>
            
            {market.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {market.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volume</div>
              <div className="text-base font-bold flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {market.volume}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Traders</div>
              <div className="text-base font-bold flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {market.participants}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">24h Change</div>
              <div className="text-base font-bold text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                +{((market.yesPrice - 0.5) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Price History</h3>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span>Yes {(market.yesPrice * 100).toFixed(0)}¢</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span>No {(market.noPrice * 100).toFixed(0)}¢</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <svg viewBox="0 0 600 220" className="w-full h-48">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = ((100 - val) / 100) * 200;
                  return (
                    <g key={val}>
                      <line
                        x1="0"
                        y1={y}
                        x2="600"
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-200 dark:text-gray-800"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="605"
                        y={y + 4}
                        className="text-gray-400 dark:text-gray-600 text-xs"
                        fill="currentColor"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Yes line */}
                <path
                  d={yesPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* No line */}
                <path
                  d={noPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Current price dots */}
                <circle
                  cx={(market.priceHistory.length - 1) / (market.priceHistory.length - 1) * 600}
                  cy={getYPosition(market.yesPrice)}
                  r="5"
                  fill="#10b981"
                />
                <circle
                  cx={(market.priceHistory.length - 1) / (market.priceHistory.length - 1) * 600}
                  cy={getYPosition(market.noPrice)}
                  r="5"
                  fill="#ef4444"
                />
              </svg>
            </div>
          </div>

          {/* Trading Section */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buy Yes</div>
              <div className="text-2xl font-bold text-green-600 mb-3">
                {(market.yesPrice * 100).toFixed(0)}¢
              </div>
              <Button 
                onClick={() => handleTrade('yes')}
                className="w-full bg-green-600 hover:bg-green-700" 
                size="sm"
              >
                Buy Yes
              </Button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buy No</div>
              <div className="text-2xl font-bold text-red-600 mb-3">
                {(market.noPrice * 100).toFixed(0)}¢
              </div>
              <Button 
                onClick={() => handleTrade('no')}
                className="w-full bg-red-600 hover:bg-red-700" 
                size="sm"
              >
                Buy No
              </Button>
            </div>
          </div>

          {/* Rules Summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-1.5 text-sm">Rules Summary</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              This market will resolve to <span className="font-semibold">Yes</span> if the event occurs before {market.endDate}. 
              Otherwise, it will resolve to <span className="font-semibold">No</span>. 
              Sources will be verified from official announcements and reputable news outlets.
            </p>
          </div>
        </div>
      </Card>

      {/* Connect Wallet Prompt */}
      {showConnectPrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to connect your wallet to start trading on BetUAA
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowConnectPrompt(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  setShowConnectPrompt(false);
                  onClose();
                }}
              >
                Connect Wallet
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Trade Confirmation Modal */}
      {showTradeConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Trade</h3>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You are about to buy <span className="font-bold text-{tradeSide === 'yes' ? 'green' : 'red'}-600">{tradeSide.toUpperCase()}</span> shares for:
              </p>
              <div className={`p-4 rounded-lg ${tradeSide === 'yes' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="text-2xl font-bold mb-1">
                  {tradeSide === 'yes' ? (market.yesPrice * 100).toFixed(0) : (market.noPrice * 100).toFixed(0)}¢
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">per share</div>
              </div>
            </div>
            <div className="flex gap-3 mb-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowTradeConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                className={`flex-1 ${tradeSide === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={executeTrade}
              >
                Confirm Trade
              </Button>
            </div>
            <Button 
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                setShowTradeConfirm(false);
                setShowDepositModal(true);
              }}
            >
              <DollarSign className="h-4 w-4" />
              Need More Funds? Deposit
            </Button>
          </Card>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          address={address}
          currentBalance={(usdcBalance?.formatted || ethBalance?.formatted || '0.00')}
          onDeposit={(amount: string) => {
            console.log('Deposit completed:', amount);
            setShowDepositModal(false);
            // Balance will update automatically via wagmi hooks
          }}
        />
      )}
    </div>
  );
}
