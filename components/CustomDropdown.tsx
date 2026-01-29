'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
  description?: string;
}

interface CustomDropdownProps {
  options?: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  accentColor?: 'blue' | 'purple' | 'orange' | 'green';
  groupedOptions?: Record<string, DropdownOption[]>;
}

const accentColors = {
  blue: {
    bg: 'from-blue-500 to-cyan-500',
    border: 'border-blue-300 dark:border-blue-600 focus:border-blue-500',
    ring: 'focus:ring-blue-500',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    selected: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500',
  },
  purple: {
    bg: 'from-purple-500 to-pink-500',
    border: 'border-purple-300 dark:border-purple-600 focus:border-purple-500',
    ring: 'focus:ring-purple-500',
    hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    selected: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500',
  },
  orange: {
    bg: 'from-orange-500 to-red-500',
    border: 'border-orange-300 dark:border-orange-600 focus:border-orange-500',
    ring: 'focus:ring-orange-500',
    hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    selected: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500',
  },
  green: {
    bg: 'from-green-500 to-emerald-500',
    border: 'border-green-300 dark:border-green-600 focus:border-green-500',
    ring: 'focus:ring-green-500',
    hover: 'hover:bg-green-50 dark:hover:bg-green-900/20',
    selected: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500',
  },
};

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  icon,
  accentColor = 'blue',
  groupedOptions,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const colors = accentColors[accentColor];

  const allOptions = groupedOptions ? Object.values(groupedOptions).flat() : (options || []);
  const selectedOption = allOptions.find(opt => opt.value === value);
  const filteredOptions = allOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-4 pr-12 border-2 rounded-2xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-bold text-base transition-all duration-300 flex items-center justify-between shadow-lg hover:shadow-xl ${colors.border} ${colors.ring} focus:ring-2 focus:outline-none`}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-lg">{icon}</div>}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-blue-500' : 'text-gray-500 dark:text-gray-400'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {groupedOptions ? (
              Object.entries(groupedOptions).map(([group, groupOpts]) => (
                <div key={group}>
                  <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    {group}
                  </div>
                  {groupOpts
                    .filter(opt =>
                      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between ${
                          value === option.value
                            ? colors.selected
                            : colors.hover
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {option.icon && <span className="text-lg">{option.icon}</span>}
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </div>
                            {option.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {value === option.value && (
                          <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                </div>
              ))
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between ${
                    value === option.value
                      ? colors.selected
                      : colors.hover
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {option.icon && <span className="text-lg">{option.icon}</span>}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {value === option.value && (
                    <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
