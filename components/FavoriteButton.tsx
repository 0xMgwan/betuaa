'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAccount } from 'wagmi';

interface FavoriteButtonProps {
  marketId: number;
  marketTitle: string;
}

export default function FavoriteButton({ marketId, marketTitle }: FavoriteButtonProps) {
  const { address } = useAccount();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (address) {
      // Load from localStorage
      const favorites = JSON.parse(localStorage.getItem(`favorites_${address}`) || '[]');
      setIsFavorite(favorites.includes(marketId));
    }
  }, [address, marketId]);

  const toggleFavorite = () => {
    if (!address) return;

    const favorites = JSON.parse(localStorage.getItem(`favorites_${address}`) || '[]');
    
    if (isFavorite) {
      // Remove from favorites
      const updated = favorites.filter((id: number) => id !== marketId);
      localStorage.setItem(`favorites_${address}`, JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      // Add to favorites
      const updated = [...favorites, marketId];
      localStorage.setItem(`favorites_${address}`, JSON.stringify(updated));
      setIsFavorite(true);
    }
  };

  if (!address) return null;

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-lg transition-all ${
        isFavorite
          ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={`w-5 h-5 transition-all ${
          isFavorite
            ? 'fill-yellow-500 text-yellow-500'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      />
    </button>
  );
}
