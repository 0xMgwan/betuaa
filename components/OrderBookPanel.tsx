'use client';

import { useOrderBookData, OrderBookLevel, bpsToPrice, PRICE_PRECISION } from '@/hooks/useOrderBook';
import { useMemo } from 'react';

interface OrderBookPanelProps {
  marketId: number;
  outcomeIndex: number;
  maxLevels?: number;
  compact?: boolean;
}

export default function OrderBookPanel({ 
  marketId, 
  outcomeIndex, 
  maxLevels = 10,
  compact = false 
}: OrderBookPanelProps) {
  const { orderBookData } = useOrderBookData(marketId, outcomeIndex, maxLevels);

  const maxBidSize = useMemo(() => {
    if (!orderBookData?.bids.length) return BigInt(1);
    return orderBookData.bids.reduce((max, b) => b.size > max ? b.size : max, BigInt(0));
  }, [orderBookData?.bids]);

  const maxAskSize = useMemo(() => {
    if (!orderBookData?.asks.length) return BigInt(1);
    return orderBookData.asks.reduce((max, a) => a.size > max ? a.size : max, BigInt(0));
  }, [orderBookData?.asks]);

  if (!orderBookData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Order Book</h3>
        <div className="text-center py-6 text-gray-400 text-sm">
          {!orderBookData ? 'Loading order book...' : 'No orders yet'}
        </div>
      </div>
    );
  }

  const { bids, asks, bestBid, bestAsk, spread, midPrice, lastTradePrice, totalVolume } = orderBookData;

  // Reverse asks so lowest ask is at bottom (closest to spread)
  const reversedAsks = [...asks].reverse();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Order Book
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Spread: {spread > 0 ? `${bpsToPrice(spread).toFixed(2)}¢` : '—'}</span>
            <span>({orderBookData.spreadPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/50">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sell orders) - reversed so lowest is at bottom */}
      <div className={`${compact ? 'max-h-[120px]' : 'max-h-[200px]'} overflow-y-auto`}>
        {reversedAsks.length > 0 ? (
          reversedAsks.map((level, i) => (
            <OrderRow 
              key={`ask-${level.price}`} 
              level={level} 
              side="ask" 
              maxSize={maxAskSize}
              cumulative={calcCumulative(asks, asks.length - 1 - i)}
            />
          ))
        ) : (
          <div className="text-center py-3 text-gray-400 text-xs">No asks</div>
        )}
      </div>

      {/* Spread / Mid Price */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {midPrice > 0 ? `$${bpsToPrice(midPrice).toFixed(4)}` : '—'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last: {lastTradePrice > 0 ? `$${bpsToPrice(lastTradePrice).toFixed(4)}` : '—'}
          </span>
        </div>
      </div>

      {/* Bids (buy orders) */}
      <div className={`${compact ? 'max-h-[120px]' : 'max-h-[200px]'} overflow-y-auto`}>
        {bids.length > 0 ? (
          bids.map((level, i) => (
            <OrderRow 
              key={`bid-${level.price}`} 
              level={level} 
              side="bid" 
              maxSize={maxBidSize}
              cumulative={calcCumulative(bids, i)}
            />
          ))
        ) : (
          <div className="text-center py-3 text-gray-400 text-xs">No bids</div>
        )}
      </div>

      {/* Footer Stats */}
      {!compact && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Vol: {formatVolume(totalVolume)}</span>
          <span>
            {outcomeIndex === 0 ? 'YES' : 'NO'} Token
          </span>
        </div>
      )}
    </div>
  );
}

function OrderRow({ 
  level, 
  side, 
  maxSize,
  cumulative 
}: { 
  level: OrderBookLevel; 
  side: 'bid' | 'ask'; 
  maxSize: bigint;
  cumulative: string;
}) {
  const depthPercent = maxSize > BigInt(0) ? Number((level.size * BigInt(100)) / maxSize) : 0;
  const isBid = side === 'bid';

  return (
    <div className="relative group">
      {/* Depth bar background */}
      <div
        className={`absolute inset-y-0 ${isBid ? 'right-0' : 'right-0'} ${
          isBid ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}
        style={{ width: `${depthPercent}%` }}
      />
      
      <div className="relative grid grid-cols-3 px-4 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors">
        <span className={`font-mono ${isBid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {level.priceUsd.toFixed(4)}
        </span>
        <span className="text-right text-gray-700 dark:text-gray-300 font-mono">
          {level.sizeFormatted}
        </span>
        <span className="text-right text-gray-500 dark:text-gray-400 font-mono">
          {cumulative}
        </span>
      </div>
    </div>
  );
}

function calcCumulative(levels: OrderBookLevel[], upToIndex: number): string {
  let total = BigInt(0);
  for (let i = 0; i <= upToIndex; i++) {
    total += levels[i].size;
  }
  return formatSizeShort(total);
}

function formatSizeShort(size: bigint, decimals: number = 6): string {
  const num = Number(size) / 10 ** decimals;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

function formatVolume(vol: bigint, decimals: number = 6): string {
  const num = Number(vol) / 10 ** decimals;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}
