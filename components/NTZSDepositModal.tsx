'use client';

import { useState } from 'react';
import { X, Smartphone, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useNTZSDeposit } from '@/hooks/useNTZS';

interface NTZSDepositModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  walletAddress?: string;
}

const PRESETS = [1_000, 5_000, 10_000, 50_000];

const STEPS = [
  { key: 'idle',       label: 'Enter details' },
  { key: 'pending',    label: 'M-Pesa push sent' },
  { key: 'processing', label: 'Processing payment' },
  { key: 'minted',     label: 'nTZS credited' },
] as const;

export default function NTZSDepositModal({ isOpen, onClose, walletAddress }: NTZSDepositModalProps) {
  const [phone,     setPhone]     = useState('255');
  const [amountTzs, setAmountTzs] = useState('');

  const { status, txHash, error, initiateDeposit, reset } = useNTZSDeposit();

  if (!isOpen) return null;

  const isSubmitting = status === 'pending' || status === 'processing';
  const isDone       = status === 'minted';
  const isFailed     = status === 'failed';

  const currentStep = STEPS.findIndex(s => s.key === status);

  const handleSubmit = async () => {
    if (!walletAddress || !phone || !amountTzs) return;
    await initiateDeposit({
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Deposit via M-Pesa</h2>
              <p className="text-xs text-gray-400">Powered by nTZS • Base chain</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Step tracker */}
          {status !== 'idle' && (
            <div className="flex items-center gap-1.5">
              {STEPS.map((step, i) => {
                const isActive    = i === currentStep;
                const isCompleted = i < currentStep || isDone;
                return (
                  <div key={step.key} className="flex items-center gap-1.5 flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive    ? 'bg-blue-500 text-white ring-2 ring-blue-400/40' :
                                    'bg-gray-800 text-gray-500'
                    }`}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded-full transition-colors ${isCompleted ? 'bg-green-500' : 'bg-gray-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Success state */}
          {isDone && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Deposit confirmed!</p>
                <p className="text-sm text-gray-400 mt-1">
                  {Number(amountTzs).toLocaleString()} TZS credited as nTZS to your wallet
                </p>
                {txHash && (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-1 block"
                  >
                    View on Basescan ↗
                  </a>
                )}
              </div>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Deposit failed</p>
                <p className="text-sm text-red-400 mt-1">{error || 'Please try again'}</p>
              </div>
              <Button onClick={reset} variant="outline" className="w-full">Try Again</Button>
            </div>
          )}

          {/* Waiting for M-Pesa confirmation */}
          {isSubmitting && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {status === 'pending' ? 'Check your phone' : 'Processing…'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {status === 'pending'
                    ? `An STK Push was sent to ${phone}. Enter your M-Pesa PIN to confirm.`
                    : 'Payment confirmed. Minting nTZS on Base…'}
                </p>
              </div>
            </div>
          )}

          {/* Input form */}
          {(status === 'idle') && (
            <>
              {/* Phone number */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">M-Pesa Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">🇹🇿</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setPhone(v.startsWith('255') ? v : '255' + v.replace(/^255/, ''));
                    }}
                    placeholder="255712345678"
                    maxLength={12}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                </div>
                <p className="text-[11px] text-gray-600">Vodacom, Tigo, Airtel, Halotel supported</p>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Amount (TZS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">TZS</span>
                  <input
                    type="number"
                    value={amountTzs}
                    onChange={e => setAmountTzs(e.target.value)}
                    placeholder="10,000"
                    min="100"
                    className="w-full pl-12 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setAmountTzs(String(p))}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        Number(amountTzs) === p
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {p >= 1000 ? `${p / 1000}K` : p}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!walletAddress || !phone || phone.length < 12 || !amountTzs || Number(amountTzs) < 100}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold gap-2"
              >
                Deposit {amountTzs ? Number(amountTzs).toLocaleString() : '0'} TZS
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-[11px] text-gray-600 text-center">
                nTZS tokens will be minted to your connected wallet on Base
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
