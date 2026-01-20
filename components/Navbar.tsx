"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Moon, Sun, Menu, X, Plus } from "lucide-react";
import SearchBar from "./SearchBar";
import WalletConnect from "./WalletConnect";
import CreateMarketModal from "./CreateMarketModal";
import { useTheme } from "./ThemeProvider";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-blue-600">
              BetUAA
            </span>
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-2xl">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium text-sm"
            >
              Markets
            </Link>
            <Link
              href="/ideas"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium text-sm"
            >
              Ideas
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Market
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
            <WalletConnect />
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
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/markets"
              className="block text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Markets
            </Link>
            <Link
              href="/portfolio"
              className="block text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Portfolio
            </Link>
            <Link
              href="/leaderboard"
              className="block text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Leaderboard
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Market
            </button>
            <WalletConnect />
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
