'use client';

import React, { useState } from 'react';
import { X, Mail, Phone, User, Loader, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NtzsRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { 
    userId: string; 
    walletAddress: string; 
    username: string;
    email?: string;
    phone?: string;
  }) => void;
}

type Step = 'contact' | 'username' | 'success';

export default function NtzsRegistrationModal({ isOpen, onClose, onSuccess }: NtzsRegistrationModalProps) {
  const [step, setStep] = useState<Step>('contact');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ntzsUserId, setNtzsUserId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const contactValue = contactMethod === 'email' ? email : phone;
      
      // Use the known wallet address for this user
      const knownWalletAddress = '0xAd66adA45a60f66A9090f98FB65074eC1B06CC54';
      
      // First, try to find existing user by wallet address
      const loginRes = await fetch('/api/ntzs/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactMethod === 'email' ? email : undefined,
          phone: contactMethod === 'phone' ? phone : undefined,
          walletAddress: knownWalletAddress,
        }),
      });

      const loginData = await loginRes.json();

      // If user exists, log them in directly
      if (loginData.user) {
        localStorage.setItem('ntzsUser', JSON.stringify(loginData.user));
        onSuccess(loginData.user);
        onClose();
        return;
      }

      // User doesn't exist, create new account
      const res = await fetch('/api/ntzs/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: contactValue,
          email: contactMethod === 'email' ? email : `${phone}@phone.ntzs.local`,
          phone: contactMethod === 'phone' ? phone : undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setNtzsUserId(data.id);
      setWalletAddress(data.walletAddress);
      setStep('username');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Save user to database
      const res = await fetch('/api/ntzs/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ntzsUserId,
          walletAddress,
          username,
          email: contactMethod === 'email' ? email : undefined,
          phone: contactMethod === 'phone' ? phone : undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Store session - always include email
      localStorage.setItem('ntzsUser', JSON.stringify({
        userId: ntzsUserId,
        walletAddress,
        username,
        email: email || `${phone}@phone.ntzs.local`, // Fallback email if phone registration
        phone: phone || undefined,
      }));

      setStep('success');
      
      setTimeout(() => {
        onSuccess({ 
          userId: ntzsUserId, 
          walletAddress, 
          username,
          email: email || `${phone}@phone.ntzs.local`,
          phone: phone || undefined,
        });
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save username');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('contact');
    setEmail('');
    setPhone('');
    setUsername('');
    setError('');
    setNtzsUserId('');
    setWalletAddress('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={() => {
          resetModal();
          onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl relative">
            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🇹🇿</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Create nTZS Account</h2>
                <p className="text-white/80 text-sm">Get your digital TZS wallet</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {step === 'contact' && (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {/* Contact Method Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setContactMethod('email')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                      contactMethod === 'email'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Mail className="w-4 h-4 inline-block mr-2" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod('phone')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                      contactMethod === 'phone'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Phone className="w-4 h-4 inline-block mr-2" />
                    Phone
                  </button>
                </div>

                {/* Input Field */}
                {contactMethod === 'email' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="255712345678"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter your M-Pesa number (e.g., 255712345678)
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            )}

            {step === 'username' && (
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wallet created! Address:
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-1">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Choose Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="johndoe"
                    required
                    minLength={3}
                    maxLength={20}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    3-20 characters, lowercase letters, numbers, and underscores only
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || username.length < 3}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5" />
                      Complete Registration
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome, {username}!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your nTZS account is ready
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
