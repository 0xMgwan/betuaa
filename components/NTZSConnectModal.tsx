'use client';

import { useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { X, Smartphone, Loader2, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { storeNtzsWallet } from '@/lib/ntzs-wallet-connector';

interface NTZSConnectModalProps {
  isOpen:  boolean;
  onClose: () => void;
  onConnected?: (address: string) => void;
}

type Step = 'phone' | 'connecting' | 'done' | 'error';

export default function NTZSConnectModal({ isOpen, onClose, onConnected }: NTZSConnectModalProps) {
  const [phone,  setPhone]  = useState('255');
  const [step,   setStep]   = useState<Step>('phone');
  const [error,  setError]  = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  const { connect, connectors } = useConnect();
  const { address: currentAddress } = useAccount();

  if (!isOpen) return null;

  const ntzsConnector = connectors.find(c => c.id === 'ntzs-wallet');

  const handleConnect = async () => {
    if (!phone || phone.length < 12) return;
    setStep('connecting');
    setError(null);

    try {
      // 1. Provision / get nTZS user and their Base wallet address
      const res  = await fetch('/api/ntzs/user', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { userId, walletAddress } = data as { userId: string; walletAddress: `0x${string}` };

      // 2. Persist in localStorage so connector can read it
      storeNtzsWallet(walletAddress, userId, phone);
      setWallet(walletAddress);

      // 3. Trigger wagmi connect using nTZS connector
      if (ntzsConnector) {
        await connect({ connector: ntzsConnector });
      }

      setStep('done');
      onConnected?.(walletAddress);

      // Auto-close after brief success display
      setTimeout(() => {
        onClose();
        setStep('phone');
        setPhone('255');
      }, 1800);

    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Failed to connect. Please try again.');
    }
  };

  const handleClose = () => {
    if (step === 'connecting') return; // Don't allow closing mid-connect
    setStep('phone');
    setPhone('255');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="relative p-6 border-b border-gray-800">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-600/5 pointer-events-none" />

          <button
            onClick={handleClose}
            disabled={step === 'connecting'}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors disabled:opacity-30"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Connect with nTZS</h2>
              <p className="text-xs text-gray-500">Your phone is your wallet</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Phone input step ── */}
          {step === 'phone' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg select-none">🇹🇿</span>
                  <input
                    type="tel"
                    value={phone}
                    autoFocus
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setPhone(v.startsWith('255') ? v : '255' + v.replace(/^255/, ''));
                    }}
                    onKeyDown={e => e.key === 'Enter' && phone.length >= 12 && handleConnect()}
                    placeholder="255712345678"
                    maxLength={12}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Vodacom · Tigo · Airtel · Halotel supported
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={phone.length < 12}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
              >
                Connect Wallet
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Shield className="h-3.5 w-3.5 text-green-600" />
                  <span>Non-custodial Base wallet</span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-[11px] text-gray-600 text-center leading-relaxed">
                  Your phone number provisions a unique Base wallet via nTZS.
                  Deposit & withdraw TZS via M-Pesa instantly.
                </p>
              </div>
            </>
          )}

          {/* ── Connecting step ── */}
          {step === 'connecting' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto ring-2 ring-green-500/20">
                <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-semibold">Provisioning wallet…</p>
                <p className="text-sm text-gray-500 mt-1">Setting up your Base wallet via nTZS</p>
              </div>
            </div>
          )}

          {/* ── Done step ── */}
          {step === 'done' && wallet && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto ring-2 ring-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Wallet connected!</p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  {wallet.slice(0, 10)}…{wallet.slice(-8)}
                </p>
              </div>
            </div>
          )}

          {/* ── Error step ── */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <button
                onClick={() => { setStep('phone'); setError(null); }}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
