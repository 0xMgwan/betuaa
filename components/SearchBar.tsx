"use client";

import { Search, Filter, X } from "lucide-react";
import FilterDropdown from "./FilterDropdown";

interface SearchBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  statusFilter?: 'all' | 'active' | 'closed' | 'resolved';
  onStatusFilterChange?: (status: 'all' | 'active' | 'closed' | 'resolved') => void;
  sortBy?: 'volume' | 'closing' | 'created' | 'activity';
  onSortChange?: (sort: 'volume' | 'closing' | 'created' | 'activity') => void;
  placeholder?: string;
}

export default function SearchBar({ 
  searchQuery = "", 
  onSearchChange, 
  showFilters = false,
  onToggleFilters,
  statusFilter = 'all',
  onStatusFilterChange,
  sortBy = 'volume',
  onSortChange,
  placeholder = "Search markets or profiles"
}: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-2xl flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && onSearchChange && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
      {onToggleFilters && (
        <div className="relative">
          <button
            onClick={onToggleFilters}
            className={`p-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
          
          {onStatusFilterChange && onSortChange && (
            <FilterDropdown
              isOpen={showFilters}
              onClose={() => onToggleFilters()}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              sortBy={sortBy}
              onSortChange={onSortChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
