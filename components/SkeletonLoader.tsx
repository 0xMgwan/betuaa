'use client';

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function SkeletonPortfolioCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonMarketGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPortfolioGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPortfolioCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}
