'use client';

import React from 'react';
import {
  Bitcoin,
  Trophy,
  Building2,
  Clapperboard,
  Cpu,
  BarChart3,
  LucideIcon,
} from 'lucide-react';
import { CATEGORIES, CategoryKey } from '../lib/categoryUtils';

interface CategoryBadgeProps {
  category: CategoryKey;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Bitcoin,
  Trophy,
  Building2,
  Clapperboard,
  Cpu,
  BarChart3,
};

export default function CategoryBadge({
  category,
  size = 'md',
  showLabel = true,
}: CategoryBadgeProps) {
  // Fallback to 'other' if category is not found
  const categoryInfo = CATEGORIES[category] || CATEGORIES['other'];
  const IconComponent = iconMap[categoryInfo?.icon] || BarChart3;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const containerSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${categoryInfo.bgColor} ${categoryInfo.textColor} rounded-lg px-3 py-1.5 font-medium transition-all hover:shadow-md`}>
      <div className={`${containerSizeClasses[size]} bg-white/20 dark:bg-white/10 rounded-md flex items-center justify-center`}>
        {IconComponent && (
          <IconComponent className={`${sizeClasses[size]} ${categoryInfo.textColor}`} />
        )}
      </div>
      {showLabel && <span className={textSizeClasses[size]}>{categoryInfo.label}</span>}
    </div>
  );
}
