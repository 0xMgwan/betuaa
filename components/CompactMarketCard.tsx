"use client";

import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { extractCategory, getCategoryInfo } from '@/lib/categoryUtils';

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
}

export default function CompactMarketCard({
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
}: CompactMarketCardProps) {
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
    const iconClass = "h-5 w-5 text-white";
    switch (category.toLowerCase()) {
      case 'sports':
        return '⚽';
      case 'crypto':
        return '₿';
      case 'politics':
        return '🏛️';
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
      className="p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Category Icon */}
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor()} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
          <span className="text-lg">{getCategoryIcon()}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
              {actualCategory}
            </span>
            {isBlockchain && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                status === 'resolved'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {endDate}
            </span>
          </div>
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {question}
          </h3>
        </div>
        
        {/* Trend Icon */}
        <div className="flex-shrink-0">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
          )}
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 overflow-hidden">
        <svg viewBox="0 0 200 50" className="w-full h-12">
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

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
          <div className="text-xs text-gray-600 dark:text-gray-400">Yes</div>
          <div className="text-lg font-bold text-green-600">
            {(yesPrice * 100).toFixed(0)}¢
          </div>
        </div>
        <div className="flex-1 bg-red-100 dark:bg-red-900/30 rounded-lg px-3 py-2 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
          <div className="text-xs text-gray-600 dark:text-gray-400">No</div>
          <div className="text-lg font-bold text-red-600">
            {(noPrice * 100).toFixed(0)}¢
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400">
        Volume: <span className="font-semibold">{volume}</span>
      </div>
    </Card>
  );
}
