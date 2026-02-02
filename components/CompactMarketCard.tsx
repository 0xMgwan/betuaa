"use client";

import { memo, useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, Bitcoin, Trophy, Building2, Clapperboard, Cpu, BarChart3, LucideIcon, Sparkles, Share2, Mail, MessageCircle, Send, X } from "lucide-react";
import { Card } from "./ui/card";
import { extractCategory, getCategoryInfo, extractResolutionType, extractCustomOutcomes, hasMarketImage } from '@/lib/categoryUtils';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useCTFMintPositionTokens } from "@/hooks/useCTFMarket";
import { useApproveToken, useTokenAllowance } from "@/hooks/useERC20";
import { CONTRACTS } from "@/lib/contracts";
import PurchaseSuccessModal from "./PurchaseSuccessModal";
import { useOutcomePrices } from "@/hooks/useOutcomePrices";

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
  image?: string;
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
  image,
}: CompactMarketCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [expandedOutcome, setExpandedOutcome] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [quickBuyAmount, setQuickBuyAmount] = useState(10);
  const [isBuying, setIsBuying] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'minting'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedOutcome, setPurchasedOutcome] = useState<string>("");

  // Wallet hooks
  const { address, isConnected } = useAccount();
  const { mintPositionTokens, isPending: isMinting, isSuccess: isMintSuccess } = useCTFMintPositionTokens();
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = useApproveToken();
  
  // Type guard for paymentToken - use a dummy address if undefined to satisfy TypeScript
  const validPaymentToken = (paymentToken && paymentToken.startsWith('0x') ? paymentToken : '0x0000000000000000000000000000000000000000') as `0x${string}`;
  
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(
    validPaymentToken,
    address || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
    CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`
  );

  // Handle successful mint
  useEffect(() => {
    if (isMintSuccess) {
      setIsBuying(false);
      setTxStatus('idle');
      setExpandedOutcome(null);
      setShowSuccessModal(true);
    }
  }, [isMintSuccess]);

  const handleButtonClick = (e: React.MouseEvent, outcomeId: number, outcomeName: string, price: number) => {
    e.stopPropagation();
    
    if (status !== 'active' || !onTradeClick || !paymentToken) {
      return;
    }
    
    onTradeClick(id, outcomeId, outcomeName, price, paymentToken);
  };

  const handleQuickBuy = (e: React.MouseEvent, outcomeId: number, outcomeName: string, price: number, position: 'yes' | 'no') => {
    e.stopPropagation();
    const outcomeKey = `${outcomeId}-${position}`;
    setExpandedOutcome(expandedOutcome === outcomeKey ? null : outcomeKey);
    setSelectedPosition(position);
  };

  // Direct buy handler for quick buy interface
  const handleDirectBuy = async (e: React.MouseEvent, outcomeName: string) => {
    e.stopPropagation();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!paymentToken) {
      alert("Payment token not configured");
      return;
    }

    try {
      setIsBuying(true);
      setPurchasedOutcome(outcomeName);
      const amountInWei = parseUnits(quickBuyAmount.toString(), 6); // USDC has 6 decimals

      // Check allowance
      const currentAllowance = allowance as bigint || BigInt(0);
      
      if (currentAllowance < amountInWei) {
        setTxStatus('approving');
        console.log('Requesting approval...');
        
        // Use max uint256 for infinite approval to avoid future approvals
        const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        
        await approve(
          paymentToken as `0x${string}`,
          CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
          maxApproval
        );
        
        console.log('Approval transaction submitted, waiting for confirmation...');
        // Wait a bit for the approval to be indexed
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchAllowance();
      }

      // Mint position tokens
      setTxStatus('minting');
      console.log('Minting position tokens...');
      await mintPositionTokens(id, amountInWei);
      
    } catch (error: any) {
      console.error("Buy error:", error);
      if (error?.message?.includes('User rejected')) {
        alert('Transaction cancelled');
      } else {
        alert(error?.message || "Failed to complete purchase");
      }
      setIsBuying(false);
      setTxStatus('idle');
    }
  };
  
  // Extract custom outcomes and resolution type
  const resolutionType = description ? extractResolutionType(description) : 'yesno';
  const customOutcomes = description ? extractCustomOutcomes(description) : [];
  const isCustomMarket = resolutionType === 'custom' && customOutcomes.length > 0;
  
  // Share handlers
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out this prediction market: ${question}`;
  
  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    
    const shareLinks = {
      email: `mailto:?subject=${encodeURIComponent(question)}&body=${encodedText}%20${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      discord: `https://discord.com/channels/@me?message=${encodedText}%20${encodedUrl}`,
    };
    
    if (platform in shareLinks) {
      window.open(shareLinks[platform as keyof typeof shareLinks], '_blank');
    }
    
    setShowShareMenu(false);
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
    <>
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
            {/* Category Icon or Market Image for custom markets */}
            <motion.div 
              className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl ${image ? 'p-0' : `bg-gradient-to-br ${getCategoryColor()}`} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-2xl relative overflow-hidden`}
              whileHover={{ rotate: image ? 0 : [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              {image ? (
                <img 
                  src={image} 
                  alt={question}
                  className="w-full h-full object-cover rounded-lg md:rounded-xl"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
                  <CategoryIcon className="w-4 h-4 md:w-5 md:h-5 text-white drop-shadow-lg relative z-10" />
                </>
              )}
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
          {isCustomMarket ? (
            // Custom Outcomes Display with Quick Buy and Scrolling
            <div className="mb-1.5 md:mb-2">
              <div className={`space-y-1.5 ${customOutcomes.length > 3 ? 'max-h-[120px] overflow-y-scroll pr-1 smooth-scroll-container' : ''} scrollbar-hide`}>
                {customOutcomes.map((outcome, index) => {
                  const colors = [
                    { bg: 'from-blue-50 via-cyan-50 to-blue-50', darkBg: 'dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-blue-900/30', border: 'border-blue-200/70 dark:border-blue-700/50', hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600', text: 'text-blue-600 dark:text-blue-400', shadow: 'hover:shadow-blue-500/30' },
                    { bg: 'from-purple-50 via-pink-50 to-purple-50', darkBg: 'dark:from-purple-900/30 dark:via-pink-900/30 dark:to-purple-900/30', border: 'border-purple-200/70 dark:border-purple-700/50', hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600', text: 'text-purple-600 dark:text-purple-400', shadow: 'hover:shadow-purple-500/30' },
                    { bg: 'from-amber-50 via-orange-50 to-amber-50', darkBg: 'dark:from-amber-900/30 dark:via-orange-900/30 dark:to-amber-900/30', border: 'border-amber-200/70 dark:border-amber-700/50', hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600', text: 'text-amber-600 dark:text-amber-400', shadow: 'hover:shadow-amber-500/30' },
                  ][index % 3];
                  
                  // Fetch real-time prices for this outcome
                  const { yesPrice, noPrice } = useOutcomePrices(id, index);
                  
                  const isYesExpanded = expandedOutcome === `${index}-yes`;
                  const isNoExpanded = expandedOutcome === `${index}-no`;
                  const isExpanded = isYesExpanded || isNoExpanded;
                  const currentPrice = isYesExpanded ? yesPrice : noPrice;
                  const estimatedCost = (quickBuyAmount * currentPrice / 100).toFixed(2);
                  
                  return (
                    <motion.div
                      key={index}
                      className="space-y-1.5"
                    >
                      {/* Interactive Row: Outcome Name + Yes/No -> Slider -> Buy */}
                      <div className="flex items-center gap-2">
                        {/* Outcome Name */}
                        <div className={`text-[10px] md:text-xs font-bold ${colors.text} flex-shrink-0`}>
                          {outcome}
                        </div>
                        
                        {/* Yes/No or Slider Interface */}
                        <div className="flex items-center gap-2 flex-1">
                        {!isExpanded ? (
                          <>
                            {/* Yes Button */}
                            <motion.button
                              type="button"
                              onClick={(e) => handleQuickBuy(e, index, `${outcome} - Yes`, yesPrice, 'yes')}
                              disabled={status !== 'active'}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="flex-1 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg px-3 py-1.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-green-200/70 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg hover:shadow-green-500/25"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="text-[9px] font-semibold text-green-700 dark:text-green-400">Yes</div>
                                <div className="text-sm font-black text-green-600 dark:text-green-400">{yesPrice}¢</div>
                              </div>
                            </motion.button>
                            
                            {/* No Button */}
                            <motion.button
                              type="button"
                              onClick={(e) => handleQuickBuy(e, index, `${outcome} - No`, noPrice, 'no')}
                              disabled={status !== 'active'}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="flex-1 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg px-3 py-1.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200/70 dark:border-red-700/50 hover:border-red-400 dark:hover:border-red-600 hover:shadow-lg hover:shadow-red-500/25"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="text-[9px] font-semibold text-red-700 dark:text-red-400">No</div>
                                <div className="text-sm font-black text-red-600 dark:text-red-400">{noPrice}¢</div>
                              </div>
                            </motion.button>
                          </>
                        ) : (
                          <AnimatePresence mode="wait">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex items-center gap-2 flex-1"
                            >
                              {/* Position Badge */}
                              <div className={`px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap ${
                                isYesExpanded 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                              }`}>
                                {isYesExpanded ? 'Yes' : 'No'} {currentPrice}¢
                              </div>
                              
                              {/* Amount Slider */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="range"
                                  min="1"
                                  max="100"
                                  value={quickBuyAmount}
                                  onChange={(e) => setQuickBuyAmount(Number(e.target.value))}
                                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, ${isYesExpanded ? '#10b981' : '#ef4444'} ${(quickBuyAmount / 100) * 100}%, #e5e7eb ${(quickBuyAmount / 100) * 100}%)`
                                  }}
                                />
                                <div className="text-[8px] text-gray-500 dark:text-gray-400 text-center mt-0.5">
                                  {quickBuyAmount} USDC
                                </div>
                              </div>
                              
                              {/* Buy Button */}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleDirectBuy(e, `${outcome} - ${isYesExpanded ? 'Yes' : 'No'}`)}
                                disabled={isBuying || isMinting || isApproving}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black text-white transition-colors whitespace-nowrap ${
                                  isYesExpanded
                                    ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-400'
                                    : 'bg-red-500 hover:bg-red-600 disabled:bg-red-400'
                                } disabled:cursor-not-allowed`}
                              >
                                {txStatus === 'approving' ? '✓ Approve' : txStatus === 'minting' ? '✓ Confirm' : isBuying ? '...' : 'Buy'}
                              </motion.button>
                              
                              {/* Close Button */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedOutcome(null);
                                }}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </motion.button>
                            </motion.div>
                          </AnimatePresence>
                        )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Scroll indicator for more options */}
              {customOutcomes.length > 3 && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                    Scroll for {customOutcomes.length - 3} more options
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Standard Yes/No buttons
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
          )}

          {/* Enhanced volume display with share button */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Volume</span>
              <div className="flex items-center gap-1">
                <span className="font-black text-[10px] md:text-xs text-gray-900 dark:text-white">{volume}</span>
                <Image 
                  src="/USDC logo.png" 
                  alt="USDC"
                  width={12}
                  height={12}
                  className="rounded-full md:w-3 md:h-3"
                />
              </div>
            </div>
            <div className="relative">
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(!showShareMenu);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Share market"
              >
                <Share2 className="w-3 h-3 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
              </motion.button>
              
              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('email');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('whatsapp');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('twitter');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter)
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('telegram');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      Telegram
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('discord');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Discord
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Card>
      </motion.div>

      {/* Purchase Success Modal */}
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        marketTitle={question}
        outcomeName={purchasedOutcome}
        amount={quickBuyAmount}
        tokenSymbol="USDC"
      />
    </>
  );
}

export default memo(CompactMarketCard);

// Add custom styles for slider
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .slider::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: currentColor;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: currentColor;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `;
  if (!document.head.querySelector('style[data-compact-market-card]')) {
    style.setAttribute('data-compact-market-card', 'true');
    document.head.appendChild(style);
  }
}
