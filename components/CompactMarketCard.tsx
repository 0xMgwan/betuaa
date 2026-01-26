"use client";

import { TrendingUp, TrendingDown, Clock, Bitcoin, Trophy, Building2, Clapperboard, Cpu, BarChart3, LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { extractCategory, getCategoryInfo } from '@/lib/categoryUtils';

const iconMap: Record<string, LucideIcon> = {
  Bitcoin,
  Trophy,
  Building2,
  Clapperboard,
  Cpu,
  BarChart3,
};

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
  onTradeClick?: (marketId: number, outcomeId: number, outcomeName: string, price: number, paymentToken: string) => void;
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
  onTradeClick,
  paymentToken,
}: CompactMarketCardProps) {
  const handleButtonClick = (e: React.MouseEvent, outcomeId: number, outcomeName: string, price: number) => {
    e.stopPropagation();
    
    if (status !== 'active' || !onTradeClick || !paymentToken) {
      return;
    }
    
    onTradeClick(id, outcomeId, outcomeName, price, paymentToken);
  };
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

  // Get category icon component
  const getCategoryIcon = () => {
    const categoryKey = description ? extractCategory(description) : category.toLowerCase();
    const categoryInfo = getCategoryInfo(categoryKey as any);
    return iconMap[categoryInfo.icon] || BarChart3;
  };

  const CategoryIcon = getCategoryIcon();

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
      className="p-2.5 md:p-3 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer group active:scale-[0.98] border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm overflow-hidden relative"
      onClick={onClick}
    >
      {/* Subtle background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-2 mb-2">
          {/* Category Icon with enhanced gradient */}
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${getCategoryColor()} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
            <CategoryIcon className="w-4 h-4 md:w-5 md:h-5 text-white drop-shadow-sm" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1 flex-wrap">
              <span className="text-[9px] md:text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {actualCategory}
              </span>
              {isBlockchain && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
                  status === 'resolved'
                    ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300'
                    : status === 'active'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-400'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              )}
              <span className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {endDate}
              </span>
            </div>
            <h3 className="font-bold text-xs md:text-sm mb-1.5 line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
              {question}
            </h3>
          </div>
          
          {/* Trend Icon */}
          <div className="flex-shrink-0">
            {trend === "up" ? (
              <div className="p-1 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="p-1 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform">
                <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
        </div>

        {/* Mini Chart with enhanced styling */}
        <div className="mb-2 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-xl p-1.5 md:p-2 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 group-hover:border-blue-500/30 transition-all">
          <svg viewBox="0 0 200 50" className="w-full h-8 md:h-10">
            {/* Grid lines */}
            <line x1="0" y1="10" x2="200" y2="10" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-700" strokeDasharray="3 3" />
            <line x1="0" y1="25" x2="200" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-700" strokeDasharray="3 3" />
            <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-700" strokeDasharray="3 3" />
            
            {/* Gradient definition for line */}
            <defs>
              <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Price line with gradient */}
            <path
              d={yesPath}
              fill="none"
              stroke={`url(#gradient-${id})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:stroke-[3.5] transition-all drop-shadow-sm"
            />
            
            {/* Current price dot with glow */}
            <circle
              cx="200"
              cy={getYPosition(yesPrice)}
              r="4"
              fill="#10b981"
              className="group-hover:r-5 transition-all drop-shadow-lg"
            />
            <circle
              cx="200"
              cy={getYPosition(yesPrice)}
              r="6"
              fill="#10b981"
              opacity="0.3"
              className="group-hover:r-8 transition-all"
            />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            onClick={(e) => handleButtonClick(e, 0, 'Yes', yesPrice)}
            disabled={status !== 'active'}
            className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg px-2 py-2 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md group/yes"
          >
            <div className="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 font-medium mb-0.5">Yes</div>
            <div className="text-sm md:text-base font-bold text-green-600 dark:text-green-400 group-hover/yes:scale-105 transition-transform">
              {(yesPrice * 100).toFixed(0)}¢
            </div>
          </button>
          <button
            type="button"
            onClick={(e) => handleButtonClick(e, 1, 'No', noPrice)}
            disabled={status !== 'active'}
            className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg px-2 py-2 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200/50 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md group/no"
          >
            <div className="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 font-medium mb-0.5">No</div>
            <div className="text-sm md:text-base font-bold text-red-600 dark:text-red-400 group-hover/no:scale-105 transition-transform">
              {(noPrice * 100).toFixed(0)}¢
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between text-[9px] md:text-[10px]">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Volume:</span>
          <span className="font-bold text-gray-900 dark:text-white">{volume}</span>
        </div>
      </div>
    </Card>
  );
}
