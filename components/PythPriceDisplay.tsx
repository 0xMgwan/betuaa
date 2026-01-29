'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchPythPrice, PYTH_PRICE_FEEDS, type PythFeedId } from '@/lib/pyth';

interface PythPriceDisplayProps {
  priceId: string;
  feedName?: string;
  showConfidence?: boolean;
  updateInterval?: number; // milliseconds
  className?: string;
}

export default function PythPriceDisplay({
  priceId,
  feedName,
  showConfidence = false,
  updateInterval = 5000,
  className = '',
}: PythPriceDisplayProps) {
  const [price, setPrice] = useState<string>('--');
  const [previousPrice, setPreviousPrice] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [confidence, setConfidence] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get feed name from price ID if not provided
  const displayName = feedName || Object.values(PYTH_PRICE_FEEDS).find(f => f.id === priceId)?.symbol || 'Price';

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const updatePrice = async () => {
      try {
        const priceData = await fetchPythPrice(priceId);
        
        if (!isMounted) return;

        const currentPrice = Number(priceData.price) * Math.pow(10, priceData.expo);
        
        // Determine trend
        if (previousPrice > 0) {
          if (currentPrice > previousPrice) {
            setTrend('up');
          } else if (currentPrice < previousPrice) {
            setTrend('down');
          } else {
            setTrend('neutral');
          }
        }
        
        setPreviousPrice(currentPrice);
        setPrice(priceData.formattedPrice);
        
        if (showConfidence) {
          const conf = Number(priceData.conf) * Math.pow(10, priceData.expo);
          setConfidence(`±${conf.toFixed(2)}`);
        }
        
        setLastUpdate(new Date(priceData.publishTime * 1000));
        setIsLoading(false);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching Pyth price:', err);
        setError('Failed to load price');
        setIsLoading(false);
      }
    };

    // Initial fetch
    updatePrice();

    // Set up interval for updates
    intervalId = setInterval(updatePrice, updateInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [priceId, updateInterval, showConfidence, previousPrice]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {getTrendIcon()}
        <span className={`font-mono font-semibold ${getTrendColor()}`}>
          ${price}
        </span>
      </div>
      
      {showConfidence && confidence && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {confidence}
        </span>
      )}
      
      {lastUpdate && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

/**
 * Compact version for market cards
 */
export function PythPriceCompact({ priceId, className = '' }: { priceId: string; className?: string }) {
  const [price, setPrice] = useState<string>('--');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const updatePrice = async () => {
      try {
        const priceData = await fetchPythPrice(priceId);
        if (!isMounted) return;
        setPrice(priceData.formattedPrice);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, 10000); // Update every 10s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [priceId]);

  if (isLoading) {
    return <span className={`text-sm text-gray-400 ${className}`}>Loading...</span>;
  }

  return (
    <span className={`text-sm font-mono ${className}`}>
      ${price}
    </span>
  );
}
