"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import CategoryTabs from "@/components/CategoryTabs";
import FeaturedMarket from "@/components/FeaturedMarket";
import CompactMarketCard from "@/components/CompactMarketCard";
import MarketModal from "@/components/MarketModal";
import MarketList from "@/components/MarketList";
import BlockchainMarketModal from "@/components/BlockchainMarketModal";
import ActivityFeed from "@/components/ActivityFeed";
import Footer from "@/components/Footer";
import { marketsByCategory, Market } from "@/lib/marketData";
import { generatePriceHistory } from "@/lib/generatePriceHistory";
import { BlockchainMarket } from "@/hooks/useMarkets";
import { useActivityFeed } from "@/hooks/useActivityFeed";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedBlockchainMarket, setSelectedBlockchainMarket] = useState<BlockchainMarket | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const { activities } = useActivityFeed();

  const displayedMarkets = useMemo(() => {
    const markets = activeCategory === "all" 
      ? Object.values(marketsByCategory).flat()
      : marketsByCategory[activeCategory] || [];
    
    console.log('🔄 Computing displayedMarkets for:', activeCategory);
    console.log('📊 Markets found:', markets.length);
    console.log('🎯 First market ID:', markets[0]?.id, 'Title:', markets[0]?.title?.substring(0, 30));
    
    return markets;
  }, [activeCategory]);

  useEffect(() => {
    console.log('✅ Category changed to:', activeCategory);
    setRenderKey(prev => prev + 1);
  }, [activeCategory]);

  // Add price history to markets
  const marketsWithHistory = displayedMarkets.map(market => ({
    ...market,
    priceHistory: market.priceHistory || generatePriceHistory(market.yesPrice, market.noPrice),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16">
        <CategoryTabs 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FeaturedMarket />
          
          {/* Main Content Grid */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Markets Section */}
            <div className="lg:col-span-2">
              <MarketList onMarketClick={setSelectedBlockchainMarket} />

              <div className="mt-8">
                <div key={renderKey} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {marketsWithHistory.map((market) => (
                    <CompactMarketCard
                      key={`${activeCategory}-${market.id}`}
                      id={market.id}
                      question={market.title}
                      category={market.category}
                      yesPrice={market.yesPrice / 100}
                      noPrice={market.noPrice / 100}
                      volume={market.volume}
                      endDate={market.endDate}
                      trend={market.trend || "up"}
                      priceHistory={market.priceHistory}
                      onClick={() => setSelectedMarket(market)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Activity
                  </h2>
                  <ActivityFeed activities={activities} maxItems={8} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      
      {selectedMarket && (
        <MarketModal
          isOpen={!!selectedMarket}
          onClose={() => setSelectedMarket(null)}
          market={{
            id: selectedMarket.id,
            question: selectedMarket.title,
            category: selectedMarket.category,
            yesPrice: selectedMarket.yesPrice / 100,
            noPrice: selectedMarket.noPrice / 100,
            volume: selectedMarket.volume,
            endDate: selectedMarket.endDate,
            participants: selectedMarket.participants,
            priceHistory: selectedMarket.priceHistory || [],
            description: selectedMarket.description,
          }}
        />
      )}

      {selectedBlockchainMarket && (
        <BlockchainMarketModal
          isOpen={!!selectedBlockchainMarket}
          onClose={() => setSelectedBlockchainMarket(null)}
          market={selectedBlockchainMarket}
        />
      )}
    </div>
  );
}
