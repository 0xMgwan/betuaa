import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { useState, useEffect, useCallback } from 'react';
import { CONTRACTS } from '@/lib/contracts';
import OrderBookABI from '@/lib/abis/OrderBook.json';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarket.json';

const ORDER_BOOK_ADDRESS = CONTRACTS.baseSepolia.orderBook as `0x${string}`;
const CTF_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

// Price is in basis points: 1 = 0.01%, 5000 = 50%, 10000 = 100%
export const PRICE_PRECISION = 10000;

export enum OrderSide {
  BUY = 0,
  SELL = 1,
}

export interface OrderBookLevel {
  price: number;      // basis points (1-9999)
  priceUsd: number;   // human-readable (0.0001 - 0.9999)
  size: bigint;       // in collateral decimals
  sizeFormatted: string;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  midPrice: number;
  lastTradePrice: number;
  totalVolume: bigint;
}

export interface UserOrder {
  id: bigint;
  maker: string;
  marketId: bigint;
  outcomeIndex: bigint;
  side: OrderSide;
  price: bigint;
  size: bigint;
  filled: bigint;
  timestamp: bigint;
  active: boolean;
}

/**
 * Hook to read the order book for a specific market outcome
 */
export function useOrderBookData(marketId: number, outcomeIndex: number, maxLevels: number = 20) {
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);

  // Fetch order book levels
  const { data: bookData, refetch: refetchBook } = useReadContract({
    address: ORDER_BOOK_ADDRESS,
    abi: OrderBookABI,
    functionName: 'getOrderBook',
    args: [BigInt(marketId), BigInt(outcomeIndex), BigInt(maxLevels)],
    chainId: baseSepolia.id,
    query: {
      enabled: !!ORDER_BOOK_ADDRESS && ORDER_BOOK_ADDRESS !== '0x',
      refetchInterval: 3000,
    },
  });

  // Fetch market book summary
  const { data: summaryData, refetch: refetchSummary } = useReadContract({
    address: ORDER_BOOK_ADDRESS,
    abi: OrderBookABI,
    functionName: 'getMarketBookSummary',
    args: [BigInt(marketId), BigInt(outcomeIndex)],
    chainId: baseSepolia.id,
    query: {
      enabled: !!ORDER_BOOK_ADDRESS && ORDER_BOOK_ADDRESS !== '0x',
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    if (!bookData || !summaryData) return;

    const [bidPrices, bidSizes, askPrices, askSizes] = bookData as [bigint[], bigint[], bigint[], bigint[]];
    const [bestBid, bestAsk, spread, totalVolume, lastTradePrice] = summaryData as [bigint, bigint, bigint, bigint, bigint];

    const bids: OrderBookLevel[] = bidPrices.map((price, i) => ({
      price: Number(price),
      priceUsd: Number(price) / PRICE_PRECISION,
      size: bidSizes[i],
      sizeFormatted: formatSize(bidSizes[i]),
    }));

    const asks: OrderBookLevel[] = askPrices.map((price, i) => ({
      price: Number(price),
      priceUsd: Number(price) / PRICE_PRECISION,
      size: askSizes[i],
      sizeFormatted: formatSize(askSizes[i]),
    }));

    const bestBidNum = Number(bestBid);
    const bestAskNum = Number(bestAsk);
    const midPrice = bestBidNum > 0 && bestAskNum > 0 ? (bestBidNum + bestAskNum) / 2 : 0;
    const spreadPercent = midPrice > 0 ? (Number(spread) / midPrice) * 100 : 0;

    setOrderBookData({
      bids,
      asks,
      bestBid: bestBidNum,
      bestAsk: bestAskNum,
      spread: Number(spread),
      spreadPercent,
      midPrice,
      lastTradePrice: Number(lastTradePrice),
      totalVolume,
    });
  }, [bookData, summaryData]);

  const refetch = useCallback(() => {
    refetchBook();
    refetchSummary();
  }, [refetchBook, refetchSummary]);

  return { orderBookData, refetch };
}

/**
 * Hook to place limit orders
 */
export function usePlaceLimitOrder() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeLimitOrder = useCallback((
    marketId: number,
    outcomeIndex: number,
    side: OrderSide,
    priceBps: number,
    size: bigint,
  ) => {
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: OrderBookABI,
      functionName: 'placeLimitOrder',
      args: [BigInt(marketId), BigInt(outcomeIndex), side, BigInt(priceBps), size],
      chainId: baseSepolia.id,
      gas: BigInt(500_000),
    });
  }, [writeContract]);

  return { placeLimitOrder, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to place market orders
 */
export function usePlaceMarketOrder() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeMarketOrder = useCallback((
    marketId: number,
    outcomeIndex: number,
    side: OrderSide,
    size: bigint,
    maxSlippageBps: number = 200, // 2% default slippage
  ) => {
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: OrderBookABI,
      functionName: 'placeMarketOrder',
      args: [BigInt(marketId), BigInt(outcomeIndex), side, size, BigInt(maxSlippageBps)],
      chainId: baseSepolia.id,
      gas: BigInt(500_000),
    });
  }, [writeContract]);

  return { placeMarketOrder, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelOrder = useCallback((orderId: bigint) => {
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: OrderBookABI,
      functionName: 'cancelOrder',
      args: [orderId],
      chainId: baseSepolia.id,
    });
  }, [writeContract]);

  return { cancelOrder, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to get user's active orders
 */
export function useUserOrders() {
  const { address } = useAccount();

  const { data, refetch } = useReadContract({
    address: ORDER_BOOK_ADDRESS,
    abi: OrderBookABI,
    functionName: 'getUserActiveOrders',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address && !!ORDER_BOOK_ADDRESS && ORDER_BOOK_ADDRESS !== '0x',
      refetchInterval: 5000,
    },
  });

  const orders: UserOrder[] = data
    ? (data as any[]).map((o) => ({
        id: o.id,
        maker: o.maker,
        marketId: o.marketId,
        outcomeIndex: o.outcomeIndex,
        side: Number(o.side) as OrderSide,
        price: o.price,
        size: o.size,
        filled: o.filled,
        timestamp: o.timestamp,
        active: o.active,
      }))
    : [];

  return { orders, refetch };
}

/**
 * Hook to approve collateral token for OrderBook spending
 */
export function useApproveCollateral() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = useCallback((tokenAddress: string, amount: bigint) => {
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          type: 'function',
          name: 'approve',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
        },
      ],
      functionName: 'approve',
      args: [ORDER_BOOK_ADDRESS, amount],
      chainId: baseSepolia.id,
    });
  }, [writeContract]);

  return { approve, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to check if ERC1155 outcome tokens are approved for OrderBook
 */
export function useIsApprovedForAll() {
  const { address } = useAccount();

  const { data: isApproved, refetch } = useReadContract({
    address: CTF_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'isApprovedForAll',
    args: address ? [address, ORDER_BOOK_ADDRESS] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address && !!CTF_ADDRESS && CTF_ADDRESS !== '0x',
      refetchInterval: 5000,
    },
  });

  return { isApproved: !!isApproved, refetch };
}

/**
 * Hook to approve ERC1155 outcome tokens for OrderBook
 */
export function useApproveOutcomeTokens() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveAll = useCallback(() => {
    writeContract({
      address: CTF_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'setApprovalForAll',
      args: [ORDER_BOOK_ADDRESS, true],
      chainId: baseSepolia.id,
    });
  }, [writeContract]);

  return { approveAll, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to split $1 collateral into 1 Yes + 1 No share
 */
export function useSplitShares() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const splitShares = useCallback((marketId: number, amount: bigint) => {
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: OrderBookABI,
      functionName: 'splitShares',
      args: [BigInt(marketId), amount],
      chainId: baseSepolia.id,
      gas: BigInt(500_000),
    });
  }, [writeContract]);

  return { splitShares, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to merge 1 Yes + 1 No share back into $1 collateral
 */
export function useMergeShares() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mergeShares = useCallback((marketId: number, amount: bigint) => {
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: OrderBookABI,
      functionName: 'mergeShares',
      args: [BigInt(marketId), amount],
      chainId: baseSepolia.id,
    });
  }, [writeContract]);

  return { mergeShares, hash, isPending, isConfirming, isSuccess, error };
}

// Utility: format size from raw bigint (6 decimals for USDC) to readable string
function formatSize(size: bigint, decimals: number = 6): string {
  const num = Number(size) / 10 ** decimals;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

// Utility: convert human price (0.50) to basis points (5000)
export function priceToBps(price: number): number {
  return Math.round(price * PRICE_PRECISION);
}

// Utility: convert basis points (5000) to human price (0.50)
export function bpsToPrice(bps: number): number {
  return bps / PRICE_PRECISION;
}

// Utility: convert USDC amount to raw (6 decimals)
export function usdcToRaw(amount: number, decimals: number = 6): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}
