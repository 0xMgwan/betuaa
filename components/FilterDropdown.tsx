'use client';

import { useEffect, useRef } from 'react';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: 'all' | 'active' | 'closed' | 'resolved';
  onStatusFilterChange: (status: 'all' | 'active' | 'closed' | 'resolved') => void;
  sortBy: 'volume' | 'closing' | 'created' | 'activity';
  onSortChange: (sort: 'volume' | 'closing' | 'created' | 'activity') => void;
}

export default function FilterDropdown({
  isOpen,
  onClose,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    >
      <div className="p-4">
        <div className="space-y-4">
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
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
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
              {[
                { value: 'volume', label: 'Volume', icon: '💰' },
                { value: 'closing', label: 'Closing', icon: '⏰' },
                { value: 'created', label: 'Newest', icon: '✨' },
                { value: 'activity', label: 'Activity', icon: '📈' }
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => onSortChange(value as any)}
                  className={`px-3 py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1 ${
                    sortBy === value
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
