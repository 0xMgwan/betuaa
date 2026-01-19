"use client";

import { useState } from 'react';
import { X, Wallet as WalletIcon, CreditCard, Link as LinkIcon, DollarSign, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  currentBalance: string;
  onDeposit: (amount: string) => void;
}

const depositMethods = [
  {
    id: 'wallet',
    name: 'Wallet',
    description: 'Instant',
    amount: '$76.50',
    icon: WalletIcon,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'crypto',
    name: 'Transfer Crypto',
    description: 'No limit • Instant',
    icon: Zap,
    color: 'from-blue-500 to-purple-500',
    cryptos: ['BTC', 'ETH', 'USDC', 'USDT', 'SOL', 'MATIC', 'DAI', 'LINK'],
  },
  {
    id: 'card',
    name: 'Deposit with Card',
    description: '$50,000 • 5 min',
    icon: CreditCard,
    color: 'from-green-500 to-emerald-500',
    cards: ['Mastercard', 'Visa'],
  },
  {
    id: 'exchange',
    name: 'Connect Exchange',
    description: 'No limit • 2 min',
    icon: LinkIcon,
    color: 'from-purple-500 to-pink-500',
    exchanges: ['Coinbase', 'Binance', 'Kraken', 'OKX'],
  },
  {
    id: 'paypal',
    name: 'Deposit with PayPal',
    description: '$10,000 • 5 min',
    icon: DollarSign,
    color: 'from-blue-600 to-blue-700',
  },
];

export default function DepositModal({ isOpen, onClose, address, currentBalance, onDeposit }: DepositModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleDeposit = () => {
    if (amount && parseFloat(amount) > 0) {
      onDeposit(amount);
      setAmount('');
      setSelectedMethod(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto relative bg-gradient-to-br from-gray-900 to-gray-950 text-white border-gray-800">
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm p-4 border-b border-gray-800 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-bold mb-1">Deposit</h2>
          <p className="text-sm text-gray-400">
            Balance: <span className="text-white font-semibold">${currentBalance}</span>
          </p>
        </div>

        <div className="p-4 space-y-2">
          {depositMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${method.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{method.name}</div>
                      <div className="text-xs text-gray-400">{method.description}</div>
                      {method.amount && (
                        <div className="text-xs text-green-400 font-medium">
                          {method.amount}
                        </div>
                      )}
                    </div>
                  </div>
                  {method.cryptos && (
                    <div className="flex gap-0.5">
                      {method.cryptos.slice(0, 6).map((crypto) => (
                        <div
                          key={crypto}
                          className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold"
                        >
                          {crypto[0]}
                        </div>
                      ))}
                    </div>
                  )}
                  {method.cards && (
                    <div className="flex gap-1.5">
                      <div className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">MC</div>
                      <div className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">VISA</div>
                    </div>
                  )}
                  {method.exchanges && (
                    <div className="flex gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">C</div>
                      <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-black">B</div>
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">K</div>
                      <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold">O</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {selectedMethod && (
            <div className="mt-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3 text-sm">Enter Amount</h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {['10', '50', '100', '500'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full mt-3"
                size="sm"
              >
                Deposit ${amount || '0.00'}
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-800 bg-gray-900/50">
          <p className="text-[10px] text-gray-500 text-center">
            By depositing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </Card>
    </div>
  );
}
