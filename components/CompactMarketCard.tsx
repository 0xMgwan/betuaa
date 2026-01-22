"use client";

import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { extractCategory, getCategoryInfo } from '@/lib/categoryUtils';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TradingModal from './TradingModal';
import { STABLECOINS } from '@/lib/contracts';

interface CompactMarketCardProps {
  id: number;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  trend: "up" | "down";
  priceHistory: { time: string; yes: number; no: number }[];
  onClick?: () => void;
  isBlockchain?: boolean;
  status?: 'active' | 'closed' | 'resolved';
  description?: string;
  onTrade?: (outcomeId: number, outcomeName: string, price: number) => void;
  paymentToken?: string;
}

export default function CompactMarketCard({
  id,
  question,
  category,
  yesPrice,
  noPrice,
  volume,
  endDate,
  trend,
  priceHistory,
  onClick,
  isBlockchain = false,
  status = 'active',
  description,
  onTrade,
  paymentToken,
}: CompactMarketCardProps) {
  const { isConnected } = useAccount();
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<{ id: number; name: string; price: number } | null>(null);

  const handleTradeClick = (e: React.MouseEvent, outcomeId: number, outcomeName: string, price: number) => {
    e.stopPropagation();
    
    if (!isConnected) {
      setShowConnectPrompt(true);
      return;
    }
    
    if (status !== 'active') {
      return;
    }
    
    // Open trading modal directly
    setSelectedOutcome({ id: outcomeId, name: outcomeName, price });
    setShowTradingModal(true);
  };

  // Get token info
  const token = paymentToken ? STABLECOINS.baseSepolia.find(
    (t) => t.address.toLowerCase() === paymentToken.toLowerCase()
  ) : null;
  // Extract category from description if available (for blockchain markets)
  const actualCategory = description ? getCategoryInfo(extractCategory(description)).label : category;
  
  // Debug logging
  if (description) {
    console.log('CompactMarketCard Debug:', {
      description,
      extractedCategory: extractCategory(description),
      actualCategory,
      originalCategory: category
    });
  }
  
  // Generate SVG path for mini chart
  const maxPrice = Math.max(...priceHistory.map(p => Math.max(p.yes, p.no)));
  const minPrice = Math.min(...priceHistory.map(p => Math.min(p.yes, p.no)));
  const priceRange = maxPrice - minPrice || 0.1;

  const getYPosition = (price: number) => {
    return ((maxPrice - price) / priceRange) * 40;
  };

  const yesPath = priceHistory.map((point, i) => {
    const x = (i / (priceHistory.length - 1)) * 200;
    const y = getYPosition(point.yes);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Get category icon
  const getCategoryIcon = () => {
    const cat = actualCategory.toLowerCase();
    switch (cat) {
      case 'sports':
        return '⚽';
      case 'crypto':
        return '₿';
      case 'politics':
        return '🏛️';
      case 'entertainment':
        return '🎬';
      case 'technology':
        return '💻';
      case 'other':
        return '📊';
      case 'business':
        return '💼';
      case 'tech':
        return '💻';
      case 'climate':
        return '🌍';
      default:
        return '📊';
    }
  };

  const getCategoryColor = () => {
    // Use actualCategory for blockchain markets, fallback to category prop
    const cat = (description ? actualCategory : category).toLowerCase();
    
    switch (cat) {
      case 'sports':
        return 'from-green-500 to-emerald-600';
      case 'crypto':
        return 'from-orange-500 to-yellow-600';
      case 'politics':
        return 'from-blue-500 to-indigo-600';
      case 'entertainment':
        return 'from-purple-500 to-pink-600';
      case 'technology':
        return 'from-cyan-500 to-blue-600';
      case 'other':
        return 'from-gray-500 to-slate-600';
      case 'business':
        return 'from-purple-500 to-pink-600';
      case 'tech':
        return 'from-cyan-500 to-blue-600';
      case 'climate':
        return 'from-teal-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <Card 
      className="p-2 md:p-3 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer group active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-start gap-2 mb-2">
        {/* Category Icon */}
        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br ${getCategoryColor()} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <span className="text-sm md:text-base">{getCategoryIcon()}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] md:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
              {actualCategory}
            </span>
            {isBlockchain && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                status === 'resolved'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
            <span className="text-[10px] md:text-xs text-gray-500 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {endDate}
            </span>
          </div>
          <h3 className="font-semibold text-xs md:text-sm mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {question}
          </h3>
        </div>
        
        {/* Trend Icon */}
        <div className="flex-shrink-0">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500 group-hover:scale-105 transition-transform" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500 group-hover:scale-105 transition-transform" />
          )}
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-1.5 overflow-hidden">
        <svg viewBox="0 0 200 50" className="w-full h-8 md:h-10">
          {/* Grid lines */}
          <line x1="0" y1="10" x2="200" y2="10" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-800" strokeDasharray="2 2" />
          <line x1="0" y1="25" x2="200" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-800" strokeDasharray="2 2" />
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-800" strokeDasharray="2 2" />
          
          {/* Price line */}
          <path
            d={yesPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-[3] transition-all"
          />
          
          {/* Current price dot */}
          <circle
            cx="200"
            cy={getYPosition(yesPrice)}
            r="3"
            fill="#10b981"
            className="group-hover:r-4 transition-all"
          />
        </svg>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <button
          onClick={(e) => handleTradeClick(e, 0, 'Yes', yesPrice)}
          disabled={status !== 'active'}
          className="flex-1 bg-green-100 dark:bg-green-900/30 rounded-lg px-2 md:px-2.5 py-1.5 hover:bg-green-200 dark:hover:bg-green-900/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">Yes</div>
          <div className="text-sm md:text-base font-bold text-green-600">
            {(yesPrice * 100).toFixed(0)}¢
          </div>
        </button>
        <button
          onClick={(e) => handleTradeClick(e, 1, 'No', noPrice)}
          disabled={status !== 'active'}
          className="flex-1 bg-red-100 dark:bg-red-900/30 rounded-lg px-2 md:px-2.5 py-1.5 hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">No</div>
          <div className="text-sm md:text-base font-bold text-red-600">
            {(noPrice * 100).toFixed(0)}¢
          </div>
        </button>
      </div>

      {/* Connect Wallet Prompt */}
      {showConnectPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConnectPrompt(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full border-2 border-gray-200 dark:border-gray-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connect Wallet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please connect your wallet to start trading on this market.
            </p>
            <div className="flex flex-col gap-2">
              <ConnectButton />
              <button
                onClick={() => setShowConnectPrompt(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trading Modal */}
      {selectedOutcome && paymentToken && (
        <TradingModal
          isOpen={showTradingModal}
          onClose={() => {
            setShowTradingModal(false);
            setSelectedOutcome(null);
          }}
          marketId={id}
          outcomeId={selectedOutcome.id}
          outcomeName={selectedOutcome.name}
          currentPrice={selectedOutcome.price}
          paymentToken={paymentToken}
          tokenSymbol={token?.symbol || 'USDC'}
          tokenDecimals={token?.decimals || 6}
        />
      )}

      <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
        Volume: <span className="font-semibold">{volume}</span>
      </div>
    </Card>
  );
}
