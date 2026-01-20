"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import CategoryTabs from "@/components/CategoryTabs";
import FeaturedMarket from "@/components/FeaturedMarket";
import CompactMarketCard from "@/components/CompactMarketCard";
import MarketModal from "@/components/MarketModal";
import Footer from "@/components/Footer";
import { marketsByCategory, Market } from "@/lib/marketData";
import { generatePriceHistory } from "@/lib/generatePriceHistory";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [renderKey, setRenderKey] = useState(0);

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
          
          <div key={renderKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
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
    </div>
  );
}
