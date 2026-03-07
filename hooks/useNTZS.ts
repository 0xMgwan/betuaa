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
    if (!walletAddress || !email) return;
    setIsLoading(true);
    try {
      const res  = await window.fetch(`/api/ntzs/balance?address=${walletAddress}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!data.error) setBalance(data);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [walletAddress, email]);

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
        const res  = await window.fetch(`/api/ntzs/deposit/${id}`);
        const data = await res.json();
        if (data.status === 'minted') {
          setStatus('minted');
          setTxHash(data.txHash || null);
          stopPolling();
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError('Deposit failed. Please try again.');
          stopPolling();
        } else {
          setStatus(data.status);
        }
      } catch { /* keep polling */ }
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
      const res = await window.fetch('/api/ntzs/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setDepositId(data.depositId);
      setStatus(data.status ?? 'pending');
      setTxHash(data.txHash);

      // Store the nTZS user ID in localStorage for balance lookups
      if (data.ntzsUserId) {
        const storedUser = localStorage.getItem('ntzsUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.ntzsUserId = data.ntzsUserId;
          localStorage.setItem('ntzsUser', JSON.stringify(userData));
        }
      }
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit');
    }
  }, []);

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
      const res  = await window.fetch('/api/ntzs/withdraw', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setWithdrawalId(data.withdrawalId);
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
