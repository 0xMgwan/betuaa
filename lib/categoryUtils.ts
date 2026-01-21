// Utility functions for parsing and displaying market categories

export const CATEGORIES = {
  crypto: { label: 'CRYPTO', icon: '₿', color: 'from-orange-500 to-yellow-500' },
  sports: { label: 'SPORTS', icon: '⚽', color: 'from-green-500 to-emerald-500' },
  politics: { label: 'POLITICS', icon: '🏛️', color: 'from-blue-500 to-indigo-500' },
  entertainment: { label: 'ENTERTAINMENT', icon: '🎬', color: 'from-purple-500 to-pink-500' },
  technology: { label: 'TECHNOLOGY', icon: '💻', color: 'from-cyan-500 to-blue-500' },
  other: { label: 'OTHER', icon: '📊', color: 'from-gray-500 to-slate-500' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

/**
 * Extract category from market description
 * Format: [CATEGORY:sports] Description text...
 */
export function extractCategory(description: string): CategoryKey {
  const match = description.match(/^\[CATEGORY:(\w+)\]/);
  if (match && match[1] in CATEGORIES) {
    return match[1] as CategoryKey;
  }
  return 'crypto'; // Default fallback
}

/**
 * Remove category tag from description for display
 */
export function cleanDescription(description: string): string {
  return description.replace(/^\[CATEGORY:\w+\]\s*/, '');
}

/**
 * Get category display info
 */
export function getCategoryInfo(categoryKey: CategoryKey) {
  return CATEGORIES[categoryKey] || CATEGORIES.crypto;
}
