"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, Plus, Trophy, Wallet, BarChart3, User, Languages, LogOut } from "lucide-react";
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

            <div className="mt-auto px-4 py-4 border-t border-gray-200 dark:border-white/10">
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
