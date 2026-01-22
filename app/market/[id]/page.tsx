'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlockchainMarketModal from '@/components/BlockchainMarketModal';
import { useAllMarkets } from '@/hooks/useMarkets';
import { Loader2 } from 'lucide-react';

export default function MarketPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id ? parseInt(params.id as string) : null;
  const { markets, isLoading } = useAllMarkets();
  const [selectedMarket, setSelectedMarket] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && markets.length > 0 && marketId !== null) {
      const market = markets.find(m => m.id === marketId);
      if (market) {
        setSelectedMarket(market);
      }
    }
  }, [markets, isLoading, marketId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading market...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!selectedMarket) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Market Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The market you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Markets
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24">
        <BlockchainMarketModal
          isOpen={true}
          onClose={() => router.push('/')}
          market={selectedMarket}
        />
      </div>
      <Footer />
    </div>
  );
}
