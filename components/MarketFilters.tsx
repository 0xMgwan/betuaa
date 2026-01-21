'use client';

import { Search, Filter, X, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface MarketFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'active' | 'closed' | 'resolved';
  onStatusFilterChange: (status: 'all' | 'active' | 'closed' | 'resolved') => void;
  sortBy: 'volume' | 'closing' | 'created' | 'activity';
  onSortChange: (sort: 'volume' | 'closing' | 'created' | 'activity') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export default function MarketFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  showFilters,
  onToggleFilters,
}: MarketFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search markets..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={onToggleFilters}
          className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            showFilters
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'closed', 'resolved'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => onStatusFilterChange(status)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      statusFilter === status
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSortChange('volume')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 justify-center ${
                    sortBy === 'volume'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Volume
                </button>
                <button
                  onClick={() => onSortChange('closing')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 justify-center ${
                    sortBy === 'closing'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Closing
                </button>
                <button
                  onClick={() => onSortChange('created')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 justify-center ${
                    sortBy === 'created'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Newest
                </button>
                <button
                  onClick={() => onSortChange('activity')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 justify-center ${
                    sortBy === 'activity'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Activity
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    Search: "{searchQuery}"
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                    Status: {statusFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    onSearchChange('');
                    onStatusFilterChange('all');
                  }}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
