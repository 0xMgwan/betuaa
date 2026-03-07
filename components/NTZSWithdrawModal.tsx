'use client';

import { useState } from 'react';
import { X, ArrowUpRight, CheckCircle, XCircle, Loader2, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { useNTZSWithdraw, useNTZSBalance } from '@/hooks/useNTZS';

interface NTZSWithdrawModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  walletAddress?: string;
}

const PRESETS = [1_000, 5_000, 10_000, 50_000];

export default function NTZSWithdrawModal({ isOpen, onClose, walletAddress }: NTZSWithdrawModalProps) {
  const [phone,     setPhone]     = useState('255');
  const [amountTzs, setAmountTzs] = useState('');

  const { balance }                               = useNTZSBalance(walletAddress);
  const { status, withdrawalId, error, initiateWithdraw, reset } = useNTZSWithdraw();

  if (!isOpen) return null;

  const isSubmitting = status === 'pending' || status === 'processing';
  const isDone       = status === 'completed';
  const isFailed     = status === 'failed';

  const maxTzs = balance?.balanceTzs ?? 0;

  const handleSubmit = async () => {
    if (!walletAddress || !phone || !amountTzs) return;
    await initiateWithdraw({
      walletAddress,
      amountTzs: Number(amountTzs),
      phone,
    });
  };

  const handleClose = () => {
    reset();
    setPhone('255');
    setAmountTzs('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Withdraw to M-Pesa</h2>
              <p className="text-xs text-gray-400">Powered by nTZS • Instant</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Balance pill */}
          {balance && status === 'idle' && (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-800/60 rounded-xl border border-gray-700">
              <span className="text-xs text-gray-400">Available nTZS</span>
              <span className="text-sm font-bold text-white">{maxTzs.toLocaleString()} TZS</span>
            </div>
          )}

          {/* Success */}
          {isDone && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Withdrawal sent!</p>
                <p className="text-sm text-gray-400 mt-1">
                  {Number(amountTzs).toLocaleString()} TZS is on its way to {phone}
                </p>
                {withdrawalId && (
                  <p className="text-xs text-gray-600 mt-1">Ref: {withdrawalId.slice(0, 16)}…</p>
                )}
              </div>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
          )}

          {/* Failed */}
          {isFailed && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Withdrawal failed</p>
                <p className="text-sm text-red-400 mt-1">{error || 'Please try again'}</p>
              </div>
              <Button onClick={reset} variant="outline" className="w-full">Try Again</Button>
            </div>
          )}

          {/* Processing */}
          {isSubmitting && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-semibold">Processing withdrawal…</p>
                <p className="text-sm text-gray-400 mt-1">
                  Burning nTZS and sending {Number(amountTzs).toLocaleString()} TZS to M-Pesa
                </p>
              </div>
            </div>
          )}

          {/* Input form */}
          {status === 'idle' && (
            <>
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">M-Pesa Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇹🇿</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setPhone(v.startsWith('255') ? v : '255' + v.replace(/^255/, ''));
                    }}
                    placeholder="255712345678"
                    maxLength={12}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Amount (TZS)</label>
                  {maxTzs > 0 && (
                    <button
                      onClick={() => setAmountTzs(String(maxTzs))}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                    >
                      Max: {maxTzs.toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">TZS</span>
                  <input
                    type="number"
                    value={amountTzs}
                    onChange={e => setAmountTzs(e.target.value)}
                    placeholder="5,000"
                    min="500"
                    max={maxTzs}
                    className="w-full pl-12 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setAmountTzs(String(Math.min(p, maxTzs)))}
                      disabled={p > maxTzs}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${
                        Number(amountTzs) === p
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {p >= 1000 ? `${p / 1000}K` : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insufficient balance warning */}
              {Number(amountTzs) > maxTzs && maxTzs > 0 && (
                <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                  Insufficient nTZS balance
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  !walletAddress ||
                  !phone || phone.length < 12 ||
                  !amountTzs || Number(amountTzs) < 500 ||
                  Number(amountTzs) > maxTzs
                }
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Withdraw {amountTzs ? Number(amountTzs).toLocaleString() : '0'} TZS
              </Button>

              <p className="text-[11px] text-gray-600 text-center">
                Minimum 500 TZS • Fully automated • Powered by nTZS
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
