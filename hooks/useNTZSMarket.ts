/**
 * useNTZSMarket — drop-in replacements for useCTFMarket hooks
 * that route transactions through the platform wallet API instead
 * of requiring the user to sign with their own wallet.
 *
 * Each hook returns the same shape as the wagmi-based hook so
 * components can swap them in with minimal changes.
 */
import { useState, useCallback } from 'react';

interface TradeResult {
  success: boolean;
  hash?: string;
  marketId?: number;
  blockNumber?: string;
  error?: string;
}

async function callTradeAPI(body: Record<string, any>): Promise<TradeResult> {
  const res = await fetch('/api/market/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Trade failed');
  return data;
}

// ─── Helper to get nTZS user address from localStorage ──────
function getNtzsUserAddress(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Read from ntzsUser (database authentication)
  const storedUser = localStorage.getItem('ntzsUser');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user?.walletAddress || null;
    } catch {
      return null;
    }
  }
  
  return null;
}

// ─── Create Market ───────────────────────────────────────────
export function useNTZSCreateMarket() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [marketId, setMarketId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const createMarket = useCallback(async (
    question: string,
    description: string,
    outcomeCount: bigint,
    closingTime: bigint,
    collateralToken: `0x${string}`
  ) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'createMarket',
        userAddress,
        question,
        description,
        outcomeCount: Number(outcomeCount),
        closingTime: Number(closingTime),
        collateralToken,
      });
      setHash(result.hash);
      setMarketId(result.marketId ?? null);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setHash(undefined);
    setMarketId(null);
    setError(null);
  }, []);

  return { createMarket, hash, isPending, isConfirming: false, isSuccess, error, reset, marketId };
}

// ─── Mint Position Tokens (Buy Shares) ──────────────────────
export function useNTZSMintPositionTokens() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const mintPositionTokens = useCallback(async (marketId: number, amount: bigint, collateralToken?: string) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'mintPositionTokens',
        userAddress,
        marketId,
        amount: amount.toString(),
        collateralToken,
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mintPositionTokens, isPending, isSuccess, error, hash };
}

// ─── Redeem Position Tokens (Sell Shares) ───────────────────
export function useNTZSRedeemPositionTokens() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const redeemPositionTokens = useCallback(async (marketId: number, amount: bigint) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'redeemPositionTokens',
        userAddress,
        marketId,
        amount: amount.toString(),
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { redeemPositionTokens, isPending, isSuccess, error, hash };
}

// ─── Burn Position Tokens (Sell Shares — alias) ─────────────
export function useNTZSBurnPositionTokens() {
  const { redeemPositionTokens, ...rest } = useNTZSRedeemPositionTokens();
  return { burnPositionTokens: redeemPositionTokens, ...rest };
}

// ─── Redeem Winning Tokens (Claim Winnings) ─────────────────
export function useNTZSRedeemWinningTokens() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const redeemWinningTokens = useCallback(async (marketId: number, amount: bigint) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'redeemWinningTokens',
        userAddress,
        marketId,
        amount: amount.toString(),
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { redeemWinningTokens, isPending, isSuccess, error, hash };
}

// ─── Cancel Market ───────────────────────────────────────────
export function useNTZSCancelMarket() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const cancelMarket = useCallback(async (marketId: number) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'cancelMarket',
        userAddress,
        marketId,
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setHash(undefined);
    setError(null);
  }, []);

  return { cancelMarket, hash, isPending, isSuccess, error, reset };
}

// ─── Claim Refund ────────────────────────────────────────────
export function useNTZSClaimRefund() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const claimRefund = useCallback(async (marketId: number) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'claimRefund',
        userAddress,
        marketId,
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setHash(undefined);
    setError(null);
  }, []);

  return { claimRefund, hash, isPending, isSuccess, error, reset };
}

// ─── Place Limit Order ──────────────────────────────────────
export function useNTZSPlaceLimitOrder() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const placeLimitOrder = useCallback(async (
    marketId: number,
    outcomeIndex: number,
    side: number,
    priceBps: number,
    size: bigint,
    collateralToken?: string
  ) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'placeLimitOrder',
        userAddress,
        marketId,
        outcomeIndex,
        side,
        priceBps,
        size: size.toString(),
        collateralToken,
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setHash(undefined);
    setError(null);
  }, []);

  return { placeLimitOrder, hash, isPending, isConfirming: false, isSuccess, error, reset };
}

// ─── Place Market Order ─────────────────────────────────────
export function useNTZSPlaceMarketOrder() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const placeMarketOrder = useCallback(async (
    marketId: number,
    outcomeIndex: number,
    side: number,
    size: bigint,
    maxSlippageBps?: number,
    collateralToken?: string
  ) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'placeMarketOrder',
        userAddress,
        marketId,
        outcomeIndex,
        side,
        size: size.toString(),
        maxSlippageBps: maxSlippageBps || 500,
        collateralToken,
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setHash(undefined);
    setError(null);
  }, []);

  return { placeMarketOrder, hash, isPending, isConfirming: false, isSuccess, error, reset };
}

// ─── Cancel Order ───────────────────────────────────────────
export function useNTZSCancelOrder() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const cancelOrder = useCallback(async (orderId: bigint) => {
    const userAddress = getNtzsUserAddress();
    if (!userAddress) throw new Error('Not signed in');

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    try {
      const result = await callTradeAPI({
        action: 'cancelOrder',
        userAddress,
        orderId: orderId.toString(),
      });
      setHash(result.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { cancelOrder, hash, isPending, isConfirming: false, isSuccess, error };
}

// ─── Approve Token (no-op for nTZS users since platform handles it) ───
export function useNTZSApproveToken() {
  return {
    approve: async () => {},
    isPending: false,
    isSuccess: true,
    error: null,
  };
}
