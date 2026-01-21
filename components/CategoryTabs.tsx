"use client";

import { TrendingUp, Sparkles, Grid3x3, Trophy, Bitcoin, Globe, Briefcase, Zap, Cloud } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const categories = [
  { id: "trending", name: "Trending", icon: TrendingUp },
  { id: "new", name: "New", icon: Sparkles },
  { id: "all", name: "All", icon: Grid3x3 },
  { id: "sports", name: "Sports", icon: Trophy },
  { id: "crypto", name: "Crypto", icon: Bitcoin },
  { id: "politics", name: "Politics", icon: Globe },
  { id: "business", name: "Business", icon: Briefcase },
  { id: "tech", name: "Tech", icon: Zap },
  { id: "climate", name: "Climate", icon: Cloud },
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory touch-pan-x">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 md:py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all snap-start
                  ${
                    isActive
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {t(`categories.${category.id}` as any)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
