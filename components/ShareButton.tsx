'use client';

import { useState } from 'react';
import { Share2, X as XIcon, MessageCircle, Send, Mail, Copy, Check } from 'lucide-react';

interface ShareButtonProps {
  marketId: number;
  marketTitle: string;
  marketDescription: string;
}

export default function ShareButton({ marketId, marketTitle, marketDescription }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/market/${marketId}`;
  const shareText = `Check out this prediction market: ${marketTitle}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    discord: shareUrl, // Discord doesn't have a direct share URL, users will copy the link
    email: `mailto:?subject=${encodeURIComponent(marketTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Share market"
      >
        <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Share Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                Share this market
              </div>

              {/* Twitter/X */}
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <XIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Share on X</span>
              </a>

              {/* WhatsApp */}
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Share on WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Send className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Share on Telegram</span>
              </a>

              {/* Email */}
              <a
                href={shareLinks.email}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Mail className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Share via Email</span>
              </a>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Copy link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
