'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Calendar, DollarSign, Tag, FileText, TrendingUp, ChevronDown, Wallet, Bitcoin, Trophy, Building2, Clapperboard, Cpu, BarChart3, Zap as ZapIcon } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { STABLECOINS } from '@/lib/contracts';
import { useCTFCreateMarket } from '@/hooks/useCTFMarket';
import { useApproveToken } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';
import { parseUnits } from 'viem';
import { useTranslation } from '@/hooks/useTranslation';
import Image from 'next/image';
import { CATEGORIES as CATEGORY_CONFIG } from '@/lib/categoryUtils';
import { PYTH_PRICE_FEEDS, fetchPythPrice, generatePythMarketQuestion, type PythFeedId } from '@/lib/pyth';
import { useConfigurePythMarket } from '@/hooks/usePythResolver';

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
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>(STABLECOINS.baseSepolia[0].address);
  const [category, setCategory] = useState('crypto');
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  
  // Pyth market mode
  const [isPythMode, setIsPythMode] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<PythFeedId>('ETH/USD');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [threshold, setThreshold] = useState('');
  const [isAbove, setIsAbove] = useState(true);
  const [expiryDays, setExpiryDays] = useState(1);

  const { createMarket, isPending: isCreating, isSuccess, hash: createHash } = useCTFCreateMarket();
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();
  const { configurePythMarket, isPending: isConfiguringPyth, isSuccess: isPythConfigured } = useConfigurePythMarket();

  const selectedStablecoin = STABLECOINS.baseSepolia.find(t => t.address === selectedToken);
  
  // Store Pyth market data for configuration after creation
  const [pythMarketData, setPythMarketData] = useState<{
    priceId: string;
    threshold: number;
    expiryTime: number;
    isAbove: boolean;
  } | null>(null);

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

  // Automatically create market after approval succeeds
  useEffect(() => {
    if (isApproved && step === 'approve') {
      setStep('create');
      handleCreateMarket();
    }
  }, [isApproved]);

  // Automatically configure Pyth market after creation succeeds
  useEffect(() => {
    const configurePyth = async () => {
      if (isSuccess && pythMarketData && isPythMode) {
        // Wait a bit for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the market ID from the contract
        try {
          const response = await fetch(`https://sepolia.base.org`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [{
                to: CONTRACTS.baseSepolia.ctfPredictionMarket,
                data: '0x650acd66' // marketCount() selector
              }, 'latest'],
              id: 1
            })
          });
          const data = await response.json();
          const marketId = parseInt(data.result, 16);
          
          // Configure Pyth resolution
          await configurePythMarket(
            marketId,
            pythMarketData.priceId,
            pythMarketData.threshold,
            pythMarketData.expiryTime,
            pythMarketData.isAbove
          );
          
          setPythMarketData(null);
        } catch (error) {
          console.error('Error configuring Pyth market:', error);
        }
      }
    };
    
    configurePyth();
  }, [isSuccess, pythMarketData, isPythMode]);

  const handleApprove = async () => {
    if (!selectedStablecoin || !initialLiquidity) return;
    
    try {
      const amount = parseUnits(initialLiquidity, selectedStablecoin.decimals);
      await approve(
        selectedToken as `0x${string}`,
        CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
        amount
      );
    } catch (error) {
      console.error('Error approving token:', error);
      setStep('form');
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
        setPythMarketData({
          priceId: feed.id,
          threshold: parseFloat(threshold),
          expiryTime,
          isAbove,
        });
      } else {
        closingTimestamp = BigInt(Math.floor(new Date(closingDate).getTime() / 1000));
        marketDescription = `[CATEGORY:${category}] ${description}`;
      }

      const liquidityAmount = parseUnits(initialLiquidity || '0', selectedStablecoin.decimals);

      await createMarket(
        marketTitle,
        marketDescription,
        BigInt(2), // Binary market (2 outcomes)
        closingTimestamp,
        selectedToken as `0x${string}`
      );
    } catch (error) {
      console.error('Error creating market:', error);
      setStep('form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseFloat(initialLiquidity || '0') > 0) {
      setStep('approve');
      await handleApprove();
    } else {
      setStep('create');
      await handleCreateMarket();
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl max-w-md w-full p-4 md:p-6">
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl">✅</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              Market Created!
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
              Your prediction market has been successfully created on Base Sepolia.
            </p>
            {isPythMode && isConfiguringPyth && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 flex items-center justify-center gap-2">
                  <ZapIcon className="w-4 h-4 animate-pulse" />
                  Configuring auto-resolution...
                </p>
              </div>
            )}
            {isPythMode && isPythConfigured && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                <p className="text-xs md:text-sm text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                  <ZapIcon className="w-4 h-4" />
                  ✅ Auto-resolution configured!
                </p>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <button
                onClick={() => {
                  onClose();
                  setStep('form');
                  setTitle('');
                  setDescription('');
                  setClosingDate('');
                  setInitialLiquidity('');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm md:text-base font-medium"
              >
                Create Another Market
              </button>
              <button
                onClick={() => {
                  onClose();
                  setStep('form');
                  setTitle('');
                  setDescription('');
                  setClosingDate('');
                  setInitialLiquidity('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm md:text-base font-medium"
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
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 md:p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative group">
              {/* Subtle background glow */}
              <div className="absolute -inset-2 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl blur-xl"></div>
              
              {/* Main icon container with geometric design */}
              <div className="relative w-14 h-14 md:w-16 md:h-16">
                {/* Background layers for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl rotate-6 opacity-80"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl -rotate-6 opacity-60"></div>
                
                {/* Main surface */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 rounded-2xl shadow-2xl border border-white/30">
                  {/* Top highlight */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl"></div>
                  
                  {/* Custom chart/trend icon */}
                  <svg className="absolute inset-0 w-full h-full p-3 md:p-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <h2 className="text-lg md:text-3xl font-black text-white drop-shadow-lg tracking-tight">{t('createMarket.title')}</h2>
              <p className="text-xs md:text-sm text-white/80 font-medium mt-0.5">Launch your prediction market</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-2.5 hover:bg-white/20 rounded-xl transition-all hover:scale-110 active:scale-95 group"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-3 md:space-y-6">
          {/* Market Type Toggle */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setIsPythMode(false)}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                !isPythMode
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Traditional Market
            </button>
            <button
              type="button"
              onClick={() => setIsPythMode(true)}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-1 ${
                isPythMode
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <ZapIcon className="w-4 h-4" />
              Pyth Market
            </button>
          </div>

          {isPythMode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <ZapIcon className="w-4 h-4" />
                <strong>Auto-resolves:</strong> This market will automatically resolve based on Pyth price feeds when it expires.
              </p>
            </div>
          )}

          {isPythMode ? (
            <>
              {/* Pyth Price Feed Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Price Feed
                </label>
                <select
                  value={selectedFeed}
                  onChange={(e) => setSelectedFeed(e.target.value as PythFeedId)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(PYTH_PRICE_FEEDS).map(([key, feed]) => (
                    <option key={key} value={key}>
                      {feed.name} ({feed.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Price Display */}
              {currentPrice && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current {PYTH_PRICE_FEEDS[selectedFeed].symbol} Price</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {/* Threshold Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Threshold Price (${PYTH_PRICE_FEEDS[selectedFeed].symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={currentPrice ? currentPrice.toString() : 'Enter price'}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Direction Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Prediction Direction</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAbove(true)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                      isAbove
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    ↑ Above ${threshold || '?'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAbove(false)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                      !isAbove
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    ↓ Below ${threshold || '?'}
                  </button>
                </div>
              </div>

              {/* Expiry Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Market Expires In
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <optgroup label="Short-term">
                    <option value={5/1440}>5 Minutes</option>
                    <option value={10/1440}>10 Minutes</option>
                    <option value={30/1440}>30 Minutes</option>
                    <option value={1/24}>1 Hour</option>
                    <option value={4/24}>4 Hours</option>
                    <option value={12/24}>12 Hours</option>
                  </optgroup>
                  <optgroup label="Standard">
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>1 Week</option>
                  </optgroup>
                  <optgroup label="Long-term">
                    <option value={14}>2 Weeks</option>
                    <option value={30}>1 Month</option>
                    <option value={90}>3 Months</option>
                    <option value={180}>6 Months</option>
                  </optgroup>
                </select>
              </div>

              {/* Market Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Market Question Preview</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {generatePythMarketQuestion({
                    priceId: PYTH_PRICE_FEEDS[selectedFeed].id,
                    feedName: PYTH_PRICE_FEEDS[selectedFeed].name,
                    marketType: 'threshold',
                    threshold: threshold ? parseFloat(threshold) : 0,
                    expiryTime: Math.floor(Date.now() / 1000) + expiryDays * 86400,
                    isAbove,
                  })}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <ZapIcon className="w-4 h-4" />
                  ✅ Auto-resolves when market expires
                </p>
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
              {CATEGORIES.map((cat) => {
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

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
              Initial Liquidity (Optional)
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(e.target.value)}
              placeholder="0"
              step="0.000001"
              min="0"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Add initial liquidity to help bootstrap your market
            </p>
          </div>
            </>
          )}

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
                disabled={isApproving || isCreating}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isApproving ? 'Approving...' : isCreating ? 'Creating...' : 'Create Market'}
              </button>
            )}
          </div>

          {step === 'approve' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                Step 1/2: Approving {selectedStablecoin?.symbol} spending...
              </p>
            </div>
          )}

          {step === 'create' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                Step 2/2: Creating market on blockchain...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
