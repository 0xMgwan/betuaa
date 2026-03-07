'use client';

import React, { useState } from 'react';
import { X, User, Mail, Phone, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    walletAddress: string;
    username: string;
    email?: string;
    phone?: string;
    bio?: string;
    avatar?: string;
  };
  onUpdate: (data: { username?: string; email?: string; phone?: string; bio?: string }) => Promise<void>;
}

export default function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate({ username, email, phone, bio });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </p>
              </div>

              {/* Edit/Save Button */}
              <div className="flex justify-end">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setUsername(user.username);
                        setEmail(user.email || '');
                        setPhone(user.phone || '');
                        setBio(user.bio || '');
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="255XXXXXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
