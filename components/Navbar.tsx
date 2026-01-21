"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, Plus } from "lucide-react";
import CustomConnectButton from "./CustomConnectButton";
import SearchBar from "./SearchBar";
import CreateMarketModal from "./CreateMarketModal";
import { useTheme } from "./ThemeProvider";
import Logo from "./Logo";
import { useTranslation } from "@/hooks/useTranslation";

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  statusFilter?: 'all' | 'active' | 'closed' | 'resolved';
  onStatusFilterChange?: (status: 'all' | 'active' | 'closed' | 'resolved') => void;
  sortBy?: 'volume' | 'closing' | 'created' | 'activity';
  onSortChange?: (sort: 'volume' | 'closing' | 'created' | 'activity') => void;
}

export default function Navbar({ 
  searchQuery, 
  onSearchChange, 
  showFilters, 
  onToggleFilters,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange
}: NavbarProps = {}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
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

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="pb-3 border-b border-gray-200 dark:border-gray-800">
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

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              <Link
                href="/"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Markets
              </Link>
              <Link
                href="/portfolio"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Portfolio
              </Link>
              <Link
                href="/leaderboard"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
                {t('nav.createMarket')}
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex-1 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300 mx-auto" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300 mx-auto" />
                  )}
                </button>
                <div className="flex-1">
                  <CustomConnectButton />
                </div>
              </div>
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
