// Utility functions for parsing and displaying market categories

export const CATEGORIES = {
  crypto: { label: 'CRYPTO', icon: 'Bitcoin', color: 'from-orange-500 to-yellow-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' },
  sports: { label: 'SPORTS', icon: 'Trophy', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
  politics: { label: 'POLITICS', icon: 'Building2', color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
  entertainment: { label: 'ENTERTAINMENT', icon: 'Clapperboard', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-400' },
  technology: { label: 'TECHNOLOGY', icon: 'Cpu', color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', textColor: 'text-cyan-700 dark:text-cyan-400' },
  other: { label: 'OTHER', icon: 'BarChart3', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30', textColor: 'text-gray-700 dark:text-gray-400' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

/**
 * Extract category from market description
 * Format: [CATEGORY:sports] Description text... OR JSON format
 */
export function extractCategory(description: string): CategoryKey {
  // Try JSON format first
  try {
    const parsed = JSON.parse(description);
    if (parsed.category && parsed.category in CATEGORIES) {
      return parsed.category as CategoryKey;
    }
  } catch {
    // Not JSON, try text format
    const match = description.match(/^\[CATEGORY:(\w+)\]/);
    if (match && match[1] in CATEGORIES) {
      return match[1] as CategoryKey;
    }
  }
  return 'crypto'; // Default fallback
}

/**
 * Remove category tag and Pyth marker from description for display
 * Handles both JSON and text formats
 */
export function cleanDescription(description: string): string {
  // Try JSON format first
  try {
    const parsed = JSON.parse(description);
    if (parsed.text) {
      return parsed.text;
    }
  } catch {
    // Not JSON, clean text format
    return description.replace(/^\[PYTH\]\[CATEGORY:\w+\]\s*/, '').replace(/^\[CATEGORY:\w+\]\s*/, '');
  }
  return description;
}

/**
 * Get category display info
 */
export function getCategoryInfo(categoryKey: CategoryKey) {
  return CATEGORIES[categoryKey] || CATEGORIES.crypto;
}

/**
 * Extract custom outcomes from market description
 * Format: [OUTCOMES:Option1|Option2|Option3] OR JSON format
 */
export function extractCustomOutcomes(description: string): string[] {
  // Try JSON format first
  try {
    const parsed = JSON.parse(description);
    if (parsed.outcomes && Array.isArray(parsed.outcomes)) {
      return parsed.outcomes;
    }
  } catch {
    // Not JSON, try text format
    const match = description.match(/\[OUTCOMES:([^\]]+)\]/);
    if (match) {
      return match[1].split('|').map(o => o.trim()).filter(o => o.length > 0);
    }
  }
  return [];
}

/**
 * Extract resolution type from market description
 * Format: [RESOLUTION:custom] or [RESOLUTION:yesno] OR JSON format
 */
export function extractResolutionType(description: string): 'yesno' | 'custom' {
  // Try JSON format first
  try {
    const parsed = JSON.parse(description);
    if (parsed.resolutionType === 'custom') {
      return 'custom';
    }
    if (parsed.resolutionType === 'yesno') {
      return 'yesno';
    }
  } catch {
    // Not JSON, try text format
    const match = description.match(/\[RESOLUTION:(\w+)\]/);
    if (match && match[1] === 'custom') {
      return 'custom';
    }
  }
  return 'yesno';
}

/**
 * Check if market has an image
 * Format: [IMAGE:true]
 */
export function hasMarketImage(description: string): boolean {
  return /\[IMAGE:true\]/.test(description);
}
