"use client";

import { memo } from "react";
import { TrendingUp, TrendingDown, Clock, Bitcoin, Trophy, Building2, Clapperboard, Cpu, BarChart3, LucideIcon, Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import { extractCategory, getCategoryInfo } from '@/lib/categoryUtils';
import Image from 'next/image';
import { motion } from "framer-motion";

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

function CompactMarketCard({
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card 
        className="relative p-2.5 md:p-3 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 transition-all duration-500 group"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Glow effect on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-1.5 md:gap-2 mb-1.5 md:mb-2">
            {/* Category Icon with enhanced gradient and animation */}
            <motion.div 
              className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${getCategoryColor()} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-2xl relative overflow-hidden`}
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
              <CategoryIcon className="w-4 h-4 md:w-5 md:h-5 text-white drop-shadow-lg relative z-10" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1 flex-wrap">
                <motion.span 
                  className="text-[8px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30"
                  whileHover={{ scale: 1.05 }}
                >
                  {actualCategory}
                </motion.span>
                {isBlockchain && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-1 md:px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold shadow-md flex items-center gap-0.5 ${
                      status === 'resolved'
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300'
                        : status === 'active'
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-400'
                    }`}
                  >
                    {status === 'active' && <Sparkles className="w-2 h-2" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </motion.span>
                )}
                <span className="text-[8px] md:text-[9px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5 font-medium">
                  <Clock className="h-2 w-2 md:h-2.5 md:w-2.5" />
                  {endDate}
                </span>
              </div>
              <h3 className="font-bold text-[11px] md:text-xs mb-1 md:mb-1.5 line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {question}
              </h3>
            </div>
            
            {/* Trend Icon with animation */}
            <motion.div 
              className="flex-shrink-0"
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {trend === "up" ? (
                <div className="p-0.5 md:p-1 rounded-md md:rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 shadow-md">
                  <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-0.5 md:p-1 rounded-md md:rounded-lg bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 shadow-md">
                  <TrendingDown className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-600 dark:text-red-400" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Enhanced Mini Chart with gradient fill */}
          <motion.div 
            className="mb-1.5 md:mb-2 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg md:rounded-xl p-1.5 md:p-2 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 group-hover:border-blue-500/50 transition-all shadow-inner backdrop-blur-sm"
            whileHover={{ scale: 1.02 }}
          >
            <svg viewBox="0 0 200 50" className="w-full h-6 md:h-8">
              {/* Grid lines */}
              <line x1="0" y1="10" x2="200" y2="10" stroke="currentColor" strokeWidth="0.3" className="text-gray-300 dark:text-gray-600" strokeDasharray="2 2" opacity="0.5" />
              <line x1="0" y1="25" x2="200" y2="25" stroke="currentColor" strokeWidth="0.3" className="text-gray-300 dark:text-gray-600" strokeDasharray="2 2" opacity="0.5" />
              <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="0.3" className="text-gray-300 dark:text-gray-600" strokeDasharray="2 2" opacity="0.5" />
              
              {/* Enhanced gradient definitions */}
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`area-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Area fill under the line */}
              <path
                d={`${yesPath} L 200 50 L 0 50 Z`}
                fill={`url(#area-gradient-${id})`}
              />
              
              {/* Price line with gradient and glow */}
              <path
                d={yesPath}
                fill="none"
                stroke={`url(#gradient-${id})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-lg"
                filter="url(#glow)"
              />
              
              {/* Glow filter */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Current price dot with enhanced glow */}
              <circle
                cx="200"
                cy={getYPosition(yesPrice)}
                r="5"
                fill="#3b82f6"
                className="drop-shadow-2xl"
              />
              <circle
                cx="200"
                cy={getYPosition(yesPrice)}
                r="3"
                fill="#ffffff"
              />
              <circle
                cx="200"
                cy={getYPosition(yesPrice)}
                r="8"
                fill="#3b82f6"
                opacity="0.2"
              >
                <animate attributeName="r" from="8" to="12" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </motion.div>

          {/* Enhanced price buttons with animations */}
          <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
            <motion.button
              type="button"
              onClick={(e) => handleButtonClick(e, 0, 'Yes', yesPrice)}
              disabled={status !== 'active'}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-green-900/30 rounded-lg md:rounded-xl px-2 py-1.5 md:py-2 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 dark:hover:from-green-900/50 dark:hover:via-emerald-900/50 dark:hover:to-green-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-200/70 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg hover:shadow-green-500/30 group/yes backdrop-blur-sm"
            >
              <div className="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 font-semibold mb-0.5">Yes</div>
              <div className="text-base md:text-lg font-black text-green-600 dark:text-green-400 group-hover/yes:scale-110 transition-transform">
                {(yesPrice * 100).toFixed(0)}¢
              </div>
            </motion.button>
            <motion.button
              type="button"
              onClick={(e) => handleButtonClick(e, 1, 'No', noPrice)}
              disabled={status !== 'active'}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-gradient-to-br from-red-50 via-rose-50 to-red-50 dark:from-red-900/30 dark:via-rose-900/30 dark:to-red-900/30 rounded-lg md:rounded-xl px-2 py-1.5 md:py-2 hover:from-red-100 hover:via-rose-100 hover:to-red-100 dark:hover:from-red-900/50 dark:hover:via-rose-900/50 dark:hover:to-red-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200/70 dark:border-red-700/50 hover:border-red-400 dark:hover:border-red-600 hover:shadow-lg hover:shadow-red-500/30 group/no backdrop-blur-sm"
            >
              <div className="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 font-semibold mb-0.5">No</div>
              <div className="text-base md:text-lg font-black text-red-600 dark:text-red-400 group-hover/no:scale-110 transition-transform">
                {(noPrice * 100).toFixed(0)}¢
              </div>
            </motion.button>
          </div>

          {/* Enhanced volume display */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Volume</span>
            <div className="flex items-center gap-1">
              <Image 
                src="/USDC logo.png" 
                alt="USDC"
                width={12}
                height={12}
                className="rounded-full md:w-3 md:h-3"
              />
              <span className="font-black text-[10px] md:text-xs text-gray-900 dark:text-white">{volume}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default memo(CompactMarketCard);
