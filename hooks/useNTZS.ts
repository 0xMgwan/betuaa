'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DepositStatus = 'idle' | 'pending' | 'processing' | 'minted' | 'failed';
export type WithdrawStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

interface NTZSBalance {
  balanceTzs: number;
  balanceNtzs: string;
}

// ─── Balance hook ─────────────────────────────────────────────────────────────

export function useNTZSBalance(walletAddress: string | undefined, email?: string) {
  const [balance, setBalance]     = useState<NTZSBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const res  = await window.fetch(`/api/ntzs/balance?address=${walletAddress}`);
      const data = await res.json();
      if (!data.error) setBalance(data);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [walletAddress]);

  // Initial fetch + 15s polling
  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 15_000);
    return () => clearInterval(id);
  }, [fetch]);

  return { balance, isLoading, refresh: fetch };
}

// ─── Deposit hook ─────────────────────────────────────────────────────────────

export function useNTZSDeposit() {
  const [status,    setStatus]    = useState<DepositStatus>('idle');
  const [depositId, setDepositId] = useState<string | null>(null);
  const [txHash,    setTxHash]    = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollStatus = useCallback((id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await window.fetch(`/api/ntzs/deposits?depositId=${id}`);
        const data = await res.json();
        console.log('[useNTZSDeposit] Poll response:', data);
        if (data.status === 'minted') {
          console.log('[useNTZSDeposit] Deposit minted, stopping polling');
          setStatus('minted');
          setTxHash(data.txHash || null);
          stopPolling();
        } else if (data.status === 'failed' || data.status === 'rejected') {
          console.log('[useNTZSDeposit] Deposit failed/rejected, stopping polling');
          setStatus('failed');
          setError('Deposit failed. Please try again.');
          stopPolling();
        } else {
          console.log('[useNTZSDeposit] Deposit status:', data.status);
          setStatus(data.status);
        }
      } catch (err) { 
        console.error('[useNTZSDeposit] Poll error:', err);
      }
    }, 3_000);
  }, [stopPolling]);

  const initiateDeposit = useCallback(async (params: {
    walletAddress: string;
    amountTzs: number;
    phone: string;
    email?: string;
  }) => {
    setStatus('pending');
    setError(null);
    setDepositId(null);
    setTxHash(null);

    try {
      // First, get or create the nTZS user
      const userRes = await window.fetch('/api/ntzs/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: params.walletAddress,
          email: params.email || `${params.walletAddress.toLowerCase()}@betua.app`,
        }),
      });
      const userData = await userRes.json();
      
      if (userData.error) throw new Error(userData.error);

      // Now create the deposit using the nTZS API
      const res = await window.fetch('/api/ntzs/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.ntzsUserId,
          amountTzs: params.amountTzs,
          phone: params.phone,
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setDepositId(data.id);
      setStatus(data.status ?? 'pending');
      setTxHash(data.txHash);

      // Start polling for status updates
      if (data.id) {
        pollStatus(data.id);
      }

      // Store the nTZS user ID in localStorage for balance lookups
      if (userData.ntzsUserId) {
        const storedUser = localStorage.getItem('ntzsUser');
        if (storedUser) {
          const userDataParsed = JSON.parse(storedUser);
          userDataParsed.ntzsUserId = userData.ntzsUserId;
          localStorage.setItem('ntzsUser', JSON.stringify(userDataParsed));
        }
      }
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit');
    }
  }, [pollStatus]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setDepositId(null);
    setTxHash(null);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  return { status, depositId, txHash, error, initiateDeposit, reset };
}

// ─── Withdraw hook ────────────────────────────────────────────────────────────

export function useNTZSWithdraw(): {
  status: WithdrawStatus;
  withdrawalId: string | null;
  error: string | null;
  initiateWithdraw: (params: {
    walletAddress: string;
    amountTzs: number;
    phone: string;
    email?: string;
  }) => Promise<void>;
  reset: () => void;
} {
  const [status,       setStatus]       = useState<WithdrawStatus>('idle');
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const initiateWithdraw = useCallback(async (params: {
    walletAddress: string;
    amountTzs: number;
    phone: string;
    email?: string;
  }) => {
    setStatus('pending');
    setError(null);
    setWithdrawalId(null);

    try {
      // First, get or create the nTZS user
      const userRes = await window.fetch('/api/ntzs/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: params.walletAddress,
          email: params.email || `${params.walletAddress.toLowerCase()}@betua.app`,
        }),
      });
      const userData = await userRes.json();
      
      if (userData.error) throw new Error(userData.error);

      // Now create the withdrawal using the nTZS API
      const res = await window.fetch('/api/ntzs/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.ntzsUserId,
          amountTzs: params.amountTzs,
          phone: params.phone,
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setWithdrawalId(data.id);
      setStatus(data.status ?? 'pending');
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Failed to initiate withdrawal');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setWithdrawalId(null);
    setError(null);
  }, []);

  return { status, withdrawalId, error, initiateWithdraw, reset };
}
