/**
 * Hooks for nTZS market operations using the nTZS-optimized CTF contract
 * 
 * This contract does NOT require on-chain collateral transfers.
 * All balance tracking is done via nTZS API (deposits/withdrawals work).
 * 
 * Flow:
 * - User deposits via M-Pesa → nTZS balance increases
 * - User creates/buys → nTZS balance decreases, outcome tokens minted
 * - User sells/redeems → outcome tokens burned, nTZS balance increases
 * - User withdraws → nTZS balance decreases, M-Pesa receives TZS
 */

import { useCallback, useState } from 'react';

interface NtzsUserInfo {
  walletAddress: string;
  userId?: string;
  email?: string;
}

/**
 * Parse market ID - handles both "ntzs-1" format and numeric IDs
 */
function parseMarketId(marketId: number | bigint | string): number {
  if (typeof marketId === 'string') {
    // Extract numeric ID from "ntzs-1" format
    const match = marketId.match(/ntzs-(\d+)/);
    if (match) return parseInt(match[1]);
    return parseInt(marketId);
  }
  return Number(marketId);
}

function getNtzsUserInfo(): NtzsUserInfo | null {
  if (typeof window === 'undefined') return null;
  
  // Read from ntzsUser (database authentication)
  const storedUser = localStorage.getItem('ntzsUser');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (!user?.walletAddress) return null;
      return {
        walletAddress: user.walletAddress,
        userId: user.userId || user.ntzsUserId,
        email: user.email,
      };
    } catch {
      return null;
    }
  }
  
  return null;
}

interface TradeAPIParams {
  action: string;
  userAddress: string;
  [key: string]: any;
}

async function callNTZSTradeAPI(params: TradeAPIParams) {
  const response = await fetch('/api/market/ntzs-trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Trade operation failed');
  }
  
  return result;
}

/**
 * Create a prediction market (nTZS)
 * Fee is deducted from user's nTZS balance
 */
export function useNTZSCreateMarketV2() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const createMarket = useCallback(async (
    question: string,
    description: string,
    outcomeCount: bigint,
    closingTime: bigint,
    _collateralToken?: `0x${string}`, // Ignored - always nTZS
    creationFeeTzs?: number
  ) => {
    const userInfo = getNtzsUserInfo();
    if (!userInfo) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setHash(undefined);

    try {
      const result = await callNTZSTradeAPI({
        action: 'createMarket',
        userAddress: userInfo.walletAddress,
        ntzsUserId: userInfo.userId,
        ntzsEmail: userInfo.email,
        question,
        description,
        outcomeCount: Number(outcomeCount),
        closingTime: Number(closingTime),
        creationFeeTzs: creationFeeTzs || 2500, // 2500 TZS default
      });

      setHash(result.hash);
      setIsSuccess(true);
      setIsPending(false);

      return {
        hash: result.hash as `0x${string}`,
        marketId: result.marketId,
        feePaid: result.feePaid,
      };
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setHash(undefined);
    setError(null);
  }, []);

  return { 
    createMarket,
    isPending,
    isSuccess,
    hash,
    error,
    reset
  };
}

/**
 * Buy shares (mint position tokens)
 * Amount is deducted from user's nTZS balance
 */
export function useNTZSMintPositionV2() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const mintPosition = useCallback(async (
    marketId: bigint | number | string,
    amountTzs: number
  ) => {
    const userInfo = getNtzsUserInfo();
    if (!userInfo) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const result = await callNTZSTradeAPI({
        action: 'mintPositionTokens',
        userAddress: userInfo.walletAddress,
        ntzsUserId: userInfo.userId,
        ntzsEmail: userInfo.email,
        marketId: parseMarketId(marketId),
        amountTzs,
      });

      setHash(result.hash);
      setIsSuccess(true);
      setIsPending(false);
      return result;
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false); setIsSuccess(false); setHash(undefined); setError(null);
  }, []);

  return { mintPosition, isPending, isSuccess, hash, error, reset };
}

/**
 * Sell shares (redeem position tokens)
 * Amount is credited to user's nTZS balance
 */
export function useNTZSRedeemPositionV2() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const redeemPosition = useCallback(async (
    marketId: bigint | number | string,
    amountTzs: number
  ) => {
    const userInfo = getNtzsUserInfo();
    if (!userInfo) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const result = await callNTZSTradeAPI({
        action: 'redeemPositionTokens',
        userAddress: userInfo.walletAddress,
        ntzsUserId: userInfo.userId,
        ntzsEmail: userInfo.email,
        marketId: parseMarketId(marketId),
        amountTzs,
      });

      setHash(result.hash);
      setIsSuccess(true);
      setIsPending(false);
      return result;
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false); setIsSuccess(false); setHash(undefined); setError(null);
  }, []);

  return { redeemPosition, isPending, isSuccess, hash, error, reset };
}

/**
 * Redeem winning tokens
 * Winnings are credited to user's nTZS balance
 */
export function useNTZSRedeemWinningsV2() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const redeemWinnings = useCallback(async (
    marketId: bigint | number | string,
    amountTzs: number
  ) => {
    const userInfo = getNtzsUserInfo();
    if (!userInfo) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const result = await callNTZSTradeAPI({
        action: 'redeemWinningTokens',
        userAddress: userInfo.walletAddress,
        ntzsUserId: userInfo.userId,
        ntzsEmail: userInfo.email,
        marketId: parseMarketId(marketId),
        amountTzs,
      });

      setHash(result.hash);
      setIsSuccess(true);
      setIsPending(false);
      return result;
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false); setIsSuccess(false); setHash(undefined); setError(null);
  }, []);

  return { redeemWinnings, isPending, isSuccess, hash, error, reset };
}

/**
 * Cancel market (owner only)
 */
export function useNTZSCancelMarketV2() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const cancelMarket = useCallback(async (marketId: bigint | number | string) => {
    const userInfo = getNtzsUserInfo();
    if (!userInfo) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const result = await callNTZSTradeAPI({
        action: 'cancelMarket',
        userAddress: userInfo.walletAddress,
        ntzsUserId: userInfo.userId,
        ntzsEmail: userInfo.email,
        marketId: parseMarketId(marketId),
      });

      setHash(result.hash);
      setIsSuccess(true);
      setIsPending(false);
      return result;
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false); setIsSuccess(false); setHash(undefined); setError(null);
  }, []);

  return { cancelMarket, isPending, isSuccess, hash, error, reset };
}

/**
 * Claim refund from cancelled market
 * Refund is credited to user's nTZS balance
 */
export function useNTZSClaimRefundV2() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const claimRefund = useCallback(async (
    marketId: bigint | number | string,
    refundAmountTzs?: number
  ) => {
    const userInfo = getNtzsUserInfo();
    if (!userInfo) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const result = await callNTZSTradeAPI({
        action: 'claimRefund',
        userAddress: userInfo.walletAddress,
        ntzsUserId: userInfo.userId,
        ntzsEmail: userInfo.email,
        marketId: parseMarketId(marketId),
        refundAmountTzs,
      });

      setHash(result.hash);
      setIsSuccess(true);
      setIsPending(false);
      return result;
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false); setIsSuccess(false); setHash(undefined); setError(null);
  }, []);

  return { claimRefund, isPending, isSuccess, hash, error, reset };
}
