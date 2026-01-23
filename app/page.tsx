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
import { BlockchainMarket, useAllMarkets } from "@/hooks/useMarkets";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import MarketFilters from "@/components/MarketFilters";
import { useTranslation } from "@/hooks/useTranslation";
import TradingModal from "@/components/TradingModal";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { STABLECOINS } from '@/lib/contracts';

export default function Home() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedBlockchainMarket, setSelectedBlockchainMarket] = useState<BlockchainMarket | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const { activities } = useActivityFeed();
  const { markets: blockchainMarkets, isLoading: isLoadingBlockchain } = useAllMarkets();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'closing' | 'created' | 'activity'>('volume');
  const [showFilters, setShowFilters] = useState(false);

  // Centralized modal state
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<{ marketId: number; outcomeId: number; outcomeName: string; price: number; paymentToken: string } | null>(null);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showConnectPrompt || showTradingModal || selectedBlockchainMarket) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConnectPrompt, showTradingModal, selectedBlockchainMarket]);

  // Handle trade click from cards
  const handleTradeClick = (marketId: number, outcomeId: number, outcomeName: string, price: number, paymentToken: string) => {
    if (!isConnected) {
      setShowConnectPrompt(true);
      return;
    }
    
    setSelectedTrade({ marketId, outcomeId, outcomeName, price, paymentToken });
    setShowTradingModal(true);
  };

  const displayedBlockchainMarkets = useMemo(() => {
    let markets = [...blockchainMarkets];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      markets = markets.filter(market => 
        market.title.toLowerCase().includes(query) ||
        market.description.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      markets = markets.filter(market => {
        const closingDate = new Date(Number(market.closingDate) * 1000);
        const isActive = closingDate > now && !market.resolved;
        const isClosed = closingDate <= now && !market.resolved;
        const isResolved = market.resolved;
        
        if (statusFilter === 'active') return isActive;
        if (statusFilter === 'closed') return isClosed;
        if (statusFilter === 'resolved') return isResolved;
        return true;
      });
    }
    
    // Apply sorting
    markets = [...markets].sort((a, b) => {
      if (sortBy === 'volume') {
        return Number(b.totalVolume) - Number(a.totalVolume);
      }
      if (sortBy === 'closing') {
        return Number(a.closingDate) - Number(b.closingDate);
      }
      if (sortBy === 'created') {
        return b.id - a.id;
      }
      if (sortBy === 'activity') {
        return b.participantCount - a.participantCount;
      }
      return 0;
    });
    
    return markets;
  }, [blockchainMarkets, searchQuery, statusFilter, sortBy]);

  const displayedMarkets = useMemo(() => {
    let markets = activeCategory === "all" 
      ? Object.values(marketsByCategory).flat()
      : marketsByCategory[activeCategory] || [];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      markets = markets.filter(market => 
        market.title.toLowerCase().includes(query) ||
        (market.description?.toLowerCase().includes(query) || false)
      );
    }
    
    // Apply status filter (for mock data, we'll use endDate as proxy)
    if (statusFilter !== 'all') {
      const now = new Date();
      markets = markets.filter(market => {
        const endDateStr = market.endDate;
        const endDate = new Date(endDateStr);
        const isActive = endDate > now;
        
        if (statusFilter === 'active') return isActive;
        if (statusFilter === 'closed') return !isActive;
        if (statusFilter === 'resolved') return false;
        return true;
      });
    }
    
    // Apply sorting
    markets = [...markets].sort((a, b) => {
      if (sortBy === 'volume') {
        const parseVolume = (vol: string) => {
          const num = parseFloat(vol.replace(/[$,M]/g, ''));
          return vol.includes('M') ? num * 1000000 : num;
        };
        return parseVolume(b.volume) - parseVolume(a.volume);
      }
      if (sortBy === 'closing') {
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
      if (sortBy === 'created') {
        return b.id - a.id;
      }
      if (sortBy === 'activity') {
        return b.participants - a.participants;
      }
      return 0;
    });
    
    return markets;
  }, [activeCategory, searchQuery, statusFilter, sortBy]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 md:pb-0">
      <Navbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div className="md:pt-16">
        <div className="hidden md:block">
          <CategoryTabs 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-[180px] md:pt-0 pb-3 md:pb-8">
          <div className="mb-4 md:mb-0 hidden md:block">
            <FeaturedMarket />
          </div>
          
          {/* Main Content Grid */}
          <div className="mt-0 md:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Markets Section */}
            <div className="lg:col-span-2">
              {/* Blockchain Markets - using same card format */}
              {displayedBlockchainMarkets.length > 0 && (
                <div className="mb-0 md:mb-8">
                  {/* First 3 markets - horizontal scroll on mobile */}
                  {displayedBlockchainMarkets.length > 0 && (
                    <div className="mb-3 md:mb-6 overflow-x-auto scrollbar-hide md:hidden">
                      <div className="flex gap-3 pb-2">
                        {displayedBlockchainMarkets.slice(0, 3).map((market) => {
                          const closingDate = new Date(Number(market.closingDate) * 1000);
                          const isActive = closingDate > new Date() && !market.resolved;
                          
                          return (
                            <div key={market.id} className="flex-shrink-0 w-[85vw]">
                              <CompactMarketCard
                                id={market.id}
                                question={market.title}
                                category="CRYPTO"
                                yesPrice={0.50}
                                noPrice={0.50}
                                volume={`$${(Number(market.totalVolume) / 1e6).toFixed(2)}M`}
                                endDate={closingDate.toLocaleDateString()}
                                trend="up"
                                priceHistory={generatePriceHistory(50, 50)}
                                onClick={() => setSelectedBlockchainMarket(market)}
                                onTradeClick={handleTradeClick}
                                isBlockchain={true}
                                status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                                description={market.description}
                                paymentToken={market.paymentToken}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Desktop grid - all markets */}
                  <div className="hidden md:grid grid-cols-2 gap-6">
                    {displayedBlockchainMarkets.map((market) => {
                      const closingDate = new Date(Number(market.closingDate) * 1000);
                      const isActive = closingDate > new Date() && !market.resolved;
                      
                      return (
                        <div key={market.id} onClick={() => setSelectedBlockchainMarket(market)}>
                          <CompactMarketCard
                            id={market.id}
                            question={market.title}
                            category="CRYPTO"
                            yesPrice={0.50}
                            noPrice={0.50}
                            volume={`$${(Number(market.totalVolume) / 1e6).toFixed(2)}M`}
                            endDate={closingDate.toLocaleDateString()}
                            trend="up"
                            priceHistory={generatePriceHistory(50, 50)}
                            onClick={() => setSelectedBlockchainMarket(market)}
                            onTradeClick={handleTradeClick}
                            isBlockchain={true}
                            status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                            description={market.description}
                            paymentToken={market.paymentToken}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Remaining markets on mobile - vertical list */}
                  {displayedBlockchainMarkets.length > 3 && (
                    <div className="md:hidden grid grid-cols-1 gap-3">
                      {displayedBlockchainMarkets.slice(3).map((market) => {
                        const closingDate = new Date(Number(market.closingDate) * 1000);
                        const isActive = closingDate > new Date() && !market.resolved;
                        
                        return (
                          <div key={market.id} onClick={() => setSelectedBlockchainMarket(market)}>
                            <CompactMarketCard
                              id={market.id}
                              question={market.title}
                              category="CRYPTO"
                              yesPrice={0.50}
                              noPrice={0.50}
                              volume={`$${(Number(market.totalVolume) / 1e6).toFixed(2)}M`}
                              endDate={closingDate.toLocaleDateString()}
                              trend="up"
                              priceHistory={generatePriceHistory(50, 50)}
                              onClick={() => setSelectedBlockchainMarket(market)}
                              onTradeClick={handleTradeClick}
                              isBlockchain={true}
                              status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                              description={market.description}
                              paymentToken={market.paymentToken}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 md:mt-8">
                {/* Results Count */}
                <div className="mb-3 md:mb-4 flex items-center justify-between">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {displayedBlockchainMarkets.length + marketsWithHistory.length} {(displayedBlockchainMarkets.length + marketsWithHistory.length) === 1 ? 'market' : 'markets'} found
                  </p>
                </div>

                {/* Markets Grid or Empty State */}
                {displayedBlockchainMarkets.length === 0 && marketsWithHistory.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-2">
                      No markets found
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      Try adjusting your filters or search query
                    </p>
                  </div>
                ) : (
                  marketsWithHistory.length > 0 &&
                  <div key={renderKey} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
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
                )}
              </div>
            </div>

            {/* Activity Feed Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('activity.recentActivity')}
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

      {/* Centralized Connect Wallet Prompt */}
      {showConnectPrompt && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-md" onClick={() => setShowConnectPrompt(false)} style={{ willChange: 'opacity' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full border-2 border-gray-200 dark:border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ willChange: 'transform' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connect Wallet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please connect your wallet to start trading on this market.
            </p>
            <div className="flex flex-col gap-2">
              <ConnectButton />
              <button
                onClick={() => setShowConnectPrompt(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Trading Modal */}
      {selectedTrade && (
        <TradingModal
          isOpen={showTradingModal}
          onClose={() => {
            setShowTradingModal(false);
            setSelectedTrade(null);
          }}
          marketId={selectedTrade.marketId}
          outcomeId={selectedTrade.outcomeId}
          outcomeName={selectedTrade.outcomeName}
          currentPrice={selectedTrade.price}
          paymentToken={selectedTrade.paymentToken}
          tokenSymbol={STABLECOINS.baseSepolia.find(t => t.address.toLowerCase() === selectedTrade.paymentToken.toLowerCase())?.symbol || 'USDC'}
          tokenDecimals={STABLECOINS.baseSepolia.find(t => t.address.toLowerCase() === selectedTrade.paymentToken.toLowerCase())?.decimals || 6}
        />
      )}
    </div>
  );
}
