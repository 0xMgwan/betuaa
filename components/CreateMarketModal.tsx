'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Calendar, DollarSign, Tag, FileText, ChevronDown, Wallet, Bitcoin, Trophy, Building2, Clapperboard, Cpu, BarChart3, Zap as ZapIcon } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { STABLECOINS } from '@/lib/contracts';
import { useCTFCreateMarket } from '@/hooks/useCTFMarket';
import { useTranslation } from '@/hooks/useTranslation';
import Image from 'next/image';
import { CATEGORIES as CATEGORY_CONFIG } from '@/lib/categoryUtils';
import { PYTH_PRICE_FEEDS, fetchPythPrice, generatePythMarketQuestion, type PythFeedId } from '@/lib/pyth';
import { useConfigurePythMarket } from '@/hooks/usePythResolver';
import CustomDropdown from '@/components/CustomDropdown';

const iconMap = {
  Bitcoin,
  Trophy,
  Building2,
  Clapperboard,
  Cpu,
  BarChart3,
};

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.label,
  icon: config.icon,
  color: config.color,
  bgColor: config.bgColor,
  textColor: config.textColor,
}));

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateMarketModal({ isOpen, onClose }: CreateMarketModalProps) {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>(STABLECOINS.baseSepolia[0].address);
  const [category, setCategory] = useState('crypto');
  const [step, setStep] = useState<'form' | 'create'>('form');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  
  // Resolution type and outcomes
  const [resolutionType, setResolutionType] = useState<'yesno' | 'custom'>('yesno');
  const [customOutcomes, setCustomOutcomes] = useState<string[]>(['', '']);
  const [marketImage, setMarketImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Pyth market mode
  const [isPythMode, setIsPythMode] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<PythFeedId>('ETH/USD');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [threshold, setThreshold] = useState('');
  const [isAbove, setIsAbove] = useState(true);
  const [expiryDays, setExpiryDays] = useState(1);

  const { createMarket, isPending: isCreating, isSuccess, hash: createHash, reset: resetCreateMarket } = useCTFCreateMarket();
  const { configurePythMarket, isPending: isConfiguringPyth, isSuccess: isPythConfigured } = useConfigurePythMarket();

  const selectedStablecoin = STABLECOINS.baseSepolia.find(t => t.address === selectedToken);
  
  // Store Pyth market data for configuration after creation
  const [pythMarketData, setPythMarketData] = useState<{
    priceId: string;
    threshold: number;
    expiryTime: number;
    isAbove: boolean;
  } | null>(null);

  // Reset all form state
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClosingDate('');
    setStep('form');
    setPythMarketData(null);
    setThreshold('');
    setIsAbove(true);
    setExpiryDays(1);
    setAgreedToTerms(false);
    setMarketImage(null);
    setImagePreview(null);
    resetCreateMarket();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && isSuccess) {
      resetCreateMarket();
    }
  }, [isOpen]);

  // Remove auto-switch effect since crypto is now only in Pyth mode

  // Fetch current price when feed changes
  useEffect(() => {
    if (isPythMode) {
      const fetchPrice = async () => {
        const feed = PYTH_PRICE_FEEDS[selectedFeed];
        try {
          const priceData = await fetchPythPrice(feed.id);
          setCurrentPrice(parseFloat(priceData.formattedPrice.replace(/,/g, '')));
        } catch (err) {
          console.error('Error fetching price:', err);
        }
      };
      fetchPrice();
    }
  }, [selectedFeed, isPythMode]);

  // Automatically configure Pyth market after creation succeeds
  useEffect(() => {
    let isMounted = true;
    let hasConfigured = false;

    const configurePyth = async () => {
      // Prevent multiple calls
      if (hasConfigured || !isSuccess || !pythMarketData || !isPythMode) {
        return;
      }

      hasConfigured = true;

      try {
        console.log('🔄 Starting Pyth market configuration...');
        console.log('📋 Pyth Market Data:', pythMarketData);
        
        // Wait for transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (!isMounted) return;

        // Fetch market count from API
        console.log('📡 Fetching market count from API...');
        const response = await fetch('/api/market-count');

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const apiData = await response.json();
        console.log('📊 API Response:', apiData);

        if (!apiData.success) {
          throw new Error(`API Error: ${apiData.error}`);
        }

        if (!isMounted) return;

        const marketCount = apiData.marketCount;
        const marketId = apiData.marketId;

        console.log('🔢 Market count:', marketCount, 'Latest Market ID:', marketId);
        console.log('⚙️ Calling configurePythMarket with:', {
          marketId,
          priceId: pythMarketData.priceId,
          threshold: pythMarketData.threshold,
          expiryTime: pythMarketData.expiryTime,
          isAbove: pythMarketData.isAbove,
        });

        // Configure Pyth resolution - only call once
        configurePythMarket(
          marketId,
          pythMarketData.priceId,
          pythMarketData.threshold,
          pythMarketData.expiryTime,
          pythMarketData.isAbove
        );

        console.log('✅ Pyth configuration transaction submitted');
      } catch (error) {
        console.error('❌ Error configuring Pyth market:', error);
        // Still clear the data even if configuration fails
        if (isMounted) {
          setPythMarketData(null);
        }
      }
    };

    configurePyth();

    return () => {
      isMounted = false;
    };
  }, [isSuccess, pythMarketData, isPythMode, configurePythMarket]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMarketImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMarket = async () => {
    if (!selectedStablecoin) return;

    try {
      let marketTitle = title;
      let marketDescription = description;
      let closingTimestamp: bigint;

      if (isPythMode) {
        const feed = PYTH_PRICE_FEEDS[selectedFeed];
        const expiryTime = Math.floor(Date.now() / 1000) + expiryDays * 86400;
        closingTimestamp = BigInt(expiryTime);
        
        marketTitle = generatePythMarketQuestion({
          priceId: feed.id,
          feedName: feed.name,
          marketType: 'threshold',
          threshold: parseFloat(threshold),
          expiryTime,
          isAbove,
        });
        
        marketDescription = `[PYTH][CATEGORY:crypto] Pyth-powered market: ${feed.name} price prediction. Auto-resolves based on ${feed.symbol} price feed.`;
        
        // Store Pyth data for configuration after market creation
        const pythData = {
          priceId: feed.id,
          threshold: parseFloat(threshold),
          expiryTime,
          isAbove,
        };
        console.log('💾 Storing Pyth market data:', pythData);
        setPythMarketData(pythData);
      } else {
        closingTimestamp = BigInt(Math.floor(new Date(closingDate).getTime() / 1000));
        
        // Build description with resolution type and custom outcomes
        const descriptionMetadata: any = {
          category,
          text: description,
          resolutionType,
        };
        
        if (resolutionType === 'custom' && customOutcomes.filter(o => o.trim()).length > 0) {
          const validOutcomes = customOutcomes.filter(o => o.trim());
          descriptionMetadata.outcomes = validOutcomes;
        }
        
        // Add image metadata if present
        if (marketImage) {
          descriptionMetadata.image = marketImage;
        }
        
        // Store as JSON string
        marketDescription = JSON.stringify(descriptionMetadata);
      }

      console.log('📤 Calling createMarket with:', {
        title: marketTitle,
        description: marketDescription,
        closingTimestamp: closingTimestamp.toString(),
        isPythMode,
        resolutionType,
        customOutcomes: customOutcomes.filter(o => o.trim()),
        hasImage: !!marketImage
      });

      await createMarket(
        marketTitle,
        marketDescription,
        BigInt(2), // Binary market (2 outcomes)
        closingTimestamp,
        selectedToken as `0x${string}`
      );
      
      console.log('✅ createMarket called successfully');
    } catch (error) {
      console.error('Error creating market:', error);
      setStep('form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      // Show alert or error message
      alert('Please agree to the Terms and Conditions to create a market.');
      return;
    }
    
    setStep('create');
    await handleCreateMarket();
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            {/* Success Icon with Animation */}
            <div className="relative mb-6">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              </div>
              
              {/* Icon container */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50">
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-full"></div>
                <span className="text-4xl md:text-5xl relative z-10 drop-shadow-lg">✅</span>
              </div>
            </div>

            {/* Title with gradient */}
            <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
              Market Created Successfully! 🎉
            </h3>
            
            {/* Description */}
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Your prediction market has been successfully deployed on <span className="font-semibold text-blue-600 dark:text-blue-400">Base Sepolia</span>
            </p>

            {/* Pyth Configuration Status */}
            {isPythMode && isConfiguringPyth && (
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-blue-500/20">
                    <ZapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    Configuring auto-resolution...
                  </p>
                </div>
              </div>
            )}
            
            {isPythMode && isPythConfigured && (
              <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-4 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-green-500/20">
                    <ZapIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    ✨ Auto-resolution configured!
                  </p>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {createHash && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Transaction Hash
                </p>
                <a
                  href={`https://sepolia.basescan.org/tx/${createHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 break-all underline decoration-dotted"
                >
                  {createHash}
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => {
                  resetForm();
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm md:text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Create Another Market
              </button>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl font-bold text-sm md:text-base transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[85vh] md:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 md:p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative group">
              {/* Subtle background glow */}
              <div className="absolute -inset-2 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl blur-xl"></div>
              
              {/* Main icon container with geometric design */}
              <div className="relative w-10 h-10 md:w-16 md:h-16">
                {/* Background layers for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl rotate-6 opacity-80"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl -rotate-6 opacity-60"></div>
                
                {/* Main surface */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 rounded-2xl shadow-2xl border border-white/30">
                  {/* Top highlight */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl"></div>
                  
                  {/* Custom chart/trend icon */}
                  <svg className="absolute inset-0 w-full h-full p-2 md:p-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Rising bars */}
                    <rect x="3" y="14" width="3" height="7" rx="1" fill="white" fillOpacity="0.9"/>
                    <rect x="8" y="10" width="3" height="11" rx="1" fill="white" fillOpacity="0.95"/>
                    <rect x="13" y="6" width="3" height="15" rx="1" fill="white"/>
                    <rect x="18" y="3" width="3" height="18" rx="1" fill="white"/>
                    {/* Trend line */}
                    <path d="M4 16L9 12L14 8L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    {/* Star accent */}
                    <circle cx="20" cy="4" r="2" fill="white"/>
                  </svg>
                  
                  {/* Bottom shadow */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl"></div>
                </div>
                
                {/* Corner accent */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-lg"></div>
              </div>
            </div>
            <div>
              <h2 className="text-base md:text-3xl font-black text-white drop-shadow-lg tracking-tight">{t('createMarket.title')}</h2>
              <p className="text-[10px] md:text-sm text-white/80 font-medium mt-0.5">Launch your prediction market</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2.5 hover:bg-white/20 rounded-xl transition-all hover:scale-110 active:scale-95 group"
          >
            <X className="w-4 h-4 md:w-6 md:h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-3 md:space-y-6">
          {/* Market Type Toggle - Enhanced */}
          <div className="flex gap-1.5 md:gap-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => setIsPythMode(false)}
              className={`flex-1 py-2 md:py-2.5 px-2 md:px-4 rounded-md md:rounded-lg font-semibold text-xs md:text-sm transition-all duration-300 ${
                !isPythMode
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20 scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Traditional Market
            </button>
            <button
              type="button"
              onClick={() => setIsPythMode(true)}
              className={`flex-1 py-2 md:py-2.5 px-2 md:px-4 rounded-md md:rounded-lg font-semibold text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                isPythMode
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <ZapIcon className={`w-3 md:w-4 h-3 md:h-4 ${isPythMode ? 'animate-pulse' : ''}`} />
              Crypto & Commodities
            </button>
          </div>

          {isPythMode && (
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-lg md:rounded-xl p-2.5 md:p-5 shadow-lg shadow-blue-500/10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg bg-blue-500/20">
                    <ZapIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-semibold text-blue-900 dark:text-blue-200">Auto-Resolution Enabled</p>
                  <p className="text-[10px] md:text-xs text-blue-800 dark:text-blue-300 mt-0.5 md:mt-1">This market will automatically resolve based on Pyth price feeds when it expires.</p>
                </div>
              </div>
            </div>
          )}

          {isPythMode ? (
            <>
              {/* Pyth Price Feed Selection - Custom Dropdown */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 md:gap-2">
                  <div className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-md md:rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-sm">
                    <BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  Price Feed
                </label>
                <CustomDropdown
                  options={Object.entries(PYTH_PRICE_FEEDS).map(([key, feed]) => ({
                    value: key,
                    label: `${feed.name} (${feed.symbol})`,
                    icon: feed.symbol === 'BTC' ? '₿' : feed.symbol === 'ETH' ? 'Ξ' : '💱',
                    description: `Current: $${feed.symbol}`,
                  }))}
                  value={selectedFeed}
                  onChange={(value) => setSelectedFeed(value as PythFeedId)}
                  placeholder="Select a price feed..."
                  accentColor="blue"
                />
              </div>

              {/* Current Price Display - Enhanced */}
              {currentPrice && (
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-lg md:rounded-xl p-3 md:p-5 shadow-lg shadow-blue-500/10">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <p className="text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Current {PYTH_PRICE_FEEDS[selectedFeed].symbol} Price</p>
                    <p className="text-2xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1 md:mt-2">
                      ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Threshold Input - Enhanced */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 md:gap-2">
                  <div className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-md md:rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm">
                    <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  Threshold Price (${PYTH_PRICE_FEEDS[selectedFeed].symbol})
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-base md:text-lg">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder={currentPrice ? currentPrice.toString() : 'Enter price'}
                    className="w-full pl-8 md:pl-10 pr-4 py-3 md:py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-bold text-base md:text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {threshold && (
                    <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center pointer-events-none">
                      <span className="text-[10px] md:text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg">
                        {PYTH_PRICE_FEEDS[selectedFeed].symbol}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direction Toggle - Enhanced */}
              <div className="space-y-2 md:space-y-3">
                <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white">Prediction Direction</label>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAbove(true)}
                    className={`relative overflow-hidden py-3 md:py-4 px-3 md:px-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all duration-300 transform ${
                      isAbove
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/40 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center gap-1 md:gap-2">
                      <span className="text-base md:text-lg">📈</span>
                      <span>Above ${threshold || '?'}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAbove(false)}
                    className={`relative overflow-hidden py-3 md:py-4 px-3 md:px-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all duration-300 transform ${
                      !isAbove
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/40 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center gap-1 md:gap-2">
                      <span className="text-base md:text-lg">📉</span>
                      <span>Below ${threshold || '?'}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Expiry Time - Custom Dropdown */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 md:gap-2">
                  <div className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-md md:rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-sm">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  Market Expires In
                </label>
                <CustomDropdown
                  groupedOptions={{
                    '⚡ Short-term': [
                      { value: 5/1440, label: '5 Minutes', icon: '⚡' },
                      { value: 10/1440, label: '10 Minutes', icon: '⚡' },
                      { value: 15/1440, label: '15 Minutes', icon: '⚡' },
                      { value: 30/1440, label: '30 Minutes', icon: '⚡' },
                      { value: 1/24, label: '1 Hour', icon: '⏱️' },
                      { value: 4/24, label: '4 Hours', icon: '⏱️' },
                      { value: 12/24, label: '12 Hours', icon: '⏱️' },
                    ],
                    '📅 Standard': [
                      { value: 1, label: '1 Day', icon: '📅' },
                      { value: 3, label: '3 Days', icon: '📅' },
                      { value: 7, label: '1 Week', icon: '📅' },
                    ],
                    '🗓️ Long-term': [
                      { value: 14, label: '2 Weeks', icon: '🗓️' },
                      { value: 30, label: '1 Month', icon: '🗓️' },
                      { value: 90, label: '3 Months', icon: '🗓️' },
                      { value: 180, label: '6 Months', icon: '🗓️' },
                    ],
                  }}
                  value={expiryDays}
                  onChange={(value) => setExpiryDays(value as number)}
                  placeholder="Select expiry time..."
                  accentColor="orange"
                />
              </div>

              {/* Market Preview - Enhanced */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-5 w-5 rounded-lg bg-purple-500/20">
                      <ZapIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Market Preview</p>
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                    {generatePythMarketQuestion({
                      priceId: PYTH_PRICE_FEEDS[selectedFeed].id,
                      feedName: PYTH_PRICE_FEEDS[selectedFeed].name,
                      marketType: 'threshold',
                      threshold: threshold ? parseFloat(threshold) : 0,
                      expiryTime: Math.floor(Date.now() / 1000) + expiryDays * 86400,
                      isAbove,
                    })}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">Auto-resolves when market expires</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Category Selector */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <Tag className="w-3 h-3 md:w-4 md:h-4" />
              {t('createMarket.category')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 md:gap-3">
              {CATEGORIES.filter(cat => cat.value !== 'crypto').map((cat) => {
                const IconComponent = iconMap[cat.icon as keyof typeof iconMap];
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-2 md:p-3 rounded-lg md:rounded-xl border-2 transition-all ${
                      category === cat.value
                        ? `border-transparent bg-gradient-to-r ${cat.color} text-white shadow-lg`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-0.5 md:mb-1">
                      {IconComponent && <IconComponent className="w-5 h-5 md:w-7 md:h-7" />}
                    </div>
                    <div className="text-[10px] md:text-xs font-semibold">{cat.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              {t('createMarket.marketQuestion')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('createMarket.questionPlaceholder')}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              {t('createMarket.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createMarket.descriptionPlaceholder')}
              rows={4}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          {/* Resolution Type Selector */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
              Resolution Type
            </label>
            <div className="flex gap-2 md:gap-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setResolutionType('yesno')}
                className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 rounded-md md:rounded-lg font-semibold text-xs md:text-sm transition-all duration-300 ${
                  resolutionType === 'yesno'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20 scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Yes / No
              </button>
              <button
                type="button"
                onClick={() => setResolutionType('custom')}
                className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 rounded-md md:rounded-lg font-semibold text-xs md:text-sm transition-all duration-300 ${
                  resolutionType === 'custom'
                    ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/20 scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Custom Options
              </button>
            </div>
          </div>

          {/* Custom Outcomes */}
          {resolutionType === 'custom' && (
            <div className="space-y-2 md:space-y-3 p-3 md:p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg md:rounded-xl border border-purple-200 dark:border-purple-700">
              <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                Outcome Options (e.g., "Who will be president of Kenya?")
              </label>
              {customOutcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => {
                      const newOutcomes = [...customOutcomes];
                      newOutcomes[index] = e.target.value;
                      setCustomOutcomes(newOutcomes);
                    }}
                    placeholder={`Option ${index + 1} (e.g., ${index === 0 ? 'Raila Odinga' : 'William Ruto'})`}
                    className="flex-1 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-purple-300 dark:border-purple-600 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomOutcomes([...customOutcomes, ''])}
                className="w-full py-2 md:py-2.5 px-3 md:px-4 text-xs md:text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg md:rounded-xl border border-purple-300 dark:border-purple-600 transition-all"
              >
                + Add Option
              </button>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
              Market Image (Optional)
            </label>
            <div className="relative">
              {imagePreview && (
                <div className="mb-3 relative rounded-lg md:rounded-xl overflow-hidden border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                  <img 
                    src={imagePreview} 
                    alt="Market preview" 
                    className="w-full h-32 md:h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMarketImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className="flex items-center justify-center w-full px-4 py-3 md:py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group">
                <div className="text-center">
                  <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 mx-auto mb-1 md:mb-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-all">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Click to upload image
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              {t('createMarket.closingDate')}
            </label>
            <input
              type="datetime-local"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                <Image 
                  src="/USDC logo.png" 
                  alt="USDC"
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              </div>
              {t('createMarket.paymentToken')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-between hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-sm"
              >
                <div className="flex items-center gap-2">
                  {selectedStablecoin?.icon.startsWith('/') ? (
                    <Image 
                      src={selectedStablecoin.icon} 
                      alt={selectedStablecoin.symbol}
                      width={18}
                      height={18}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-base">{selectedStablecoin?.icon}</span>
                  )}
                  <span className="text-sm font-medium">{selectedStablecoin?.symbol} - {selectedStablecoin?.name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isTokenDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isTokenDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {STABLECOINS.baseSepolia.map((token) => (
                    <button
                      key={token.address}
                      type="button"
                      onClick={() => {
                        setSelectedToken(token.address);
                        setIsTokenDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm ${
                        selectedToken === token.address ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {token.icon.startsWith('/') ? (
                        <Image 
                          src={token.icon} 
                          alt={token.symbol}
                          width={18}
                          height={18}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-base">{token.icon}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">- {token.name}</span>
                      </div>
                      {selectedToken === token.address && (
                        <span className="ml-auto text-blue-600 dark:text-blue-400 text-sm">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Users will trade using {selectedStablecoin?.symbol} for this market
            </p>
          </div>

            </>
          )}

          {/* Terms and Conditions */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
            />
            <label htmlFor="terms-checkbox" className="text-xs md:text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline decoration-dotted hover:underline-solid transition-all"
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-2 md:py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-sm md:text-base font-bold transition-all"
            >
              Cancel
            </button>
            {!isConnected ? (
              <div className="flex-1">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      className="w-full px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isCreating || !agreedToTerms}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isCreating ? 'Creating...' : 'Create Market'}
              </button>
            )}
          </div>

          {step === 'create' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                Creating market on blockchain...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
