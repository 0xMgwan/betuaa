"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, Plus, Trophy, Wallet, BarChart3, User, Languages, LogOut, Mail } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import CustomConnectButton from "./CustomConnectButton";
import SearchBar from "./SearchBar";
import CreateMarketModal from "./CreateMarketModal";
import { useTheme } from "./ThemeProvider";
import Logo from "./Logo";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsername } from "@/hooks/useUsername";
import { useLanguage } from "@/contexts/LanguageContext";
import CategoryTabs from "./CategoryTabs";

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  statusFilter?: 'all' | 'active' | 'closed' | 'resolved';
  onStatusFilterChange?: (status: 'all' | 'active' | 'closed' | 'resolved') => void;
  sortBy?: 'volume' | 'closing' | 'created' | 'activity';
  onSortChange?: (sort: 'volume' | 'closing' | 'created' | 'activity') => void;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export default function Navbar({ 
  searchQuery, 
  onSearchChange, 
  showFilters, 
  onToggleFilters,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  activeCategory,
  onCategoryChange
}: NavbarProps = {}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { username } = useUsername();
  const { language, setLanguage } = useLanguage();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16 gap-4">
          <Link href="/" className="flex items-center group flex-shrink-0 hover:scale-105 transition-transform">
            <Logo size="md" showText={true} />
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-2xl">
            <SearchBar 
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              placeholder={t('nav.search')}
              showFilters={showFilters}
              onToggleFilters={onToggleFilters}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              sortBy={sortBy}
              onSortChange={onSortChange}
            />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium text-sm"
            >
              {t('nav.markets')}
            </Link>
            <Link
              href="/ideas"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium text-sm"
            >
              {t('nav.ideas')}
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('nav.createMarket')}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <CustomConnectButton />
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="px-4 py-3">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            placeholder={t('nav.search')}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
          />
        </div>
        {activeCategory !== undefined && onCategoryChange && (
          <CategoryTabs 
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
          />
        )}
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-xs bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 shadow-2xl border-r border-gray-200 dark:border-white/10 flex flex-col">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                  <div>
                    <div className="text-sm font-semibold">{username || shortAddress}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{isConnected ? shortAddress : "Not connected"}</div>
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Create Market</span>
              </button>
              <Link
                href={address ? `/profile/${address}` : "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${address ? "hover:bg-gray-100 dark:hover:bg-white/10" : "opacity-50 cursor-not-allowed"}`}
                onClick={() => address && setIsMenuOpen(false)}
              >
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
              <Link
                href="/portfolio"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Wallet className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Portfolio</span>
              </Link>
              <Link
                href="/stats"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Stats</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Leaderboard</span>
              </Link>
            </div>

            <div className="px-4 py-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300">
                <Languages className="h-4 w-4" />
                <span>Language</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setLanguage("en")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${language === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"}`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("sw")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${language === "sw" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"}`}
                >
                  Swahili
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300">
                <span>Theme</span>
              </div>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200 font-semibold transition-colors"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Media Icons */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-center gap-6">
                <a
                  href="mailto:contact@stretch.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/stretch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com/stretch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://github.com/stretch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                </a>
                <a
                  href="https://discord.gg/stretch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="px-4 py-4 border-t border-gray-200 dark:border-white/10">
              <ConnectButton.Custom>
                {({ openConnectModal, openAccountModal, mounted }) => (
                  <button
                    type="button"
                    onClick={isConnected ? openAccountModal : openConnectModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white font-semibold transition-colors"
                    disabled={!mounted}
                  >
                    <LogOut className="h-4 w-4" />
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      )}

      <CreateMarketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </nav>
  );
}
