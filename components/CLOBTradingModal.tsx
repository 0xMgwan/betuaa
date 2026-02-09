'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, TrendingUp, Zap, BookOpen, ArrowDownUp } from 'lucide-react';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useApproveToken, useTokenBalance, useTokenAllowance } from '@/hooks/useERC20';
import { CONTRACTS } from '@/lib/contracts';
import { motion, AnimatePresence } from 'framer-motion';
import OrderBookPanel from '@/components/OrderBookPanel';
import {
  usePlaceLimitOrder,
  usePlaceMarketOrder,
  useApproveCollateral,
  useApproveOutcomeTokens,
  useIsApprovedForAll,
  useOrderBookData,
  useUserOrders,
  useCancelOrder,
  OrderSide,
  priceToBps,
  bpsToPrice,
  usdcToRaw,
  PRICE_PRECISION,
} from '@/hooks/useOrderBook';

interface CLOBTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId: number;
  marketQuestion: string;
  outcomeIndex: number;
  outcomeName: string;
  paymentToken: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

type OrderType = 'limit' | 'market';
type TradeSide = 'buy' | 'sell';

export default function CLOBTradingModal({
  isOpen,
  onClose,
  marketId,
  marketQuestion,
  outcomeIndex,
  outcomeName,
  paymentToken,
  tokenSymbol,
  tokenDecimals,
}: CLOBTradingModalProps) {
  const { address } = useAccount();
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [tradeSide, setTradeSide] = useState<TradeSide>('buy');
  const [price, setPrice] = useState('0.50');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('2');
  const [showOrderBook, setShowOrderBook] = useState(true);

  // Hooks
  const { orderBookData } = useOrderBookData(marketId, outcomeIndex);
  const { placeLimitOrder, isPending: isLimitPending, isSuccess: limitSuccess, error: limitError, reset: resetLimit } = usePlaceLimitOrder();
  const { placeMarketOrder, isPending: isMarketPending, isSuccess: marketSuccess, error: marketError, reset: resetMarket } = usePlaceMarketOrder();
  const { approve: approveCollateral, isPending: isApprovingCollateral, isSuccess: approveCollateralSuccess, reset: resetApproveCollateral } = useApproveCollateral();
  const { approveAll: approveTokens, isPending: isApprovingTokens, isSuccess: approveTokensSuccess, reset: resetApproveTokens } = useApproveOutcomeTokens();
  const { orders: userOrders, refetch: refetchOrders } = useUserOrders();
  const { cancelOrder, isPending: isCancelling } = useCancelOrder();

  // Balance
  const { data: balance } = useTokenBalance(
    paymentToken as `0x${string}`,
    address as `0x${string}`
  );

  // Allowance for OrderBook
  const orderBookAddress = CONTRACTS.baseSepolia.orderBook as `0x${string}`;
  const { data: allowance } = useTokenAllowance(
    paymentToken as `0x${string}`,
    address as `0x${string}`,
    orderBookAddress
  );

  const balanceFormatted = balance ? formatUnits(balance as bigint, tokenDecimals) : '0';
  const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  const minUsefulAllowance = parseUnits('1000', tokenDecimals);
  const { isApproved: isERC1155Approved } = useIsApprovedForAll();
  const needsBuyApproval = tradeSide === 'buy' && (!allowance || (allowance as bigint) < minUsefulAllowance);
  const needsSellApproval = tradeSide === 'sell' && !isERC1155Approved;
  const needsApproval = needsBuyApproval || needsSellApproval;
  const [pendingTrade, setPendingTrade] = useState(false);

  // Order book empty detection
  const isOrderBookEmpty = !orderBookData || (orderBookData.bestAsk === 0 && orderBookData.bestBid === 0);
  const noAsksForBuy = tradeSide === 'buy' && (!orderBookData || orderBookData.bestAsk === 0);
  const noBidsForSell = tradeSide === 'sell' && (!orderBookData || orderBookData.bestBid === 0);
  const marketOrderDisabled = orderType === 'market' && (noAsksForBuy || noBidsForSell);

  // Computed values
  const priceBps = priceToBps(parseFloat(price) || 0);
  const sizeRaw = amount ? usdcToRaw(parseFloat(amount), tokenDecimals) : BigInt(0);
  const estimatedCost = orderType === 'limit'
    ? (parseFloat(price) || 0) * (parseFloat(amount) || 0)
    : (orderBookData?.bestAsk ? bpsToPrice(orderBookData.bestAsk) : 0.5) * (parseFloat(amount) || 0);

  // Reset stale hook state when modal opens, outcome changes, or trade side/type changes
  useEffect(() => {
    resetLimit();
    resetMarket();
    resetApproveCollateral();
    resetApproveTokens();
    setPendingTrade(false);
  }, [isOpen, outcomeIndex, tradeSide, orderType]);

  // Auto-set price from order book
  useEffect(() => {
    if (orderBookData) {
      if (tradeSide === 'buy' && orderBookData.bestAsk > 0) {
        setPrice(bpsToPrice(orderBookData.bestAsk).toFixed(4));
      } else if (tradeSide === 'sell' && orderBookData.bestBid > 0) {
        setPrice(bpsToPrice(orderBookData.bestBid).toFixed(4));
      }
    }
  }, [tradeSide, orderBookData?.bestAsk, orderBookData?.bestBid]);

  // After approval succeeds, automatically submit the trade
  useEffect(() => {
    if ((approveCollateralSuccess || approveTokensSuccess) && pendingTrade && amount && sizeRaw > BigInt(0)) {
      setPendingTrade(false);
      const side = tradeSide === 'buy' ? OrderSide.BUY : OrderSide.SELL;
      if (orderType === 'limit') {
        placeLimitOrder(marketId, outcomeIndex, side, priceBps, sizeRaw);
      } else {
        placeMarketOrder(marketId, outcomeIndex, side, sizeRaw, parseInt(slippage) * 100);
      }
    }
  }, [approveCollateralSuccess, approveTokensSuccess]);

  // Reset on success
  useEffect(() => {
    if (limitSuccess || marketSuccess) {
      refetchOrders();
      const timer = setTimeout(() => {
        setAmount('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [limitSuccess, marketSuccess]);

  // Auto-switch to limit order when market order is not possible
  useEffect(() => {
    if (orderType === 'market' && (noAsksForBuy || noBidsForSell)) {
      setOrderType('limit');
    }
  }, [noAsksForBuy, noBidsForSell, orderType]);

  const handleApproveAndTrade = () => {
    setPendingTrade(true);
    if (tradeSide === 'buy') {
      approveCollateral(paymentToken, MAX_UINT256);
    } else {
      approveTokens();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || sizeRaw === BigInt(0)) return;

    const side = tradeSide === 'buy' ? OrderSide.BUY : OrderSide.SELL;

    if (orderType === 'limit') {
      placeLimitOrder(marketId, outcomeIndex, side, priceBps, sizeRaw);
    } else {
      placeMarketOrder(marketId, outcomeIndex, side, sizeRaw, parseInt(slippage) * 100);
    }
  };

  const isPending = isLimitPending || isMarketPending || isApprovingCollateral || isApprovingTokens;
  const isSuccess = limitSuccess || marketSuccess;
  const error = limitError || marketError;

  // Filter user orders for this market
  const myOrders = userOrders.filter(
    o => Number(o.marketId) === marketId && Number(o.outcomeIndex) === outcomeIndex
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  Trade {outcomeName} Shares
                </p>
                <h2 className="text-lg font-bold text-white mt-0.5 line-clamp-1">
                  {marketQuestion}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Order Book (left side on desktop) */}
            {showOrderBook && (
              <div className="md:w-[280px] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-3">
                <OrderBookPanel
                  marketId={marketId}
                  outcomeIndex={outcomeIndex}
                  maxLevels={8}
                  compact={true}
                />
              </div>
            )}

            {/* Trading Form (right side) */}
            <div className="flex-1 p-5">
              {/* Success State */}
              {isSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                    Order {orderType === 'market' ? 'Executed' : 'Placed'}!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {orderType === 'limit'
                      ? 'Your limit order is now on the order book'
                      : 'Your market order has been filled'}
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Buy/Sell Toggle */}
                  <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setTradeSide('buy')}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                        tradeSide === 'buy'
                          ? 'bg-green-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Buy {outcomeName}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeSide('sell')}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                        tradeSide === 'sell'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Sell {outcomeName}
                    </button>
                  </div>

                  {/* Order Type Toggle */}
                  <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setOrderType('limit')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        orderType === 'limit'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Limit Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (noAsksForBuy || noBidsForSell) return;
                        setOrderType('market');
                      }}
                      disabled={noAsksForBuy || noBidsForSell}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        orderType === 'market'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : noAsksForBuy || noBidsForSell
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                      title={noAsksForBuy || noBidsForSell ? 'No liquidity available for market orders' : ''}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Market Order
                    </button>
                  </div>

                  {/* Empty order book warning */}
                  {isOrderBookEmpty && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        <p className="font-semibold">No resting orders yet — be a first mover!</p>
                        <p>To bootstrap this market:</p>
                        <p>1. <strong>Mint tokens</strong> using the Mint Yes/No buttons below the order book</p>
                        <p>2. <strong>Place sell limit orders</strong> here to create asks (switch to Sell tab)</p>
                        <p>3. <strong>Place buy limit orders</strong> to create bids</p>
                        <p>Once both sides exist, market orders and matching will work.</p>
                      </div>
                    </div>
                  )}

                  {/* No asks warning for market orders */}
                  {noAsksForBuy && tradeSide === 'buy' && orderType === 'market' && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>No sell orders available.</strong> Market orders need existing asks to fill against. Switched to limit order mode. Or: mint tokens and place sell orders to create liquidity.
                      </p>
                    </div>
                  )}

                  {/* One-sided book warning for limit orders */}
                  {!isOrderBookEmpty && noAsksForBuy && tradeSide === 'buy' && orderType === 'limit' && (
                    <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                      <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Your buy order will rest in the book until someone places a sell order. To create asks: mint tokens first, then sell them here.
                      </p>
                    </div>
                  )}

                  {/* Price Input (limit orders only) */}
                  {orderType === 'limit' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Price per share (USDC)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          step="any"
                          min="0.0001"
                          max="0.9999"
                          className="w-full pl-7 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        {[0.1, 0.25, 0.5, 0.75, 0.9].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPrice(p.toFixed(2))}
                            className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${
                              parseFloat(price) === p
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {p.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slippage (market orders only) */}
                  {orderType === 'market' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Max Slippage
                      </label>
                      <div className="flex gap-1.5">
                        {['1', '2', '5', '10'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSlippage(s)}
                            className={`flex-1 py-2 text-xs rounded-lg font-bold transition-colors ${
                              slippage === s
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {s}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {tradeSide === 'buy' ? 'Shares to buy' : 'Shares to sell'}
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {tradeSide === 'buy' && (
                      <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span>Balance: {parseFloat(balanceFormatted).toFixed(4)} {tokenSymbol}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const maxShares = parseFloat(balanceFormatted) / (parseFloat(price) || 0.5);
                            setAmount(maxShares.toFixed(2));
                          }}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          Max
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Type</span>
                      <span className="font-bold text-gray-900 dark:text-white capitalize">{orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Side</span>
                      <span className={`font-bold ${tradeSide === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {tradeSide.toUpperCase()} {outcomeName}
                      </span>
                    </div>
                    {orderType === 'limit' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Price</span>
                        <span className="font-bold text-gray-900 dark:text-white">${price}</span>
                      </div>
                    )}
                    {orderType === 'market' && orderBookData && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Est. Price</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${tradeSide === 'buy'
                            ? bpsToPrice(orderBookData.bestAsk).toFixed(4)
                            : bpsToPrice(orderBookData.bestBid).toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="text-gray-500 dark:text-gray-400">Est. Cost</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        ~${estimatedCost.toFixed(4)} {tokenSymbol}
                      </span>
                    </div>
                  </div>

                  {/* Sell warning - user needs tokens */}
                  {tradeSide === 'sell' && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        To sell, you must hold {outcomeName} outcome tokens. Mint tokens first (1 USDC = 1 Yes + 1 No token), then sell here.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300">
                        {(error as any)?.shortMessage || (error as any)?.message || 'Transaction failed. If selling, make sure you have enough outcome tokens.'}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    {needsApproval ? (
                      <button
                        type="button"
                        onClick={handleApproveAndTrade}
                        disabled={isPending || !amount}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isApprovingCollateral || isApprovingTokens
                          ? (pendingTrade ? 'Approving... (trade will follow)' : 'Approving...')
                          : 'Approve & Trade'}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!amount || isPending}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
                          tradeSide === 'buy'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {isPending
                          ? 'Submitting...'
                          : `${tradeSide === 'buy' ? 'Buy' : 'Sell'} ${outcomeName}`}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* My Open Orders */}
              {myOrders.length > 0 && !isSuccess && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    My Open Orders ({myOrders.length})
                  </h4>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {myOrders.map((order) => (
                      <div
                        key={order.id.toString()}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${order.side === OrderSide.BUY ? 'text-green-600' : 'text-red-600'}`}>
                            {order.side === OrderSide.BUY ? 'BUY' : 'SELL'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            ${bpsToPrice(Number(order.price)).toFixed(4)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-500">
                            {formatUnits(order.size - order.filled, tokenDecimals)} remaining
                          </span>
                        </div>
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={isCancelling}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
