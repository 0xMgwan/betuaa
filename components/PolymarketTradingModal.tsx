'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Users, Clock, ExternalLink, BarChart2, Activity } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { SimplifiedPolymarketMarket } from '@/lib/polymarket/types';
import { getOrderbook, placeOrder } from '@/lib/polymarket/tradingService';
import { categorizePolymarketMarket } from '@/lib/polymarket/categoryMapper';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar } from 'recharts';
import CategoryBadge from './CategoryBadge';
import Image from 'next/image';

interface PolymarketTradingModalProps {
  market: SimplifiedPolymarketMarket | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PolymarketTradingModal({
  market,
  isOpen,
  onClose,
}: PolymarketTradingModalProps) {
  // Early return before any hooks if modal is not open or market is not available
  if (!isOpen || !market) return null;

  const { address: walletAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderbook, setOrderbook] = useState<any>(null);
  const [loadingOrderbook, setLoadingOrderbook] = useState(false);
  const [showTrading, setShowTrading] = useState(false);
  const [chartView, setChartView] = useState<'price' | 'volume' | 'liquidity'>('price');

  // Generate simplified price history data - reduce data points for better performance
  const generatePriceHistory = () => {
    const history = [];
    const now = new Date();
    const yesPrice = market.yesPrice * 100;
    const noPrice = market.noPrice * 100;
    
    // Only generate 12 data points instead of 25 for better performance
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      history.push({
        time: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        Yes: yesPrice,
        No: noPrice,
      });
    }
    return history;
  };

  const priceHistory = generatePriceHistory();
  
  // Generate volume history data
  const generateVolumeHistory = () => {
    const history = [];
    const now = new Date();
    const totalVolume = parseFloat(market.volume || '0');
    
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      const volumePoint = totalVolume * (0.7 + Math.random() * 0.3) / 13;
      history.push({
        time: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        volume: volumePoint,
      });
    }
    return history;
  };

  const volumeHistory = useMemo(() => generateVolumeHistory(), [market.volume]);
  
  // Calculate 24h change - for now showing 0% since we don't have historical data
  const change24h = 0;
  const categoryKey = categorizePolymarketMarket(market) as 'crypto' | 'sports' | 'politics' | 'entertainment' | 'technology' | 'other';
  const endDate = new Date(market.endDate);

  // Load orderbook when market changes
  useEffect(() => {
    if (!isOpen) return;

    const loadOrderbook = async () => {
      setLoadingOrderbook(true);
      try {
        const tokenId = outcome === 'YES' ? market.id : market.id;
        const book = await getOrderbook(tokenId);
        setOrderbook(book);
        
        if (book) {
          if (side === 'BUY' && book.asks && book.asks.length > 0) {
            setPrice((parseFloat(book.asks[0].price) * 100).toFixed(1));
          } else if (side === 'SELL' && book.bids && book.bids.length > 0) {
            setPrice((parseFloat(book.bids[0].price) * 100).toFixed(1));
          }
        }
      } catch (err) {
        console.error('Error loading orderbook:', err);
      } finally {
        setLoadingOrderbook(false);
      }
    };

    loadOrderbook();
  }, [market, outcome, side, isOpen]);

  const handleTrade = async () => {
    if (!walletAddress || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    if (!amount || !price) {
      setError('Please enter amount and price');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Place order directly using CLOB client with wallet signer
      const result = await placeOrder(
        market.id, // TODO: Use actual token ID based on outcome
        parseFloat(price) / 100, // Convert cents to decimal
        parseFloat(amount),
        side,
        walletClient
      );
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setAmount('');
          setPrice('');
          onClose();
        }, 2000);
      } else {
        throw new Error('Order placement failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrice = side === 'BUY' ? market.noPrice : market.yesPrice;
  const volumeNum = parseFloat(market.volume || '0');
  const volumeDisplay = volumeNum > 1000000 
    ? `${(volumeNum / 1000000).toFixed(1)}M`
    : volumeNum > 1000
    ? `${(volumeNum / 1000).toFixed(1)}K`
    : volumeNum.toFixed(0);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full md:h-auto md:max-h-[90vh] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 md:p-6 z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={categoryKey} size="sm" />
              <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => window.open(`https://polymarket.com/event/${market.slug}`, '_blank')}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <h2 className="text-base md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {market.question}
          </h2>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
            {market.description}
          </p>
        </div>

        {/* Content */}
        <div className="p-2 md:p-6 space-y-2 md:space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Volume</div>
              <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <Image 
                  src="/USDC logo.png" 
                  alt="USDC"
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                />
                {volumeDisplay} USDC
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Traders</div>
              <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <Users className="w-4 h-4" />
                0
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">24h Change</div>
              <div className={`text-sm md:text-xl font-bold flex items-center gap-1 ${
                change24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Chart Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setChartView('price')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    chartView === 'price'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Activity className="w-3 h-3 inline mr-1" />
                  Price
                </button>
                <button
                  onClick={() => setChartView('volume')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    chartView === 'volume'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <BarChart2 className="w-3 h-3 inline mr-1" />
                  Volume
                </button>
              </div>
              {chartView === 'price' && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Yes {(market.yesPrice * 100).toFixed(1)}¢</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">No {(market.noPrice * 100).toFixed(1)}¢</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'price' ? (
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Yes" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="No" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={volumeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => {
                        const vol = typeof value === 'number' ? value : 0;
                        return [`$${(vol / 1000).toFixed(1)}K`, 'Volume'];
                      }}
                    />
                    <Bar 
                      dataKey="volume" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trading Section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Buy Yes */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-transparent hover:border-green-500 transition-all cursor-pointer"
                 onClick={() => {
                   setSide('BUY');
                   setOutcome('YES');
                   setShowTrading(true);
                 }}>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buy Yes</div>
              <div className="text-2xl font-bold text-green-600">
                {(market.yesPrice * 100).toFixed(0)}¢
              </div>
              {!showTrading && (
                <button className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                  Buy
                </button>
              )}
            </div>

            {/* Buy No */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-transparent hover:border-red-500 transition-all cursor-pointer"
                 onClick={() => {
                   setSide('BUY');
                   setOutcome('NO');
                   setShowTrading(true);
                 }}>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buy No</div>
              <div className="text-2xl font-bold text-red-600">
                {(market.noPrice * 100).toFixed(0)}¢
              </div>
              {!showTrading && (
                <button className="w-full mt-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors">
                  Buy
                </button>
              )}
            </div>
          </div>

          {/* Trading Form - Only show when user clicks Buy */}
          {showTrading && (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {side} {outcome}
                </h4>
                <button
                  onClick={() => setShowTrading(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (¢)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={`Current: ${(currentPrice * 100).toFixed(1)}¢`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (shares)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter number of shares"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Order Summary */}
              {amount && price && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${(parseFloat(amount) * parseFloat(price) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Outcome:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {outcome}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                Order placed successfully!
              </p>
            </div>
          )}

          {/* Trade Button - Only show when trading form is visible */}
          {showTrading && (
            <>
              <button
                onClick={handleTrade}
                disabled={isLoading || !isConnected || !amount || !price}
                className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isLoading || !isConnected || !amount || !price
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : side === 'BUY'
                    ? outcome === 'YES'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : !isConnected ? (
                  'Connect Wallet'
                ) : (
                  `${side} ${outcome}`
                )}
              </button>

              {/* Info Text */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Trading on Polymarket via CLOB. Prices update in real-time.
              </p>
            </>
          )}

          {/* Rules Summary */}
          {!showTrading && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rules Summary</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resolves to <span className="font-semibold">Yes</span> if event occurs before {endDate.toLocaleDateString()}, otherwise <span className="font-semibold">No</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
